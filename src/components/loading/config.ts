export const LOADING_LABELS = {
  worker: "Initialisation OpenCascade Worker...",
  materials: "Chargement des matières...",
} as const;

export const PROGRESS_CONFIG = {
  // worker supprimé: progression réelle seulement (download / compile / ready)
  materialsLoad: { step: 2, intervalMs: 120, cap: 90 },
  materialsWaiting: { step: 1, intervalMs: 150, cap: 98 },
} as const;

export const GSAP_CONFIG = {
  intro: {
    logo: { duration: 1.2, ease: "back.out(1.7)", delay: 0.3 },
    bar: { duration: 0.8, ease: "power2.inOut", delay: 0.8 },
    steps: { duration: 0.6, stagger: 0.1, delay: 1.2 },
  },
  outro: {
    bar: { duration: 0.3, ease: "power2.out" },
    container: { duration: 0.8, ease: "power2.inOut" },
    afterBarDelayMs: 500,
  },
} as const;
