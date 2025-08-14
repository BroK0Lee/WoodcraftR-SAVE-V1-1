import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { gsap } from "gsap";
import { GSAP_CONFIG } from "../config";

interface IntroRefs {
  logoRef: RefObject<HTMLDivElement>;
  progressBarRef: RefObject<HTMLDivElement>;
}

// Animation d'intro stabilisée (une seule exécution) sans stepsRef
export function useGsapIntro({ logoRef, progressBarRef }: IntroRefs) {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return; // empêcher redémarrages
    ranRef.current = true;

    const prefersReduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      gsap.set(logoRef.current, { scale: 1, rotation: 0, opacity: 1 });
      gsap.set(progressBarRef.current, { scaleX: 1 });
      return;
    }

    gsap.fromTo(
      logoRef.current,
      { scale: 0, rotation: -180, opacity: 0 },
      {
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: GSAP_CONFIG.intro.logo.duration,
        ease: GSAP_CONFIG.intro.logo.ease,
        delay: GSAP_CONFIG.intro.logo.delay,
      }
    );

    gsap.fromTo(
      progressBarRef.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: GSAP_CONFIG.intro.bar.duration,
        ease: GSAP_CONFIG.intro.bar.ease,
        delay: GSAP_CONFIG.intro.bar.delay,
      }
    );
  }, [logoRef, progressBarRef]);
}
