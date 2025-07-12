import React, { useMemo } from 'react';
import type { Cut } from '@/models/Cut';
import { calculateCutDepth } from '@/models/Cut';

interface PreviewCutMeshProps {
  /** La découpe à prévisualiser */
  cut: Cut;
  /** Épaisseur du panneau pour définir la profondeur de la découpe */
  panelThickness: number;
  /** Couleur de la prévisualisation (optionnelle) */
  color?: string;
  /** Indique si la découpe est valide (pour changer la couleur) */
  isValid?: boolean;
}

/**
 * Composant pour afficher une découpe en prévisualisation dans le viewer 3D
 * Affiche la forme de la découpe avec un matériau semi-transparent
 */
export const PreviewCutMesh: React.FC<PreviewCutMeshProps> = ({
  cut,
  panelThickness,
  color = '#ff0000', // Rouge opaque par défaut
  isValid = true,
}) => {
  // Couleur dynamique selon la validité
  const finalColor = useMemo(() => {
    return isValid ? color : '#ff0000'; // Rouge plus vif si invalide
  }, [isValid, color]);

  // Couleur du contour (plus contrastée)
  const outlineColor = useMemo(() => {
    return isValid ? '#ffff00' : '#ff8800'; // Jaune ou orange pour le contour
  }, [isValid]);
  
  // Calcul de la profondeur effective pour les offsets
  const cutDepth = calculateCutDepth(cut.depth);
  
  // Géométrie de la découpe selon son type
  const geometry = useMemo(() => {    
    if (cut.type === 'rectangle') {
      // Géométrie rectangulaire
      return (
        <boxGeometry
          args={[
            cut.length,
            cut.width,
            cutDepth, // Utilise depth.cut pour éviter le Z-fighting
          ]}
        />
      );
    } else if (cut.type === 'circle') {
      // Géométrie cylindrique
      return (
        <cylinderGeometry
          args={[
            cut.radius,
            cut.radius,
            cutDepth, // Utilise depth.cut pour éviter le Z-fighting
            32, // segments radiaux
          ]}
        />
      );
    }
    
    // Fallback : petite boîte
    return <boxGeometry args={[1, 1, 1]} />;
  }, [cut, cutDepth]);

  // Position de la découpe
  const position = useMemo((): [number, number, number] => {
    return [
      cut.positionX,
      cut.positionY,
      - (cutDepth-1), // Position Z = panelThickness + 2 epsilon
    ];
  }, [cut.positionX, cut.positionY, panelThickness]);

  return (
    <mesh position={position}>
      {/* Contour/outline de la découpe pour améliorer la visibilité */}
      <mesh 
        position={[0, 0, cutDepth / 2]} 
        renderOrder={2}
        rotation={cut.type === 'circle' ? [Math.PI / 2, 0, 0] : [0, 0, 0]}
      >
        {geometry}
        <meshBasicMaterial
          color={outlineColor}
          wireframe={true}
          transparent={false}
        />
      </mesh>
      
      {/* Géométrie de la découpe avec offset pour que l'origine soit sur la face supérieure */}
      <mesh 
        position={[0, 0, cutDepth / 2]} 
        renderOrder={1}
        rotation={cut.type === 'circle' ? [Math.PI / 2, 0, 0] : [0, 0, 0]}
      >
        {geometry}
        <meshStandardMaterial
          color={finalColor}
          transparent={false}
          emissive={finalColor} // Ajoute une émission pour plus de visibilité
          emissiveIntensity={0.2} // Intensité modérée
        />
      </mesh>
      
      {/* Surface supérieure avec contour pour marquer la zone de découpe */}
      <mesh position={[0, 0, cutDepth + 0.1]} renderOrder={3}>
        {cut.type === 'rectangle' ? (
          <planeGeometry args={[cut.length, cut.width]} />
        ) : (
          <circleGeometry args={[cut.radius, 32]} />
        )}
        <meshBasicMaterial
          color={outlineColor}
          transparent
          opacity={0.4}
          side={2} // DoubleSide pour être visible des deux côtés
        />
      </mesh>
      
      {/* Cube de debug pour visualiser l'origine de la forme (face supérieure) */}
      <mesh position={[0, 0, 0]} renderOrder={4}>
        <boxGeometry args={[2, 2, 2]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
      </mesh>
    </mesh>
  );
};

export default PreviewCutMesh;
