import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { Cut } from '@/models/Cut';

interface Props {
  cut: Cut;
  panelDimensions: { length: number; width: number; thickness: number };
}

/**
 * Composant pour afficher les cotations X/Y d'une découpe en cours de positionnement
 * Style professionnel CAO avec lignes de rappel et flèches
 */
export default function DimensionLabels({ cut, panelDimensions }: Props) {
  const cotationData = useMemo(() => {
    const { positionX, positionY } = cut;
    const { length, width, thickness } = panelDimensions;
    
    // Offset pour les cotations (plus petits pour coller à l'image)
    const offset = 25;
    
    // Position de l'origine (0,0)
    const originX = 0;
    const originY = 0;
    
    // Offset Z pour éviter le Z-fighting
    const zOffset = thickness + 0.1;
    
    // Position Y pour cotation X (en bas)
    const xCotationY = originY - offset;
    
    // Position X pour cotation Y (à gauche)  
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
      displayY: positionY.toFixed(2)
    };
  }, [cut.positionX, cut.positionY, panelDimensions]);

  return (
    <group>
      {/* === COTATION X (HORIZONTALE) === */}
      
      {/* Ligne de rappel verticale - origine */}
      <mesh position={[cotationData.originX, (cotationData.originY + cotationData.xCotationY) / 2, cotationData.zOffset]}>
        <boxGeometry args={[0.5, Math.abs(cotationData.originY - cotationData.xCotationY), 0.1]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      
      {/* Ligne de rappel verticale - position découpe */}
      <mesh position={[cotationData.positionX, (cotationData.positionY + cotationData.xCotationY) / 2, cotationData.zOffset]}>
        <boxGeometry args={[0.5, Math.abs(cotationData.positionY - cotationData.xCotationY), 0.1]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      
      {/* Ligne de cotation X principale (plus épaisse) */}
      <mesh position={[(cotationData.originX + cotationData.positionX) / 2, cotationData.xCotationY, cotationData.zOffset]}>
        <boxGeometry args={[Math.abs(cotationData.positionX - cotationData.originX), 1.5, 0.2]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      
      {/* Flèche gauche X */}
      <mesh position={[cotationData.originX, cotationData.xCotationY, cotationData.zOffset]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[2, 6, 8]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      
      {/* Flèche droite X */}
      <mesh position={[cotationData.positionX, cotationData.xCotationY, cotationData.zOffset]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[2, 6, 8]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      
      {/* Valeur cotation X - centrée sur la ligne */}
      <Html
        position={[(cotationData.originX + cotationData.positionX) / 2, cotationData.xCotationY - 8, cotationData.zOffset]}
        center
        distanceFactor={3}
        style={{ pointerEvents: 'none' }}
      >
        <div className="px-4 py-2 rounded-lg shadow-lg text-2xl font-bold bg-neutral-900/95 text-white border border-white/20 pointer-events-none select-none">
          {cotationData.displayX}
        </div>
      </Html>

      {/* === COTATION Y (VERTICALE) === */}
      
      {/* Ligne de rappel horizontale - origine */}
      <mesh position={[(cotationData.originX + cotationData.yCotationX) / 2, cotationData.originY, cotationData.zOffset]}>
        <boxGeometry args={[Math.abs(cotationData.originX - cotationData.yCotationX), 0.5, 0.1]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      
      {/* Ligne de rappel horizontale - position découpe */}
      <mesh position={[(cotationData.positionX + cotationData.yCotationX) / 2, cotationData.positionY, cotationData.zOffset]}>
        <boxGeometry args={[Math.abs(cotationData.positionX - cotationData.yCotationX), 0.5, 0.1]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      
      {/* Ligne de cotation Y principale (plus épaisse) */}
      <mesh position={[cotationData.yCotationX, (cotationData.originY + cotationData.positionY) / 2, cotationData.zOffset]}>
        <boxGeometry args={[1.5, Math.abs(cotationData.positionY - cotationData.originY), 0.2]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      
      {/* Flèche bas Y */}
      <mesh position={[cotationData.yCotationX, cotationData.originY, cotationData.zOffset]} rotation={[0, 0, 0]}>
        <coneGeometry args={[2, 6, 8]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      
      {/* Flèche haut Y */}
      <mesh position={[cotationData.yCotationX, cotationData.positionY, cotationData.zOffset]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[2, 6, 8]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      
      {/* Valeur cotation Y - centrée sur la ligne, tournée */}
      <Html
        position={[cotationData.yCotationX - 8, (cotationData.originY + cotationData.positionY) / 2, cotationData.zOffset]}
        center
        distanceFactor={3}
        style={{ pointerEvents: 'none' }}
        transform
        rotation={[0, 0, Math.PI / 2]}
      >
        <div className="px-4 py-2 rounded-lg shadow-lg text-2xl font-bold bg-neutral-900/95 text-white border border-white/20 pointer-events-none select-none">
          {cotationData.displayY}
        </div>
      </Html>

      {/* === MARQUEURS === */}
      
      {/* Origine du panneau (0,0) */}
      <mesh position={[cotationData.originX, cotationData.originY, cotationData.zOffset]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="#666666" />
      </mesh>

      {/* Position de la découpe */}
      <mesh position={[cotationData.positionX, cotationData.positionY, cotationData.zOffset]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="#666666" />
      </mesh>
    </group>
  );
}
