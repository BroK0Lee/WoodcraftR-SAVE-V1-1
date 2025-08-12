import { useEffect, useState } from "react";
import type { CarouselItem } from "../types";
import { getMaterialsManifest } from "@/services/materialsManifest";

export function useCarouselManifest() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const manifest = await getMaterialsManifest();
      const mapped: CarouselItem[] = manifest.materials.map((m) => ({
        id: m.id,
        displayName: m.displayName,
        title: m.carousel.title,
        description: m.carousel.description,
        image: m.carousel.image,
        color: m.carousel.color,
        fullDescription: m.carousel.fullDescription,
        location: m.carousel.location,
        date: m.carousel.date,
        rating: m.carousel.rating,
        tags: m.carousel.tags,
      }));
      setItems(mapped);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return { items, error, reload: load };
}
