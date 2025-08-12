import { useGlobalMaterialStore, type GlobalWoodMaterial } from "@/store/globalMaterialStore";
import { getMaterialsManifest, type MaterialsManifest } from "@/services/materialsManifest";

// Convertit une entrée du manifest public en GlobalWoodMaterial minimal
function toGlobalMaterial(entry: MaterialsManifest["materials"][number]): GlobalWoodMaterial {
  // Heuristique simple de prix: MDF et panneaux < bois massif
  const idLower = entry.id.toLowerCase();
  let price = 35;
  if (idLower.includes("mdf") || idLower.includes("agglomere") || idLower.includes("contreplaque")) {
    price = 29;
  } else if (idLower.includes("osb")) {
    price = 25;
  } else if (idLower.includes("teck") || idLower.includes("noyer") || idLower.includes("olivier")) {
    price = 59;
  }

  return {
    id: entry.id,
    name: entry.id,
    displayName: entry.displayName,
    image: entry.carousel.image,
    price,
    description: entry.carousel.description || entry.carousel.title,
    characteristics: {
      generalDescription: entry.carousel.fullDescription || entry.carousel.description || entry.carousel.title,
      colorAspect: { dominantColor: entry.carousel.color, variations: "", grain: "" },
      density: { typical: "", range: "", value: 0, unit: "kg/m³" },
      hardness: { classification: "", value: entry.carousel.rating ?? 0, unit: "N" },
      workability: { cutting: "", drilling: "", finishing: "" },
      appearance: { grain: "", color: entry.carousel.color, texture: "" },
      sustainability: { origin: entry.carousel.location, certification: "", carbon_impact: "" },
      applications: entry.carousel.tags || [],
    },
    metadata: { folder: entry.folder, hasNormalMap: true, hasRoughnessMap: true, hasAOMap: true },
  };
}

export async function loadAllMaterialsFromManifest(): Promise<GlobalWoodMaterial[]> {
  const manifest = await getMaterialsManifest();
  return manifest.materials.map(toGlobalMaterial);
}

export async function initializeMaterialsWithDefault(defaultId: string): Promise<void> {
  const { setLoading, setMaterials, setSelectedMaterialId, setError } = useGlobalMaterialStore.getState();
  try {
    setLoading(true);
    const mats = await loadAllMaterialsFromManifest();
    setMaterials(mats);
    // Si l'ID demandé existe, le sélectionner
    const exists = mats.some((m) => m.id === defaultId);
    setSelectedMaterialId(exists ? defaultId : (mats[0]?.id ?? null));
  } catch (e) {
    setError(e instanceof Error ? e.message : "Erreur de chargement des matériaux");
  } finally {
    setLoading(false);
  }
}
