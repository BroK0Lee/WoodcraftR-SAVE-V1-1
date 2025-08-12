import { useCallback, useEffect, useRef, useState } from "react";

export interface ProgressTimerOptions {
  step: number; // increment value
  intervalMs: number; // tick frequency
  cap: number; // max value to approach (but not exceed until finish)
}

export function useProgressTimer(options: ProgressTimerOptions) {
  const { step, intervalMs, cap } = options;
  const [value, setValue] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const start = useCallback(() => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setValue((v) => Math.min(v + step, cap));
    }, intervalMs);
  }, [intervalMs, step, cap]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    stop();
    // Utiliser requestAnimationFrame pour éviter une course avec le dernier tick
    requestAnimationFrame(() => setValue(100));
  }, [stop]);

  const reset = useCallback(() => {
    stop();
    setValue(0);
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  return { value, start, stop, finish, reset, setValue } as const;
}
