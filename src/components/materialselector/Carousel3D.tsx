import React, { useRef, useEffect, useState } from "react";
import { useGlobalMaterialStore } from "@/store/globalMaterialStore";
import { gsap } from "gsap";
import { useCarouselGeometry } from "./hooks/useCarouselGeometry";
import { useCarouselAnimation } from "./hooks/useCarouselAnimation";
import { useCarouselControls } from "./hooks/useCarouselControls";
import { useModal } from "./hooks/useModal";
import { useCarouselManifest } from "./hooks/useCarouselManifest";
import type { CarouselItem } from "./types";
import CarouselHeader from "./components/CarouselHeader";
import CarouselControls from "./components/CarouselControls";
import MaterialModal from "./components/MaterialModal";
import ItemCard from "./components/ItemCard";

// Types are provided by services/materialsManifest

const Carousel3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);
  const { items, error: loadError } = useCarouselManifest();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CarouselItem | null>(null);
  const { setSelectedMaterialId } = useGlobalMaterialStore();

  // Géométrie (rayon fixe + pas angulaire)
  const totalItems = items.length;
  const { angleStep, radius } = useCarouselGeometry(totalItems);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      // rayon fixe: pas d'adaptation au conteneur
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Rayon fixe: pas de mesure/calcul dynamique

  // Reset index au (re)chargement des items
  useEffect(() => {
    setCurrentIndex(0);
  }, [items.length]);

  const modal = useModal();
  const controls = useCarouselControls({
    containerRef,
    isModalOpen: modal.isOpen,
    isHovered,
    totalItems,
    setCurrentIndex,
  });

  const openCard = (item: CarouselItem, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedCard(item);
    controls.pauseAutoplay();
    modal.open(item.id, modalRef, modalContentRef);
  };

  // Wheel + autoplay gérés par useCarouselControls (isScrolling local reste pour compat UI)

  const closeCard = () => {
    modal.close(modalRef, modalContentRef, () => setSelectedCard(null));
  };
  useEffect(() => {
    if (!carouselRef.current || totalItems === 0) return;

    // Initialize carousel positions (lorsque la liste change)
    itemsRef.current.forEach((item, index) => {
      if (!item) return;

      const angle = angleStep * index;
      const x = Math.sin((angle * Math.PI) / 180) * radius;
      const z = Math.cos((angle * Math.PI) / 180) * radius;

      gsap.set(item, {
        rotationY: angle,
        transformOrigin: "center center",
        x,
        z,
      });
    });

    // Le hook d'animation gère la rotation du carrousel
    gsap.set(carouselRef.current, { transformStyle: "preserve-3d" });
  }, [totalItems, angleStep, radius]);

  // Animation (rotation + scale/opacity) via hook, pour éviter les doublons
  useCarouselAnimation(carouselRef, itemsRef, {
    currentIndex,
    angleStep,
    totalItems,
  });

  // Autoplay géré via useCarouselControls

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const addToRefs = (el: HTMLDivElement | null, index: number) => {
    if (el && !itemsRef.current[index]) {
      itemsRef.current[index] = el;
    }
  };

  return (
    <div className="relative h-full w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
      {/* Background Elements (scoped to panel, no pointer events) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-neutral-300/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-20 w-96 h-96 bg-neutral-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-white/5 to-transparent rounded-full" />
      </div>

      {/* Main Container */}
      <div
        ref={containerRef}
        className="relative z-10 flex flex-col items-center justify-center h-full px-4 py-8"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {loadError && (
          <div className="mb-4 w-full max-w-3xl rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
            Erreur de chargement des matériaux: {loadError}
          </div>
        )}
        {/* Header */}
        <CarouselHeader />

        {/* Carousel Container */}
        <div className="relative w-full max-w-6xl h-96 md:h-[500px]">
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ perspective: `${radius * 5}px` }}
          >
            <div
              ref={carouselRef}
              className="relative w-80 h-80 md:w-96 md:h-96"
              style={{ transformStyle: "preserve-3d" }}
            >
              {items.map((item, index) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isActive={index === currentIndex}
                  addRef={(el) => addToRefs(el, index)}
                  onClick={(e) => {
                    if (index === currentIndex) {
                      openCard(item, e);
                    } else {
                      goToSlide(index);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <CarouselControls
          isAutoPlay={controls.isAutoPlay}
          onToggleAutoPlay={controls.toggleAutoPlay}
        />

        {/* Indicators & bottom info removed per request */}
      </div>

      <MaterialModal
        isOpen={modal.isOpen}
        selected={selectedCard}
        onClose={closeCard}
        onChoose={() => {
          if (!selectedCard) return;
          setSelectedMaterialId(selectedCard.id);
          closeCard();
        }}
        modalRef={modalRef}
        modalContentRef={modalContentRef}
      />
    </div>
  );
};

export default Carousel3D;
