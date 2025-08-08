import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Material } from './MaterialSphere';
import { MaterialCarousel3D } from './MaterialCarousel3D';

export interface UseMaterialCarouselOptions {
  materials: Material[];
  onMaterialSelect: (material: Material) => void;
  radius?: number;
  useScrollControl?: boolean;
  snapAfterScroll?: boolean;
}

export interface UseMaterialCarouselApi {
  hostRef: React.RefObject<HTMLDivElement>;
  isInitialized: boolean;
  rotateToMaterial: (materialId: string) => void;
  getCurrentMaterial: () => Material | null;
  updateMaterials: (materials: Material[]) => void;
  resize: () => void;
  destroy: () => void;
}

export function useMaterialCarousel(options: UseMaterialCarouselOptions): UseMaterialCarouselApi {
  const { materials, onMaterialSelect, radius = 400, useScrollControl = true, snapAfterScroll = true } = options;

  const hostRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<MaterialCarousel3D | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const initOnce = useRef(false);

  const init = useCallback(() => {
    if (!hostRef.current) return false;

    // Détruire l'instance précédente si nécessaire
    if (carouselRef.current) {
      carouselRef.current.destroy();
      carouselRef.current = null;
    }

    try {
      const instance = new MaterialCarousel3D(hostRef.current, {
        radius,
        materials,
        onMaterialSelect,
        useScrollControl,
        snapAfterScroll
      });
      instance.createCarousel();
      carouselRef.current = instance;

      return true;
    } catch (e) {
      console.error('❌ [useMaterialCarousel] Échec init:', e);
      return false;
    }
  }, [materials, onMaterialSelect, radius, useScrollControl, snapAfterScroll]);

  // Resize API
  const resize = useCallback(() => {
    if (!carouselRef.current) return;
    carouselRef.current.resize();
  }, []);

  const setupResizeObserver = useCallback(() => {
    if (!hostRef.current) return;

    // Cleanup previous
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    const ro = new ResizeObserver(() => {
      // Debounce minimal via RAF
      requestAnimationFrame(() => resize());
    });
    ro.observe(hostRef.current);
    resizeObserverRef.current = ro;
  }, [resize]);

  // Lifecycle
  useEffect(() => {
    if (!hostRef.current) return;

    if (!initOnce.current) {
      const ok = init();
      if (ok) {
        initOnce.current = true;
        setupResizeObserver();
      }
    } else {
      // Matériaux mis à jour après init
      carouselRef.current?.updateMaterials(materials);
      // Resize pour recalculer radius si nécessaire
      resize();
    }

    return () => {
      // Pas de cleanup ici, on laisse au unmount principal
    };
  }, [init, materials, setupResizeObserver, resize]);

  // Window resize
  useEffect(() => {
    const handler = () => resize();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [resize]);

  // Cleanup
  const destroy = useCallback(() => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }
    if (carouselRef.current) {
      carouselRef.current.destroy();
      carouselRef.current = null;
    }
    initOnce.current = false;
  }, []);

  useEffect(() => {
    return () => destroy();
  }, [destroy]);

  // API exposée
  const api = useMemo<UseMaterialCarouselApi>(() => ({
    hostRef,
    isInitialized: !!carouselRef.current,
    rotateToMaterial: (id: string) => carouselRef.current?.rotateToMaterial(id),
    getCurrentMaterial: () => carouselRef.current?.getCurrentMaterial() ?? null,
    updateMaterials: (mats: Material[]) => carouselRef.current?.updateMaterials(mats),
    resize,
    destroy
  }), [resize, destroy]);

  return api;
}
