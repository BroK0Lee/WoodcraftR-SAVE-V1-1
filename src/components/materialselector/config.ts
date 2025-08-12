export const CAROUSEL_RADIUS_PX = 1024;
export const AUTOPLAY_INTERVAL_MS = 4000;

// GSAP timings
enum Durations {
  ROTATE = 1.0,
  SCALE = 0.95,
  MODAL_IN = 0.6,
  MODAL_OUT = 0.4,
}
export const ROTATE_DURATION = Durations.ROTATE;
export const SCALE_DURATION = Durations.SCALE;
export const MODAL_IN_DURATION = Durations.MODAL_IN;
export const MODAL_OUT_DURATION = Durations.MODAL_OUT;

// GSAP easings
export const ROTATE_EASE = "power2.inOut";
export const SCALE_EASE = "power2.inOut";
export const MODAL_IN_EASE = "back.out(1.7)";
export const MODAL_OUT_EASE = "power2.in";
