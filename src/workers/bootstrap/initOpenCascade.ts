import openCascade from "opencascade.js/dist/opencascade.full.js";
import openCascadeWasm from "opencascade.js/dist/opencascade.full.wasm?url";

// Initialisation basique (Étape 1) - future extension: progression structurée
export async function initOpenCascade() {
  // @ts-expect-error - openCascade factory non typée
  return await openCascade({
    locateFile: () => openCascadeWasm,
  });
}
