import { useEffect, useRef, useState } from "react";
import { AUTOPLAY_INTERVAL_MS } from "../config";

type Params = {
  containerRef: React.RefObject<HTMLDivElement>;
  isModalOpen: boolean;
  isHovered: boolean;
  totalItems: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
};

export function useCarouselControls({
  containerRef,
  isModalOpen,
  isHovered,
  totalItems,
  setCurrentIndex,
}: Params) {
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const isScrollingRef = useRef(false);

  // Autoplay
  useEffect(() => {
    if (!isAutoPlay || isHovered || totalItems === 0 || isModalOpen) return;
    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalItems);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAutoPlay, isHovered, totalItems, isModalOpen, setCurrentIndex]);

  // Wheel navigation (debounced)
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (isModalOpen || isScrollingRef.current || totalItems === 0) return;
      event.preventDefault();
      isScrollingRef.current = true;
      const delta = event.deltaY;
      if (delta > 0) {
        setCurrentIndex((prev) => (prev + 1) % totalItems);
      } else {
        setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
      }
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    };

    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [containerRef, isModalOpen, totalItems, setCurrentIndex]);

  return {
    isAutoPlay,
    toggleAutoPlay: () => setIsAutoPlay((v) => !v),
    pauseAutoplay: () => setIsAutoPlay(false),
    resumeAutoplay: () => setIsAutoPlay(true),
  };
}
