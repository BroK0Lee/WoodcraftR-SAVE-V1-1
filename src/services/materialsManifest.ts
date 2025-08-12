// Centralized loader for public/textures/wood/materials.json with simple memoization

export interface MaterialCarouselMeta {
  title: string;
  description: string;
  image: string;
  color: string;
  fullDescription: string;
  location: string;
  date: string;
  rating: number;
  tags: string[];
}

export interface MaterialEntry {
  id: string;
  displayName: string;
  folder: string;
  maps: { basecolor: string; normal: string; roughness: string; ao: string };
  carousel: MaterialCarouselMeta;
}

export interface MaterialsManifest {
  materials: MaterialEntry[];
}

let cached: MaterialsManifest | null = null;
let inflight: Promise<MaterialsManifest> | null = null;

// Nouveau manifest racine (public/textures/wood/Material.json)
interface RootManifestEntry {
  id: string;
  displayName: string;
  folder: string; // ex: 0X00X008
  meta: string; // ex: douglas.json
  maps: { basecolor: string; normal: string; roughness: string; ao: string };
}
interface RootManifest {
  materials: RootManifestEntry[];
}

// Type minimal de la meta consommée (on n'expose que ce que l'UI lit)
type MetaCarousel = Partial<
  Pick<
    MaterialCarouselMeta,
    "title" | "description" | "image" | "color" | "fullDescription" | "tags"
  > & { Origin?: string; Class?: number; date?: string; rating?: number }
>;
interface MetaJsonShape {
  id?: string;
  displayName?: string;
  carousel?: MetaCarousel;
}

export async function getMaterialsManifest(): Promise<MaterialsManifest> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    // 1) Charger le manifest racine consolidé
    const rootRes = await fetch("/textures/wood/Material.json");
    if (!rootRes.ok) throw new Error(`HTTP ${rootRes.status}`);
    const root: RootManifest = await rootRes.json();

    // 2) Charger chaque meta.json et construire l'entrée attendue par l'UI
    const materials: MaterialsManifest["materials"] = await Promise.all(
      (root.materials || []).map(async (entry) => {
        let meta: MetaJsonShape | null = null;
        try {
          const metaRes = await fetch(
            `/textures/wood/${entry.folder}/${entry.meta}`
          );
          if (metaRes.ok) {
            meta = await metaRes.json();
          }
        } catch {
          // On restera avec des valeurs par défaut si la meta manque
        }

        const c = meta?.carousel ?? {};
  const image = `/textures/wood/${entry.folder}/${entry.maps.basecolor}`;

        const materialEntry = {
          id: entry.id,
          displayName: entry.displayName,
          folder: entry.folder,
          maps: entry.maps,
          carousel: {
            title: c.title ?? entry.displayName,
            description: c.description ?? "",
            image,
            color: c.color ?? "#9CA3AF", // gris neutre par défaut
            fullDescription: c.fullDescription ?? "",
            // Mapper les champs existants (Origin -> location). Valeurs par défaut sûres.
            location: c.Origin ?? "",
            date: c.date ?? "",
            rating: typeof c.Class === "number" ? c.Class : c.rating ?? 0,
            tags: Array.isArray(c.tags) ? c.tags : [],
          } satisfies MaterialCarouselMeta,
        } satisfies MaterialsManifest["materials"][number];

        return materialEntry;
      })
    );

    // 3) Ordonner par displayName (case/accents friendly basique)
    materials.sort((a, b) =>
      a.displayName.localeCompare(b.displayName, "fr", {
        sensitivity: "base",
      })
    );

    const manifest: MaterialsManifest = { materials };
    cached = manifest;
    return manifest;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

export async function listMaterials(): Promise<
  Array<{ id: string; displayName: string }>
> {
  const manifest = await getMaterialsManifest();
  return (manifest.materials ?? []).map((m) => ({
    id: m.id,
    displayName: m.displayName,
  }));
}
