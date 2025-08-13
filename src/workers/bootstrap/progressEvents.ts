import { createInitialPhaseState, mapPhasePct, transition, type OccPhase } from "./phases";

export type WorkerProgressEvent = {
  type: "oc:progress";
  phase: OccPhase;
  pct?: number; // segmenté
  rawPct?: number; // brut (download)
  message?: string;
};

export type ProgressSink = (evt: WorkerProgressEvent) => void;

export function createProgressEmitter(post: ProgressSink) {
  let state = createInitialPhaseState();

  function emit(phase: OccPhase, rawPct?: number, message?: string) {
    state = transition(state, phase);
    const pct = mapPhasePct(phase, rawPct);
    post({ type: "oc:progress", phase, pct, rawPct, message });
    if (pct !== undefined) state.lastPct = pct;
  }

  return {
    start() {
      emit("start");
    },
    reportDownload(rawPct: number) {
      emit("download", rawPct);
    },
    compileStart() {
      emit("compile");
    },
    initStart() {
      emit("init", 0);
    },
    ready() {
      emit("ready", 100);
    },
    error(message: string) {
      emit("error", undefined, message);
    },
  };
}
