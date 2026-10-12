import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock lucide-react icons
vi.mock("lucide-react", () => {
  const mk = (n: string) => {
    const C = () => null;
    C.displayName = n;
    return C;
  };
  return {
    Monitor: mk("Monitor"),
    FlaskConical: mk("FlaskConical"),
    Play: mk("Play"),
    Pause: mk("Pause"),
    RotateCcw: mk("RotateCcw"),
  };
});

import { AppHeader } from "../AppHeader";
import type { ClusterConfig } from "../../types/hardware";

const defaultProps = {
  currentView: "simulator" as const,
  onViewChange: vi.fn(),
  cluster: {
    name: "Test Cluster",
    nodes: [{ gpus: [{ id: "0" }, { id: "1" }] }],
  } as unknown as ClusterConfig,
  isRunning: false,
  onStartSimulation: vi.fn(),
  onStopSimulation: vi.fn(),
  onResetSimulation: vi.fn(),
  dueReviewCount: 0,
  onReviewClick: vi.fn(),
  sidebarOpen: false,
};

describe("AppHeader", () => {
  it("renders the MTGPU-Sim brand", () => {
    render(<AppHeader {...defaultProps} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "MTGPU-Sim",
    );
  });

  it("renders only the Simulator and Labs views", () => {
    render(<AppHeader {...defaultProps} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Simulator", "Labs"]);
  });

  it("does not render tour, feedback, sign-in or version details", () => {
    render(<AppHeader {...defaultProps} />);
    expect(screen.queryByText("Tour")).toBeNull();
    expect(screen.queryByText("Feedback")).toBeNull();
    expect(screen.queryByText(/sign in/i)).toBeNull();
    expect(screen.queryByText(/NCP-AII/)).toBeNull();
    expect(screen.queryByText(/^v\d/)).toBeNull();
  });

  it("switches views", () => {
    const onViewChange = vi.fn();
    render(<AppHeader {...defaultProps} onViewChange={onViewChange} />);
    fireEvent.click(screen.getByTestId("nav-labs"));
    expect(onViewChange).toHaveBeenCalledWith("labs");
  });

  it("renders cluster info", () => {
    render(<AppHeader {...defaultProps} />);
    expect(screen.getByText("Test Cluster")).toBeInTheDocument();
  });

  it("shows the review badge on Labs when reviews are due", () => {
    render(<AppHeader {...defaultProps} dueReviewCount={3} />);
    expect(screen.getByRole("status").textContent).toBe("3");
  });
});
