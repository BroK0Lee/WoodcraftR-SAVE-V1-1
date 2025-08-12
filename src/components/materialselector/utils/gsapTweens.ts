import { gsap } from "gsap";
import {
  MODAL_IN_DURATION,
  MODAL_OUT_DURATION,
  MODAL_IN_EASE,
  MODAL_OUT_EASE,
  ROTATE_DURATION,
  ROTATE_EASE,
  SCALE_DURATION,
  SCALE_EASE,
} from "../config";
// Correction du chemin vers la config au niveau parent
// Chemin relatif déjà correct

export const openModalTween = (
  modalEl: HTMLElement,
  contentEl: HTMLElement
) => {
  gsap.set(modalEl, { display: "flex", opacity: 0 });
  gsap.set(contentEl, { scale: 0.8, rotationY: -15, opacity: 0, y: 50 });
  const tl = gsap.timeline();
  tl.to(modalEl, { opacity: 1, duration: 0.3, ease: "power2.out" }).to(
    contentEl,
    {
      scale: 1,
      rotationY: 0,
      opacity: 1,
      y: 0,
      duration: MODAL_IN_DURATION,
      ease: MODAL_IN_EASE,
    },
    "-=0.1"
  );
  return tl;
};

export const closeModalTween = (
  modalEl: HTMLElement,
  contentEl: HTMLElement,
  onComplete?: () => void
) => {
  const tl = gsap.timeline();
  tl.to(contentEl, {
    scale: 0.8,
    rotationY: 15,
    opacity: 0,
    y: -50,
    duration: MODAL_OUT_DURATION,
    ease: MODAL_OUT_EASE,
  }).to(
    modalEl,
    {
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete,
    },
    "-=0.1"
  );
  return tl;
};

export const rotateCarouselTween = (carouselEl: HTMLElement, angle: number) =>
  gsap.to(carouselEl, {
    rotationY: angle,
    duration: ROTATE_DURATION,
    ease: ROTATE_EASE,
  });

export const scaleOpacityItemTween = (
  itemEl: HTMLElement,
  scale: number,
  opacity: number
) =>
  gsap.to(itemEl, {
    scale,
    opacity,
    duration: SCALE_DURATION,
    ease: SCALE_EASE,
  });
