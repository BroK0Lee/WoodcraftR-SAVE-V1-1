import { useEffect } from "react";
import type { RefObject } from "react";
import { gsap } from "gsap";
import { GSAP_CONFIG } from "../config";

interface IntroRefs {
  logoRef: RefObject<HTMLDivElement>;
  progressBarRef: RefObject<HTMLDivElement>;
  stepsRef?: RefObject<HTMLDivElement>; // optionnel désormais
}

export function useGsapIntro({ logoRef, progressBarRef, stepsRef }: IntroRefs) {
  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      // Appliquer directement les états finaux sans animation
      gsap.set(logoRef.current, { scale: 1, rotation: 0, opacity: 1 });
      gsap.set(progressBarRef.current, { scaleX: 1 });
      if (stepsRef?.current?.children) {
        gsap.set((stepsRef.current.children as unknown as Element[]) || [], {
          y: 0,
          opacity: 1,
        });
      }
      return;
    }

    // Animation d'entrée du logo
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

    // Animation de la barre de progression (container)
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

    // Animation des étapes (stagger)
    if (stepsRef?.current?.children) {
      gsap.fromTo(
        (stepsRef.current.children as unknown as Element[]) || [],
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: GSAP_CONFIG.intro.steps.duration,
          stagger: GSAP_CONFIG.intro.steps.stagger,
          delay: GSAP_CONFIG.intro.steps.delay,
        }
      );
    }
  }, [logoRef, progressBarRef, stepsRef]);
}
