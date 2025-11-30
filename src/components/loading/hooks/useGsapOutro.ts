import { gsap } from "gsap";
import type { RefObject } from "react";
import { GSAP_CONFIG } from "../config";

interface OutroArgs {
  containerRef: RefObject<HTMLDivElement>;
  progressBarRef: RefObject<HTMLDivElement>;
  onComplete: () => void;
}

export async function runGsapOutro({
  containerRef,
  progressBarRef,
  onComplete,
}: OutroArgs) {
  const prefersReduced =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced) {
    // Appliquer l'état final sans animation
    gsap.set(progressBarRef.current, { width: "100%" });
    gsap.set(containerRef.current, { opacity: 0, scale: 0.9 });
    onComplete();
    return;
  }

  // Étendre la barre à 100%
  gsap.to(progressBarRef.current, {
    width: "100%",
    duration: GSAP_CONFIG.outro.bar.duration,
    ease: GSAP_CONFIG.outro.bar.ease,
  });

  // Petite pause
  await new Promise((resolve) =>
    setTimeout(resolve, GSAP_CONFIG.outro.afterBarDelayMs)
  );

  // Disparition du container
  gsap.to(containerRef.current, {
    opacity: 0,
    scale: 0.9,
    duration: GSAP_CONFIG.outro.container.duration,
    ease: GSAP_CONFIG.outro.container.ease,
    onComplete,
  });
}
