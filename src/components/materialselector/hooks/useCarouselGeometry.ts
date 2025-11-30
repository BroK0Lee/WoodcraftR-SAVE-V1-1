import { useMemo } from "react";
import { CAROUSEL_RADIUS_PX } from "../config";
import { angleStepFor, positionForIndex } from "../utils/geometry";

export function useCarouselGeometry(totalItems: number) {
  const angleStep = useMemo(() => angleStepFor(totalItems), [totalItems]);
  const radius = CAROUSEL_RADIUS_PX;

  return {
    angleStep,
    radius,
    positionFor: (index: number) => positionForIndex(index, totalItems, radius),
  };
}
