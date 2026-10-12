import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { SimulatorView } from "./components/SimulatorView";

// Lazy-loaded views (not needed on the default Simulator tab)
const LabsAndScenariosView = lazy(() =>
  import("./components/LabsAndScenariosView").then((m) => ({
    default: m.LabsAndScenariosView,
  })),
);
const LabWorkspace = lazy(() =>
  import("./components/LabWorkspace").then((m) => ({
    default: m.LabWorkspace,
  })),
);
const IncidentWorkspace = lazy(() =>
  import("./components/IncidentWorkspace").then((m) => ({
    default: m.IncidentWorkspace,
  })),
);
const AfterActionReview = lazy(() =>
  import("./components/AfterActionReview").then((m) => ({
    default: m.AfterActionReview,
  })),
);
import { ConfirmModal } from "./components/ConfirmModal";
import { MissionBriefing } from "./components/MissionBriefing";
import { MissionModeBar } from "./components/MissionModeBar";
import { NarrativeResolution } from "./components/NarrativeResolution";
import { SpacedReviewDrill } from "./components/SpacedReviewDrill";
import { TierUnlockNotificationContainer } from "./components/TierUnlockNotification";
import { FaultToastContainer } from "./components/FaultToast";
import { SyncToast } from "./components/SyncToast";
import { AuthToast } from "./components/AuthToast";
import { useSimulationStore } from "./store/simulationStore";
import { useLearningProgressStore } from "./store/learningProgressStore";
import { useMetricsSimulation } from "./hooks/useMetricsSimulation";
import { useIncidentSession } from "./hooks/useIncidentSession";
import { initializeScenario } from "./utils/scenarioLoader";
import { AppHeader, type View } from "./components/AppHeader";
import { useCloudSync } from "./hooks/useCloudSync";

const ViewFallback = () => (
  <div className="flex-1 flex items-center justify-center text-gray-500">
    Loading...
  </div>
);

function App() {
  const [currentView, setCurrentView] = useState<View>("simulator");
  const [showLabWorkspace, setShowLabWorkspace] = useState(false);
  const [showSpacedReviewDrill, setShowSpacedReviewDrill] = useState(false);
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);

  const { manualRetry } = useCloudSync();

  // Get due reviews count from learning progress store
  const dueReviews = useLearningProgressStore((state) => state.getDueReviews());
  const dueReviewCount = dueReviews.length;


  const {
    cluster,
    isRunning,
    startSimulation,
    stopSimulation,
    resetSimulation,
    activeScenario,
    scenarioProgress,
    exitScenario,
    quizResults,
    completeScenarioStep,
  } = useSimulationStore();

  // Narrative modal state for active scenarios
  const [showNarrativeIntro, setShowNarrativeIntro] = useState(true);
  const [showDashboardSlideOver, setShowDashboardSlideOver] = useState(false);
  const scenarioProgressData = activeScenario
    ? scenarioProgress[activeScenario.id]
    : undefined;
  const isNarrative = !!activeScenario?.narrative;

  // Compute quiz score from store for NarrativeResolution
  const quizScore = activeScenario
    ? {
        correct: Object.values(quizResults).filter(Boolean).length,
        total: activeScenario.steps.filter((s) => s.narrativeQuiz).length,
      }
    : { correct: 0, total: 0 };

  // Reset narrative intro when a new scenario starts
  useEffect(() => {
    if (activeScenario) {
      setShowNarrativeIntro(true);
      setShowDashboardSlideOver(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally track by ID, not object reference
  }, [activeScenario?.id]);

  // Activate metrics simulation when running
  useMetricsSimulation(isRunning);

  // Incident session orchestrator
  const incidentSession = useIncidentSession();
  const {
    incidentState,
    situation: incidentSituation,
    workflowPhases,
    reviewData,
    rootCauseOptions,
    diagnosticPath,
    startIncident,
    submitDiagnosis,
    abandonIncident,
    requestHint,
  } = incidentSession;
  // incidentSession.recordCommand is available for Terminal integration (Task 15)

  // One-time cleanup of deprecated learning path localStorage keys
  useEffect(() => {
    localStorage.removeItem("ncp-aii-completed-lessons");
    localStorage.removeItem("ncp-aii-completed-modules");
    localStorage.removeItem("ncp-aii-lesson-progress");
  }, []);


  const handleStartScenario = async (scenarioId: string) => {
    const success = await initializeScenario(scenarioId);
    if (success) {
      setCurrentView("simulator");
      setShowLabWorkspace(true);
    }
  };

  const handleAbortMission = useCallback(() => {
    setShowAbortConfirm(true);
  }, []);

  const confirmAbortMission = useCallback(() => {
    setShowAbortConfirm(false);
    exitScenario();
    setShowLabWorkspace(false);
    setShowDashboardSlideOver(false);
  }, [exitScenario]);

  // Mission Mode derivations
  const isMissionMode =
    activeScenario != null &&
    !showNarrativeIntro &&
    !scenarioProgressData?.completed;

  const missionProgress = activeScenario
    ? scenarioProgress[activeScenario.id]
    : undefined;
  const missionStepIndex = missionProgress?.currentStepIndex ?? 0;

  // Check if the current step has faults that visually affect the dashboard
  const DASHBOARD_FAULT_TYPES = new Set([
    "xid-error",
    "thermal",
    "ecc-error",
    "nvlink-failure",
    "gpu-hang",
    "power",
    "memory-full",
    "driver-error",
    "pcie-error",
    "allocate-job",
    "set-slurm-state",
    "add-node",
  ]);
  const currentStepFaults = activeScenario?.steps[missionStepIndex]?.autoFaults;
  const scenarioFaults = activeScenario?.faults;
  const hasDashboardUpdate =
    !!currentStepFaults?.some((f) => DASHBOARD_FAULT_TYPES.has(f.type)) ||
    !!scenarioFaults?.some((f) => DASHBOARD_FAULT_TYPES.has(f.type));

  const handleStartIncident = useCallback(
    (difficulty: string, domain?: number) => {
      startIncident(difficulty, domain);
      setCurrentView("simulator");
    },
    [startIncident],
  );


  // Handler for tier unlock notification "Try Now" button
  const handleNavigateToTier = useCallback(
    (_familyId: string, _tier: number) => {
      setCurrentView("labs");
    },
    [],
  );

  return (
    <div className="app-shell bg-gray-950 text-gray-100 flex flex-col overflow-hidden">
      {isMissionMode ? (
        <>
          {/* Mission Mode layout: slim bar + instruction panel + terminal */}
          <MissionModeBar
            title={activeScenario!.title}
            currentStep={missionStepIndex}
            totalSteps={activeScenario!.steps.length}
            tier={activeScenario!.tier}
            onAbort={handleAbortMission}
            onToggleDashboard={() => setShowDashboardSlideOver((v) => !v)}
            isDashboardActive={showDashboardSlideOver}
            hasDashboardUpdate={hasDashboardUpdate && !showDashboardSlideOver}
          />
          <SimulatorView
            className="flex-1 h-full"
            missionMode={true}
            showDashboard={showDashboardSlideOver}
          />
        </>
      ) : (
        <>
          <AppHeader
            currentView={currentView}
            onViewChange={setCurrentView}
            cluster={cluster}
            isRunning={isRunning}
            onStartSimulation={startSimulation}
            onStopSimulation={stopSimulation}
            onResetSimulation={resetSimulation}
            dueReviewCount={dueReviewCount}
            onReviewClick={() => setShowSpacedReviewDrill(true)}
            sidebarOpen={
              (showLabWorkspace && !activeScenario) ||
              incidentState === "active"
            }
          />

          {/* Main Content */}
          <main
            id="main-content"
            role="tabpanel"
            aria-labelledby={`tab-${currentView}`}
            className={`flex-1 h-0 flex flex-col overflow-hidden transition-all duration-300 ${(showLabWorkspace && !activeScenario) || incidentState === "active" ? "xl:ml-[clamp(340px,30vw,560px)]" : ""}`}
          >
            {currentView === "simulator" && (
              <SimulatorView className="flex-1 h-full" />
            )}

            <Suspense fallback={<ViewFallback />}>
              {currentView === "labs" && (
                <LabsAndScenariosView
                  onStartScenario={handleStartScenario}
                  onStartIncident={handleStartIncident}
                />
              )}

            </Suspense>
          </main>


          {/* Lab Workspace Overlay — hidden during active scenarios (MissionCard takes over) */}
          <Suspense fallback={null}>
            {showLabWorkspace && !activeScenario && (
              <LabWorkspace onClose={() => setShowLabWorkspace(false)} />
            )}
          </Suspense>
        </>
      )}

      {/* Mission Briefing (replaces NarrativeIntro for narrative missions) */}
      {activeScenario &&
        isNarrative &&
        showNarrativeIntro &&
        !scenarioProgressData?.completed && (
          <MissionBriefing
            title={activeScenario.title}
            narrative={activeScenario.narrative!}
            tier={activeScenario.tier}
            estimatedTime={activeScenario.estimatedTime}
            onBegin={() => setShowNarrativeIntro(false)}
            skippable={activeScenario.skippable}
            onSkip={() => {
              activeScenario.steps.forEach((step) => {
                completeScenarioStep(activeScenario.id, step.id);
              });
              setShowNarrativeIntro(false);
            }}
          />
        )}

      {/* Narrative Resolution Modal (missions) */}
      {activeScenario && isNarrative && scenarioProgressData?.completed && (
        <NarrativeResolution
          resolution={activeScenario.narrative!.resolution}
          quizScore={quizScore}
          timeSpent={activeScenario.estimatedTime}
          onExit={() => {
            exitScenario();
            setShowLabWorkspace(false);
          }}
        />
      )}


      {/* Incident Workspace Overlay */}
      {incidentState === "active" && (
        <Suspense fallback={null}>
          <IncidentWorkspace
            situation={incidentSituation}
            phaseHistory={workflowPhases}
            rootCauseOptions={rootCauseOptions}
            diagnosticPath={diagnosticPath}
            onSubmitDiagnosis={submitDiagnosis}
            onRequestHint={requestHint}
            onClose={abandonIncident}
          />
        </Suspense>
      )}

      {/* After-Action Review Overlay */}
      {incidentState === "review" && reviewData && (
        <Suspense fallback={null}>
          <AfterActionReview
            score={reviewData.score}
            correctDiagnosis={reviewData.correctDiagnosis}
            selectedRootCause={reviewData.selectedRootCause}
            correctRootCause={reviewData.correctRootCause}
            events={reviewData.events}
            commands={reviewData.commands}
            tip={reviewData.tip}
            onReviewOptimalPath={() => {
              /* TODO: launch as guided scenario */
            }}
            onRestart={() =>
              handleStartIncident(reviewData.difficulty, reviewData.domain)
            }
            onClose={abandonIncident}
          />
        </Suspense>
      )}

      {/* Spaced Review Drill Modal */}
      {showSpacedReviewDrill && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
          <SpacedReviewDrill
            onComplete={() => setShowSpacedReviewDrill(false)}
            onSnooze={() => setShowSpacedReviewDrill(false)}
          />
        </div>
      )}

      {/* Tier Unlock Notifications */}
      <TierUnlockNotificationContainer
        onNavigateToTier={handleNavigateToTier}
      />

      {/* Fault Injection Toast Notifications */}
      <FaultToastContainer />

      {/* Cloud Sync Toast Notifications */}
      <SyncToast onRetry={manualRetry} />

      {/* Auth Toast Notifications */}
      <AuthToast />

      {/* Abort Mission Confirm Modal */}
      <ConfirmModal
        isOpen={showAbortConfirm}
        title="Abort Mission"
        message="Abort this mission? Your progress on the current step will be lost."
        confirmLabel="Abort"
        cancelLabel="Continue Mission"
        onConfirm={confirmAbortMission}
        onCancel={() => setShowAbortConfirm(false)}
      />
    </div>
  );
}

export default App;
