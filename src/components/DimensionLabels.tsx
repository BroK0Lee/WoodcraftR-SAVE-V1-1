import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
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
  // ANGLE DE ROTATION - Modifiez ici pour tester
  const rotationAngle = Math.PI / 2; // 0, Math.PI/2, Math.PI, 3*Math.PI/2

  // --- SCALING DYNAMIQUE ---
  const { camera } = useThree();
  // Position des labels X et Y
  const labelXPos: [number, number, number] = useMemo(() => [
    (cut.positionX + 0) / 2,
    0 - 25 - 8,
    panelDimensions.thickness + 0.1
  ], [cut.positionX, panelDimensions.thickness]);
  const labelYPos: [number, number, number] = useMemo(() => [
    0 - 25 - 8,
    (cut.positionY + 0) / 2,
    panelDimensions.thickness + 0.1
  ], [cut.positionY, panelDimensions.thickness]);
  // Calcul de la distance caméra-label (moyenne des deux labels)
  const distX = camera.position.distanceTo(new THREE.Vector3(labelXPos[0], labelXPos[1], labelXPos[2]));
  const distY = camera.position.distanceTo(new THREE.Vector3(labelYPos[0], labelYPos[1], labelYPos[2]));
  // Scaling dynamique (valeurs à ajuster selon la scène)
  const scaleX = Math.max(0.7, Math.min(2.5, distX / 60));
  const scaleY = Math.max(0.7, Math.min(2.5, distY / 60));

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

      {/* Label X (horizontal) - Html @react-three/drei */}
      <Html
        position={labelXPos}
        center
        distanceFactor={1}
        style={{ pointerEvents: 'none', transform: `scale(${scaleX})` }}
      >
        <div style={{ 
          padding: '8px 16px', 
          borderRadius: '4px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          fontSize: '14px', 
          fontWeight: 'bold', 
          backgroundColor: 'rgba(20, 20, 20, 0.9)', 
          color: 'white', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap'
        }}>
          X: {cotationData.displayX}
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

      {/* Label Y avec rotation - Html @react-three/drei */}
      <Html
        position={labelYPos}
        center
        distanceFactor={1}
        style={{ pointerEvents: 'none', transform: `scale(${scaleY})` }}
        rotation={[0, 0, rotationAngle]}
      >
        <div style={{ 
          padding: '8px 16px', 
          borderRadius: '4px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          fontSize: '14px', 
          fontWeight: 'bold', 
          backgroundColor: 'rgba(20, 20, 20, 0.9)', 
          color: 'white', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap'
        }}>
          Y: {cotationData.displayY} ↑
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
