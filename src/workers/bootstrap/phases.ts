// Squelette gestion des phases de chargement OpenCascade
// Phases prévues: start -> download -> compile -> init -> ready | error

export type OccPhase =
  | "idle"
  | "start"
  | "download"
  | "compile"
  | "init"
  | "ready"
  | "error";

export interface PhaseState {
  phase: OccPhase;
  startedAt: number;
  lastPct?: number;
}

const SEGMENTS: Record<string, [number, number]> = {
  download: [0, 40],
  compile: [40, 80],
  init: [80, 100],
};

export function mapPhasePct(phase: OccPhase, rawPct?: number): number | undefined {
  if (phase === "ready") return 100;
  if (phase === "start" || phase === "idle" || phase === "error") return undefined;
  if (rawPct === undefined) return undefined;
  const seg = SEGMENTS[phase];
  if (!seg) return rawPct;
  const [a, b] = seg;
  const clamped = Math.max(0, Math.min(100, rawPct));
  return a + ((b - a) * clamped) / 100;
}

export function createInitialPhaseState(): PhaseState {
  return { phase: "idle", startedAt: performance.now() };
}

export function transition(state: PhaseState, next: OccPhase): PhaseState {
  return { phase: next, startedAt: performance.now(), lastPct: state.lastPct };
}
