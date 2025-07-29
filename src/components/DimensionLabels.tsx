import { useMemo, useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
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
  const { scene, camera, gl } = useThree();
  const groupRef = useRef<Group>(new Group());
  const rendererRef = useRef<CSS2DRenderer>();

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

  useEffect(() => {
    const group = groupRef.current;
    group.clear();

    // Style EXACT d'AxesHelper
    const labelClass = 'px-1 py-0.5 rounded shadow text-xs font-bold bg-neutral-900/90 text-white border border-white/10 pointer-events-none select-none';

    const createLabel = (label: string, position: [number, number, number]) => {
      const div = document.createElement('div');
      div.className = labelClass;
      div.textContent = label;
      const obj = new CSS2DObject(div);
      obj.position.set(position[0], position[1], position[2]);
      group.add(obj);
    };

    // Labels de cotation avec la même approche qu'AxesHelper
    createLabel(
      cotationData.displayX, 
      [(cotationData.originX + cotationData.positionX) / 2, cotationData.xCotationY - 8, cotationData.zOffset]
    );
    
    createLabel(
      cotationData.displayY, 
      [cotationData.yCotationX - 8, (cotationData.originY + cotationData.positionY) / 2, cotationData.zOffset]
    );

    scene.add(group);
    return () => {
      scene.remove(group);
      group.clear();
    };
  }, [scene, cotationData]);

  useEffect(() => {
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';

    const parent = gl.domElement.parentElement;
    if (parent) {
      parent.appendChild(labelRenderer.domElement);
      rendererRef.current = labelRenderer;
      const handleResize = () => {
        labelRenderer.setSize(parent.clientWidth, parent.clientHeight);
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => {
        parent.removeChild(labelRenderer.domElement);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [gl]);

  useFrame(() => {
    rendererRef.current?.render(scene, camera);
  });

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
