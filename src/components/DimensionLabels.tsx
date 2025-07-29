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
    
    // Offset pour les cotations
    const offset = 50;
    
    // Position de l'origine (0,0)
    const originX = 0;
    const originY = 0;
    
    // Offset Z pour éviter le Z-fighting
    const zOffset = thickness + 0.1;
    
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
      zOffset,
      displayX: positionX.toFixed(1),
      displayY: positionY.toFixed(1)
    };
  }, [cut.positionX, cut.positionY, panelDimensions]);

  return (
    <group>
      {/* === RECTANGLES DE VALEURS TEMPS RÉEL === */}
      
      {/* Rectangle X - positionné près de la flèche rouge */}
      <Html
        position={[(cotationData.originX + cotationData.positionX) / 2, cotationData.xCotationY - 35, cotationData.zOffset]}
        center
        distanceFactor={6}
        style={{ pointerEvents: 'none' }}
      >
        <div className="bg-red-500 text-white px-6 py-3 rounded-xl shadow-xl border-3 border-red-600 min-w-[120px]">
          <div className="text-sm font-semibold text-red-100 mb-1 text-center">Position X</div>
          <div className="text-2xl font-mono font-bold text-center">
            {cotationData.displayX} mm
          </div>
        </div>
      </Html>

      {/* Rectangle Y - positionné près de la flèche bleue */}
      <Html
        position={[cotationData.yCotationX - 35, (cotationData.originY + cotationData.positionY) / 2, cotationData.zOffset]}
        center
        distanceFactor={6}
        style={{ pointerEvents: 'none' }}
        transform
        rotation={[0, 0, Math.PI / 2]}
      >
        <div className="bg-blue-500 text-white px-6 py-3 rounded-xl shadow-xl border-3 border-blue-600 min-w-[120px]">
          <div className="text-sm font-semibold text-blue-100 mb-1 text-center">Position Y</div>
          <div className="text-2xl font-mono font-bold text-center">
            {cotationData.displayY} mm
          </div>
        </div>
      </Html>

      {/* === COTATION X === */}
      
      {/* Ligne de rappel verticale - origine */}
      <mesh position={[cotationData.originX, (cotationData.originY + cotationData.xCotationY) / 2, cotationData.zOffset]}>
        <boxGeometry args={[1, Math.abs(cotationData.originY - cotationData.xCotationY), 0.3]} />
        <meshBasicMaterial color="#888888" />
      </mesh>
      
      {/* Ligne de rappel verticale - position découpe */}
      <mesh position={[cotationData.positionX, (cotationData.positionY + cotationData.xCotationY) / 2, cotationData.zOffset]}>
        <boxGeometry args={[1, Math.abs(cotationData.positionY - cotationData.xCotationY), 0.3]} />
        <meshBasicMaterial color="#888888" />
      </mesh>
      
      {/* Ligne de cotation X principale */}
      <mesh position={[(cotationData.originX + cotationData.positionX) / 2, cotationData.xCotationY, cotationData.zOffset]}>
        <boxGeometry args={[Math.abs(cotationData.positionX - cotationData.originX), 2, 0.5]} />
        <meshBasicMaterial color="#E53E3E" />
      </mesh>
      
      {/* Flèche gauche X */}
      <mesh position={[cotationData.originX, cotationData.xCotationY, cotationData.zOffset]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[3, 10, 8]} />
        <meshBasicMaterial color="#E53E3E" />
      </mesh>
      
      {/* Flèche droite X */}
      <mesh position={[cotationData.positionX, cotationData.xCotationY, cotationData.zOffset]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[3, 10, 8]} />
        <meshBasicMaterial color="#E53E3E" />
      </mesh>
      
      {/* Label cotation X */}
      <Html
        position={[(cotationData.originX + cotationData.positionX) / 2, cotationData.xCotationY - 12, cotationData.zOffset]}
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
      <mesh position={[(cotationData.originX + cotationData.yCotationX) / 2, cotationData.originY, cotationData.zOffset]}>
        <boxGeometry args={[Math.abs(cotationData.originX - cotationData.yCotationX), 1, 0.3]} />
        <meshBasicMaterial color="#888888" />
      </mesh>
      
      {/* Ligne de rappel horizontale - position découpe */}
      <mesh position={[(cotationData.positionX + cotationData.yCotationX) / 2, cotationData.positionY, cotationData.zOffset]}>
        <boxGeometry args={[Math.abs(cotationData.positionX - cotationData.yCotationX), 1, 0.3]} />
        <meshBasicMaterial color="#888888" />
      </mesh>
      
      {/* Ligne de cotation Y principale */}
      <mesh position={[cotationData.yCotationX, (cotationData.originY + cotationData.positionY) / 2, cotationData.zOffset]}>
        <boxGeometry args={[2, Math.abs(cotationData.positionY - cotationData.originY), 0.5]} />
        <meshBasicMaterial color="#3182CE" />
      </mesh>
      
      {/* Flèche bas Y */}
      <mesh position={[cotationData.yCotationX, cotationData.originY, cotationData.zOffset]} rotation={[0, 0, 0]}>
        <coneGeometry args={[3, 10, 8]} />
        <meshBasicMaterial color="#3182CE" />
      </mesh>
      
      {/* Flèche haut Y */}
      <mesh position={[cotationData.yCotationX, cotationData.positionY, cotationData.zOffset]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[3, 10, 8]} />
        <meshBasicMaterial color="#3182CE" />
      </mesh>
      
      {/* Label cotation Y */}
      <Html
        position={[cotationData.yCotationX - 12, (cotationData.originY + cotationData.positionY) / 2, cotationData.zOffset]}
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
      
      {/* Origine du panneau (0,0) */}
      <mesh position={[cotationData.originX, cotationData.originY, cotationData.zOffset]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* Label origine */}
      <Html
        position={[cotationData.originX + 15, cotationData.originY - 15, cotationData.zOffset]}
        center
        distanceFactor={8}
        style={{ pointerEvents: 'none' }}
      >
        <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-mono shadow-lg">
          Origine (0,0)
        </div>
      </Html>

      {/* Position de la découpe */}
      <mesh position={[cotationData.positionX, cotationData.positionY, cotationData.zOffset]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* Label position découpe */}
      <Html
        position={[cotationData.positionX, cotationData.positionY + 20, cotationData.zOffset]}
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
