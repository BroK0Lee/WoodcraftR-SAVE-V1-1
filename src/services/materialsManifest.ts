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
  carousel: MaterialCarouselMeta;
}

export interface MaterialsManifest {
  materials: MaterialEntry[];
}

let cached: MaterialsManifest | null = null;
let inflight: Promise<MaterialsManifest> | null = null;

export async function getMaterialsManifest(): Promise<MaterialsManifest> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = fetch('/textures/wood/materials.json')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((json: MaterialsManifest) => {
      cached = json;
      return json;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export async function listMaterials(): Promise<Array<{ id: string; displayName: string }>> {
  const manifest = await getMaterialsManifest();
  return (manifest.materials ?? []).map((m) => ({ id: m.id, displayName: m.displayName }));
}
