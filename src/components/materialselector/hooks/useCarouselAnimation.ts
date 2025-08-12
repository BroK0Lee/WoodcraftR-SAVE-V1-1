import { useEffect } from "react";
import {
  rotateCarouselTween,
  scaleOpacityItemTween,
} from "../utils/gsapTweens";

export function useCarouselAnimation(
  carouselEl: React.RefObject<HTMLDivElement>,
  itemsEls: React.RefObject<HTMLDivElement[]>,
  deps: { currentIndex: number; angleStep: number; totalItems: number }
) {
  const { currentIndex, angleStep, totalItems } = deps;

  // Rotate carousel on index change
  useEffect(() => {
    if (!carouselEl.current || totalItems === 0) return;
    rotateCarouselTween(carouselEl.current, -currentIndex * angleStep);

    // Update items scale/opacity
    itemsEls.current?.forEach((item, index) => {
      if (!item) return;
      const distance = Math.abs(index - currentIndex);
      const minDistance = Math.min(distance, totalItems - distance);
      const scale = index === currentIndex ? 1 : 0.8 - minDistance * 0.1;
      const opacity = index === currentIndex ? 1 : 0.6 - minDistance * 0.15;
      scaleOpacityItemTween(item, scale, opacity);
    });
  }, [carouselEl, itemsEls, currentIndex, angleStep, totalItems]);
}
