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
    const { length, width } = panelDimensions;
    
    // Offset pour les cotations
    const offset = 50;
    
    // Position de l'origine (coin bas-gauche du panneau)
    const originX = -length / 2;
    const originY = -width / 2;
    
    // Position Y pour cotation X
    const xCotationY = originY - offset;
    
    // Position X pour cotation Y
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
      displayX: positionX.toFixed(1),
      displayY: positionY.toFixed(1)
    };
  }, [cut.positionX, cut.positionY, panelDimensions]);

  return (
    <group>
      {/* === COTATION X === */}
      
      {/* Ligne de rappel verticale - origine */}
      <mesh position={[cotationData.originX, (cotationData.originY + cotationData.xCotationY) / 2, 5]}>
        <boxGeometry args={[0.5, Math.abs(cotationData.originY - cotationData.xCotationY), 0.2]} />
        <meshBasicMaterial color="#888888" />
      </mesh>
      
      {/* Ligne de rappel verticale - position découpe */}
      <mesh position={[cotationData.positionX, (cotationData.positionY + cotationData.xCotationY) / 2, 5]}>
        <boxGeometry args={[0.5, Math.abs(cotationData.positionY - cotationData.xCotationY), 0.2]} />
        <meshBasicMaterial color="#888888" />
      </mesh>
      
      {/* Ligne de cotation X principale */}
      <mesh position={[(cotationData.originX + cotationData.positionX) / 2, cotationData.xCotationY, 5]}>
        <boxGeometry args={[Math.abs(cotationData.positionX - cotationData.originX), 1.5, 0.5]} />
        <meshBasicMaterial color="#E53E3E" />
      </mesh>
      
      {/* Flèche gauche X */}
      <mesh position={[cotationData.originX, cotationData.xCotationY, 5]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[2, 8, 3]} />
        <meshBasicMaterial color="#E53E3E" />
      </mesh>
      
      {/* Flèche droite X */}
      <mesh position={[cotationData.positionX, cotationData.xCotationY, 5]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[2, 8, 3]} />
        <meshBasicMaterial color="#E53E3E" />
      </mesh>
      
      {/* Label cotation X */}
      <Html
        position={[(cotationData.originX + cotationData.positionX) / 2, cotationData.xCotationY - 12, 5]}
        center
        distanceFactor={10}
        style={{ pointerEvents: 'none' }}
      >
        <div className="bg-white border-2 border-red-500 px-3 py-1 rounded shadow-lg">
          <span className="text-red-600 font-mono text-sm font-bold">
            X: {cotationData.displayX} mm
          </span>
        </div>
      </Html>

      {/* === COTATION Y === */}
      
      {/* Ligne de rappel horizontale - origine */}
      <mesh position={[(cotationData.originX + cotationData.yCotationX) / 2, cotationData.originY, 5]}>
        <boxGeometry args={[Math.abs(cotationData.originX - cotationData.yCotationX), 0.5, 0.2]} />
        <meshBasicMaterial color="#888888" />
      </mesh>
      
      {/* Ligne de rappel horizontale - position découpe */}
      <mesh position={[(cotationData.positionX + cotationData.yCotationX) / 2, cotationData.positionY, 5]}>
        <boxGeometry args={[Math.abs(cotationData.positionX - cotationData.yCotationX), 0.5, 0.2]} />
        <meshBasicMaterial color="#888888" />
      </mesh>
      
      {/* Ligne de cotation Y principale */}
      <mesh position={[cotationData.yCotationX, (cotationData.originY + cotationData.positionY) / 2, 5]}>
        <boxGeometry args={[1.5, Math.abs(cotationData.positionY - cotationData.originY), 0.5]} />
        <meshBasicMaterial color="#3182CE" />
      </mesh>
      
      {/* Flèche bas Y */}
      <mesh position={[cotationData.yCotationX, cotationData.originY, 5]} rotation={[0, 0, 0]}>
        <coneGeometry args={[2, 8, 3]} />
        <meshBasicMaterial color="#3182CE" />
      </mesh>
      
      {/* Flèche haut Y */}
      <mesh position={[cotationData.yCotationX, cotationData.positionY, 5]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[2, 8, 3]} />
        <meshBasicMaterial color="#3182CE" />
      </mesh>
      
      {/* Label cotation Y */}
      <Html
        position={[cotationData.yCotationX - 12, (cotationData.originY + cotationData.positionY) / 2, 5]}
        center
        distanceFactor={10}
        style={{ pointerEvents: 'none' }}
        transform
        rotation={[0, 0, Math.PI / 2]}
      >
        <div className="bg-white border-2 border-blue-500 px-3 py-1 rounded shadow-lg">
          <span className="text-blue-600 font-mono text-sm font-bold">
            Y: {cotationData.displayY} mm
          </span>
        </div>
      </Html>

      {/* === MARQUEURS === */}
      
      {/* Origine du panneau (coin bas-gauche) */}
      <mesh position={[cotationData.originX, cotationData.originY, 3]}>
        <boxGeometry args={[6, 6, 2]} />
        <meshBasicMaterial color="#2D3748" />
      </mesh>
      
      {/* Label origine */}
      <Html
        position={[cotationData.originX + 15, cotationData.originY - 15, 3]}
        center
        distanceFactor={8}
        style={{ pointerEvents: 'none' }}
      >
        <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-mono shadow-lg">
          Origine (0,0)
        </div>
      </Html>

      {/* Position de la découpe */}
      <mesh position={[cotationData.positionX, cotationData.positionY, 4]}>
        <cylinderGeometry args={[3, 3, 2, 8]} />
        <meshBasicMaterial color="#ED8936" />
      </mesh>
      
      {/* Label position découpe */}
      <Html
        position={[cotationData.positionX, cotationData.positionY + 20, 4]}
        center
        distanceFactor={8}
        style={{ pointerEvents: 'none' }}
      >
        <div className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-mono shadow-lg">
          Découpe ({cotationData.displayX}, {cotationData.displayY})
        </div>
      </Html>
    </group>
  );
}
