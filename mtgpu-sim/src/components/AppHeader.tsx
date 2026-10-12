import { Monitor, FlaskConical, Play, Pause, RotateCcw } from "lucide-react";
import type { ClusterConfig } from "../types/hardware";

export type View = "simulator" | "labs";

interface AppHeaderProps {
  currentView: View;
  onViewChange: (view: View) => void;
  cluster: ClusterConfig;
  isRunning: boolean;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onResetSimulation: () => void;
  dueReviewCount: number;
  onReviewClick: () => void;
  sidebarOpen: boolean;
}

const VIEWS: { id: View; label: string; Icon: typeof Monitor }[] = [
  { id: "simulator", label: "Simulator", Icon: Monitor },
  { id: "labs", label: "Labs", Icon: FlaskConical },
];

/** Small 2x2 "GPU grid" brand mark. */
function BrandMark() {
  return (
    <div
      className="grid grid-cols-2 gap-[3px] w-6 h-6 p-[3px] rounded-md bg-gray-800 ring-1 ring-nvidia-green/40"
      aria-hidden="true"
    >
      <span className="rounded-[2px] bg-nvidia-green" />
      <span className="rounded-[2px] bg-nvidia-green/60" />
      <span className="rounded-[2px] bg-nvidia-green/60" />
      <span className="rounded-[2px] bg-nvidia-green" />
    </div>
  );
}

export function AppHeader({
  currentView,
  onViewChange,
  cluster,
  isRunning,
  onStartSimulation,
  onStopSimulation,
  onResetSimulation,
  dueReviewCount,
  onReviewClick,
  sidebarOpen,
}: AppHeaderProps) {
  const gpuCount = cluster.nodes.reduce(
    (sum, n) => sum + (n?.gpus?.length ?? 0),
    0,
  );

  return (
    <>
      {/* Skip Link for Keyboard Navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-nvidia-green focus:text-black focus:px-3 focus:py-1.5 focus:rounded"
      >
        Skip to main content
      </a>

      <header
        className={`flex-shrink-0 h-12 px-4 flex items-center gap-4 bg-gray-950 border-b border-gray-800 transition-all duration-300 ${sidebarOpen ? "xl:ml-[clamp(340px,30vw,560px)]" : ""}`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <BrandMark />
          <h1 className="text-[15px] font-semibold tracking-tight text-gray-100 whitespace-nowrap">
            MTGPU<span className="text-nvidia-green">-Sim</span>
          </h1>
        </div>

        {/* View switch */}
        <nav
          role="tablist"
          aria-label="Main navigation"
          className="mx-auto flex items-center gap-1 p-1 rounded-full bg-gray-900 ring-1 ring-gray-800"
        >
          {VIEWS.map(({ id, label, Icon }) => {
            const active = currentView === id;
            return (
              <button
                key={id}
                role="tab"
                id={`tab-${id}`}
                data-testid={`nav-${id}`}
                aria-selected={active}
                aria-controls={`panel-${id}`}
                onClick={() => onViewChange(id)}
                className={`relative flex items-center gap-1.5 px-4 py-1 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? "bg-nvidia-green text-gray-950"
                    : "text-gray-400 hover:text-gray-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {id === "labs" && dueReviewCount > 0 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onReviewClick();
                    }}
                    role="status"
                    className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-gray-950 text-[10px] font-bold rounded-full cursor-pointer"
                    title={`${dueReviewCount} review${dueReviewCount > 1 ? "s" : ""} due`}
                    aria-label={`${dueReviewCount} reviews due. Click to start review drill.`}
                  >
                    {dueReviewCount > 9 ? "9+" : dueReviewCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Cluster + simulation controls */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 whitespace-nowrap">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-nvidia-green animate-pulse" : "bg-gray-600"}`}
            />
            <span className="text-gray-300">{cluster.name}</span>
            <span className="text-gray-600">·</span>
            <span>
              {cluster.nodes.length} nodes / {gpuCount} GPUs
            </span>
          </div>
          <div
            data-tour="sim-controls"
            className="flex items-center gap-1 p-0.5 rounded-lg bg-gray-900 ring-1 ring-gray-800"
          >
            <button
              onClick={isRunning ? onStopSimulation : onStartSimulation}
              className={`p-1.5 rounded-md transition-colors ${
                isRunning
                  ? "text-amber-400 hover:bg-gray-800"
                  : "text-nvidia-green hover:bg-gray-800"
              }`}
              title={isRunning ? "Pause Simulation" : "Start Simulation"}
            >
              {isRunning ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onResetSimulation}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
              title="Reset Simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
