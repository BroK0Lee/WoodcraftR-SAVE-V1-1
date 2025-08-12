import { gsap } from "gsap";
import type { RefObject } from "react";
import { GSAP_CONFIG } from "../config";

interface OutroArgs {
  containerRef: RefObject<HTMLDivElement>;
  progressBarRef: RefObject<HTMLDivElement>;
  onComplete: () => void;
}

export async function runGsapOutro({ containerRef, progressBarRef, onComplete }: OutroArgs) {
  // Étendre la barre à 100%
  gsap.to(progressBarRef.current, {
    width: "100%",
    duration: GSAP_CONFIG.outro.bar.duration,
    ease: GSAP_CONFIG.outro.bar.ease,
  });

  // Petite pause
  await new Promise((resolve) => setTimeout(resolve, GSAP_CONFIG.outro.afterBarDelayMs));

  // Disparition du container
  gsap.to(containerRef.current, {
    opacity: 0,
    scale: 0.9,
    duration: GSAP_CONFIG.outro.container.duration,
    ease: GSAP_CONFIG.outro.container.ease,
    onComplete,
  });
}
