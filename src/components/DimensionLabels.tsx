import { useEffect, useRef, useMemo, useState } from "react";
import { Group } from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { Cut } from "@/models/Cut";
import { usePanelStore } from "@/store/panelStore";

interface Props {
  cut: Cut;
  panelDimensions: { length: number; width: number; thickness: number };
}

/**
 * Composant pour afficher les cotations X/Y d'une découpe en cours de positionnement
 * Style professionnel CAO avec lignes de rappel et flèches
 */
export default function DimensionLabels({ cut, panelDimensions }: Props) {
  // Synchronisation avec la géométrie réelle pour éviter le décalage visuel
  // On ne met à jour les valeurs affichées que lorsque la géométrie 3D a été recalculée
  const geometry = usePanelStore((s) => s.geometry);
  const [displayedCut, setDisplayedCut] = useState(cut);

  useEffect(() => {
    setDisplayedCut(cut);
    // On dépend de geometry pour déclencher la mise à jour au bon moment
    // On dépend de cut pour avoir les dernières valeurs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry]);

  // Si c'est la première fois (montage) ou si on change de découpe cible, on force la mise à jour immédiate
  // pour éviter d'afficher les valeurs de la découpe précédente
  useEffect(() => {
    if (cut.id !== displayedCut.id) {
      setDisplayedCut(cut);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cut.id]);

  // Calcul des données de cotation basées sur displayedCut (synchronisé)
  const cotationData = useMemo(() => {
    const { positionX, positionY } = displayedCut;
    const { length, width, thickness } = panelDimensions;
    const offset = 25;
    const originX = 0;
    const originY = 0;
    const zOffset = thickness + 0.1;
    const xCotationY = originY - offset;
    const yCotationX = originX - offset;
    return {
      positionX,
      positionY,
      originX,
      originY,
      xCotationY,
      yCotationX,
      length,
      width,
      zOffset,
      displayX: positionX.toFixed(2),
      displayY: positionY.toFixed(2),
    };
  }, [displayedCut, panelDimensions]);

  // Référence pour le groupe Three.js
  const groupRef = useRef<Group>(null);
  // Références persistantes pour les labels (créés une fois)
  const labelXRef = useRef<CSS2DObject | null>(null);
  const labelYRef = useRef<CSS2DObject | null>(null);
  const labelClass =
    "px-1 py-0.5 rounded shadow text-xs font-bold bg-neutral-900/90 text-white border border-white/10 pointer-events-none select-none";

  // Création/démontage des labels une seule fois
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    // Créer X si absent
    if (!labelXRef.current) {
      const labelXDiv = document.createElement("div");
      labelXDiv.className = labelClass;
      labelXRef.current = new CSS2DObject(labelXDiv);
      group.add(labelXRef.current);
    }
    // Créer Y si absent
    if (!labelYRef.current) {
      const labelYDiv = document.createElement("div");
      labelYDiv.className = labelClass;
      labelYDiv.style.display = "flex";
      labelYDiv.style.justifyContent = "center";
      labelYDiv.style.alignItems = "center";
      labelYDiv.style.whiteSpace = "nowrap";
      labelYRef.current = new CSS2DObject(labelYDiv);
      group.add(labelYRef.current);
    }

    // Cleanup au démontage
    return () => {
      if (group && labelXRef.current) {
        group.remove(labelXRef.current);
        // Detacher l'élément DOM par sécurité
        (labelXRef.current.element as HTMLElement | undefined)?.remove?.();
        labelXRef.current = null;
      }
      if (group && labelYRef.current) {
        group.remove(labelYRef.current);
        (labelYRef.current.element as HTMLElement | undefined)?.remove?.();
        labelYRef.current = null;
      }
    };
  }, []);

  // Mise à jour du contenu/position des labels quand les données changent
  useEffect(() => {
    const lx = labelXRef.current;
    const ly = labelYRef.current;
    if (!lx || !ly) return;
    // Texte
    (lx.element as HTMLDivElement).textContent = `X: ${cotationData.displayX}`;
    (ly.element as HTMLDivElement).textContent = `Y: ${cotationData.displayY}`;
    // Positions
    lx.position.set(
      (cotationData.originX + cotationData.positionX) / 2,
      cotationData.xCotationY - 8,
      cotationData.zOffset
    );
    ly.position.set(
      cotationData.yCotationX - 8,
      (cotationData.originY + cotationData.positionY) / 2,
      cotationData.zOffset
    );
  }, [cotationData]);

  return (
    <group ref={groupRef}>
      {/* === LIGNES ET FLÈCHES 3D === */}
      {/* Ligne de rappel verticale - origine */}
      <mesh
        position={[
          cotationData.originX,
          (cotationData.originY + cotationData.xCotationY) / 2,
          cotationData.zOffset,
        ]}
      >
        <boxGeometry
          args={[
            0.5,
            Math.abs(cotationData.originY - cotationData.xCotationY),
            0.1,
          ]}
        />
        <meshBasicMaterial color="#333333" />
      </mesh>
      {/* Ligne de rappel verticale - position découpe */}
      <mesh
        position={[
          cotationData.positionX,
          (cotationData.positionY + cotationData.xCotationY) / 2,
          cotationData.zOffset,
        ]}
      >
        <boxGeometry
          args={[
            0.5,
            Math.abs(cotationData.positionY - cotationData.xCotationY),
            0.1,
          ]}
        />
        <meshBasicMaterial color="#333333" />
      </mesh>
      {/* Ligne de cotation X principale (plus épaisse) */}
      <mesh
        position={[
          (cotationData.originX + cotationData.positionX) / 2,
          cotationData.xCotationY,
          cotationData.zOffset,
        ]}
      >
        <boxGeometry
          args={[
            Math.abs(cotationData.positionX - cotationData.originX),
            1.5,
            0.2,
          ]}
        />
        <meshBasicMaterial color="#333333" />
      </mesh>
      {/* Flèche gauche X */}
      <mesh
        position={[
          cotationData.originX,
          cotationData.xCotationY,
          cotationData.zOffset,
        ]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <coneGeometry args={[2, 6, 8]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      {/* Flèche droite X */}
      <mesh
        position={[
          cotationData.positionX,
          cotationData.xCotationY,
          cotationData.zOffset,
        ]}
        rotation={[0, 0, -Math.PI / 2]}
      >
        <coneGeometry args={[2, 6, 8]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      {/* === COTATION Y (VERTICALE) === */}
      {/* Ligne de rappel horizontale - origine */}
      <mesh
        position={[
          (cotationData.originX + cotationData.yCotationX) / 2,
          cotationData.originY,
          cotationData.zOffset,
        ]}
      >
        <boxGeometry
          args={[
            Math.abs(cotationData.originX - cotationData.yCotationX),
            0.5,
            0.1,
          ]}
        />
        <meshBasicMaterial color="#333333" />
      </mesh>
      {/* Ligne de rappel horizontale - position découpe */}
      <mesh
        position={[
          (cotationData.positionX + cotationData.yCotationX) / 2,
          cotationData.positionY,
          cotationData.zOffset,
        ]}
      >
        <boxGeometry
          args={[
            Math.abs(cotationData.positionX - cotationData.yCotationX),
            0.5,
            0.1,
          ]}
        />
        <meshBasicMaterial color="#333333" />
      </mesh>
      {/* Ligne de cotation Y principale (plus épaisse) */}
      <mesh
        position={[
          cotationData.yCotationX,
          (cotationData.originY + cotationData.positionY) / 2,
          cotationData.zOffset,
        ]}
      >
        <boxGeometry
          args={[
            1.5,
            Math.abs(cotationData.positionY - cotationData.originY),
            0.2,
          ]}
        />
        <meshBasicMaterial color="#333333" />
      </mesh>
      {/* Flèche bas Y */}
      <mesh
        position={[
          cotationData.yCotationX,
          cotationData.originY,
          cotationData.zOffset,
        ]}
        rotation={[0, 0, 0]}
      >
        <coneGeometry args={[2, 6, 8]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      {/* Flèche haut Y */}
      <mesh
        position={[
          cotationData.yCotationX,
          cotationData.positionY,
          cotationData.zOffset,
        ]}
        rotation={[0, 0, Math.PI]}
      >
        <coneGeometry args={[2, 6, 8]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      {/* === MARQUEURS === */}
      {/* Origine du panneau (0,0) */}
      <mesh
        position={[
          cotationData.originX,
          cotationData.originY,
          cotationData.zOffset,
        ]}
      >
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="#666666" />
      </mesh>
      {/* Position de la découpe */}
      <mesh
        position={[
          cotationData.positionX,
          cotationData.positionY,
          cotationData.zOffset,
        ]}
      >
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="#666666" />
      </mesh>
    </group>
  );
}
