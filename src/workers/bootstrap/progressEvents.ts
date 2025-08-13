// Étape 1 : émetteur brut sans timers ni segmentation.
// Phases granularisées: start, download, compile-start, compile-done, ready, error.

export type WorkerProgressPhase =
  | "start"
  | "download"
  | "compile-start"
  | "compile-done"
  | "ready"
  | "error";

export interface WorkerProgressEvent {
  type: "oc:progress";
  phase: WorkerProgressPhase;
  rawPct?: number; // % brut (download uniquement)
  ts: number; // horodatage performance.now()
  errorMessage?: string;
}

export type ProgressSink = (evt: WorkerProgressEvent) => void;

export interface ProgressEmitter {
  start(): void;
  reportDownload(rawPct: number): void;
  compileStart(): void;
  compileDone(): void;
  ready(): void;
  error(err: unknown): void;
}

export function createProgressEmitter(post: ProgressSink): ProgressEmitter {
  const emit = (
    phase: WorkerProgressPhase,
    rawPct?: number,
    errorMessage?: string
  ) => post({ type: "oc:progress", phase, rawPct, ts: performance.now(), errorMessage });

  return {
    start() {
      emit("start");
    },
    reportDownload(rawPct: number) {
      emit("download", rawPct);
    },
    compileStart() {
      emit("compile-start");
    },
    compileDone() {
      emit("compile-done");
    },
    ready() {
      emit("ready", 100);
    },
    error(err: unknown) {
      emit(
        "error",
        undefined,
        err instanceof Error ? err.message : String(err)
      );
    },
  };
}
