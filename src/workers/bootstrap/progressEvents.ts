// Étape 2 : Timers segmentés + pourcentage global (pct) mappé 0-100.
// Segments:
//  - download (réel)   : 0 → 40
//  - compile (timer)    : 40 → 80  (durée min COMPILE_MIN_MS)
//  - init (timer)       : 80 → 100 (durée min READY_MIN_MS) bloque à 99% tant que ready non signalé

export type WorkerProgressPhase =
  | "start"
  | "download"
  | "compile-start"
  | "compile"
  | "compile-done"
  | "init"
  | "ready"
  | "error";

export interface WorkerProgressEvent {
  type: "oc:progress";
  phase: WorkerProgressPhase;
  rawPct?: number; // % brut (download uniquement)
  pct?: number; // % global segmenté
  ts: number; // performance.now()
  errorMessage?: string;
}

export type ProgressSink = (evt: WorkerProgressEvent) => void;

export interface ProgressEmitter {
  start(): void;
  reportDownload(rawPct: number): void;
  compileStart(): void;
  compileDone(): void;
  ready(): void; // signal readiness (peut arriver avant la fin du timer init)
  error(err: unknown): void;
}

const DL_RANGE: [number, number] = [0, 40];
const COMPILE_RANGE: [number, number] = [40, 80];
const INIT_RANGE: [number, number] = [80, 100];
const COMPILE_MIN_MS = 20_000; // 20s minimale
const READY_MIN_MS = 5_000; // 5s minimale
const TICK_MS = 100; // fréquence d'émission

interface InternalState {
  started: boolean;
  downloadDone: boolean;
  compileStartedAt?: number;
  compileFinishedAt?: number;
  compileTimer?: number;
  compileProgress: number; // 0..1
  initStartedAt?: number;
  initTimer?: number;
  initProgress: number; // 0..1
  readySignaled: boolean;
  finalEmitted: boolean;
  lastPct?: number;
}

export function createProgressEmitter(post: ProgressSink): ProgressEmitter {
  const st: InternalState = {
    started: false,
    downloadDone: false,
    compileProgress: 0,
    initProgress: 0,
    readySignaled: false,
    finalEmitted: false,
  };

  function mapSegment(range: [number, number], t: number) {
    const [a, b] = range;
    const clamped = Math.max(0, Math.min(1, t));
    return a + (b - a) * clamped;
  }

  function emit(evt: Omit<WorkerProgressEvent, "ts" | "type">) {
    const now = performance.now();
    post({ type: "oc:progress", ts: now, ...evt });
    if (evt.pct !== undefined) st.lastPct = evt.pct;
  }

  function maybeStartInitPhase() {
    if (
      st.initStartedAt === undefined &&
      st.compileProgress >= 1 &&
      st.compileFinishedAt !== undefined
    ) {
      st.initStartedAt = performance.now();
      emit({ phase: "init", pct: INIT_RANGE[0] });
      st.initTimer = self.setInterval(tickInit, TICK_MS);
    }
  }

  function tickCompile() {
    if (!st.compileStartedAt) return;
    const elapsed = performance.now() - st.compileStartedAt;
    const frac = Math.min(1, elapsed / COMPILE_MIN_MS);
    st.compileProgress = frac;
    const pct = mapSegment(COMPILE_RANGE, st.compileProgress);
    emit({ phase: "compile", pct });
    if (st.compileFinishedAt !== undefined && st.compileProgress >= 1) {
      clearInterval(st.compileTimer);
      st.compileTimer = undefined;
      emit({ phase: "compile-done", pct: COMPILE_RANGE[1] });
      maybeStartInitPhase();
    } else if (
      st.compileFinishedAt !== undefined &&
      st.compileProgress >= 1 - 1e-6
    ) {
      maybeStartInitPhase();
    } else if (
      st.compileFinishedAt !== undefined &&
      elapsed >= COMPILE_MIN_MS
    ) {
      clearInterval(st.compileTimer);
      st.compileTimer = undefined;
      st.compileProgress = 1;
      emit({ phase: "compile-done", pct: COMPILE_RANGE[1] });
      maybeStartInitPhase();
    }
  }

  function tickInit() {
    if (st.initStartedAt === undefined) return;
    const elapsed = performance.now() - st.initStartedAt;
    const frac = Math.min(1, elapsed / READY_MIN_MS);
    st.initProgress = frac;
    let pct = mapSegment(INIT_RANGE, st.initProgress);
    if (pct >= 100) pct = 100;
    if (!st.readySignaled && pct >= 99) pct = 99;
    emit({ phase: "init", pct });
    if (st.readySignaled && st.initProgress >= 1 && !st.finalEmitted) {
      st.finalEmitted = true;
      clearInterval(st.initTimer);
      st.initTimer = undefined;
      emit({ phase: "ready", pct: 100 });
    } else if (st.initProgress >= 1 && !st.readySignaled) {
      clearInterval(st.initTimer);
      st.initTimer = undefined;
    }
  }

  return {
    start() {
      if (st.started) return;
      st.started = true;
      emit({ phase: "start", pct: 0 });
    },
    reportDownload(rawPct: number) {
      if (!st.started) this.start();
      const clamped = Math.max(0, Math.min(100, rawPct));
      const pct = mapSegment(DL_RANGE, clamped / 100);
      if (clamped >= 100 && !st.downloadDone) st.downloadDone = true;
      emit({ phase: "download", rawPct: clamped, pct });
    },
    compileStart() {
      if (st.compileStartedAt) return;
      st.compileStartedAt = performance.now();
      emit({ phase: "compile-start", pct: COMPILE_RANGE[0] });
      st.compileTimer = self.setInterval(tickCompile, TICK_MS);
    },
    compileDone() {
      if (st.compileFinishedAt !== undefined) return;
      st.compileFinishedAt = performance.now();
      tickCompile();
    },
    ready() {
      st.readySignaled = true;
      if (st.initStartedAt === undefined) {
        maybeStartInitPhase();
      }
      if (
        st.initStartedAt !== undefined &&
        st.initProgress >= 1 &&
        !st.finalEmitted
      ) {
        st.finalEmitted = true;
        clearInterval(st.initTimer);
        st.initTimer = undefined;
        emit({ phase: "ready", pct: 100 });
      }
    },
    error(err: unknown) {
      emit({
        phase: "error",
        errorMessage: err instanceof Error ? err.message : String(err),
        pct: st.lastPct,
      });
    },
  };
}
