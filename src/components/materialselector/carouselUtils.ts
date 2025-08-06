import { Material } from './MaterialSphere';

// ==========================================
// CALCULS GÉOMÉTRIQUES POUR LE CAROUSEL 3D
// ==========================================

/**
 * Calculer l'angle optimal entre les cartes selon le nombre de matériaux
 */
export function calculateAngleStep(materialCount: number): number {
  if (materialCount === 0) return 0;
  return 360 / materialCount;
}

/**
 * Calculer le rayon optimal selon le nombre de cartes et la taille de l'écran
 */
export function calculateOptimalRadius(
  materialCount: number, 
  containerWidth: number,
  containerHeight: number,
  cardWidth: number = 200
): number {
  // Rayon minimum pour éviter les chevauchements
  const minRadius = (cardWidth * materialCount) / (2 * Math.PI) + 50;
  
  // Rayon maximum basé sur la taille du container
  const maxRadius = Math.min(containerWidth, containerHeight) * 0.3;
  
  // Rayon optimal (entre min et max)
  const optimalRadius = Math.max(minRadius, Math.min(maxRadius, 400));
  
  return Math.round(optimalRadius);
}

/**
 * Calculer la position 3D d'une carte dans le carousel
 */
export function calculateCardPosition(
  index: number,
  totalCards: number,
  radius: number
): { x: number; y: number; z: number; rotationY: number } {
  const angleStep = calculateAngleStep(totalCards);
  const angle = index * angleStep;
  const radians = (angle * Math.PI) / 180;

  return {
    x: radius * Math.cos(radians),
    y: 0, // Carousel horizontal
    z: radius * Math.sin(radians),
    rotationY: angle
  };
}

/**
 * Normaliser un angle entre 0 et 360 degrés
 */
export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Calculer l'index de la carte la plus proche du centre (face à l'utilisateur)
 */
export function getClosestCardIndex(currentRotation: number, totalCards: number): number {
  const normalizedRotation = normalizeAngle(currentRotation);
  const angleStep = calculateAngleStep(totalCards);
  return Math.round(normalizedRotation / angleStep) % totalCards;
}

/**
 * Calculer la rotation nécessaire pour centrer une carte spécifique
 */
export function calculateRotationToCard(cardIndex: number, totalCards: number): number {
  const angleStep = calculateAngleStep(totalCards);
  return cardIndex * angleStep;
}

// ==========================================
// UTILITAIRES POUR LES ANIMATIONS
// ==========================================

/**
 * Générer des délais échelonnés pour les animations d'entrée
 */
export function generateStaggerDelays(totalCards: number, maxDelay: number = 1): number[] {
  const delays: number[] = [];
  const delayStep = maxDelay / totalCards;
  
  for (let i = 0; i < totalCards; i++) {
    delays.push(i * delayStep);
  }
  
  return delays;
}

/**
 * Calculer la durée d'animation basée sur la distance angulaire
 */
export function calculateAnimationDuration(
  fromAngle: number,
  toAngle: number,
  minDuration: number = 0.5,
  maxDuration: number = 2
): number {
  const angleDiff = Math.abs(normalizeAngle(toAngle) - normalizeAngle(fromAngle));
  const shortestAngle = Math.min(angleDiff, 360 - angleDiff);
  
  // Proportionnel à l'angle (plus l'angle est grand, plus c'est long)
  const normalizedAngle = shortestAngle / 180; // 0 à 1
  const duration = minDuration + (normalizedAngle * (maxDuration - minDuration));
  
  return Math.round(duration * 100) / 100; // Arrondir à 2 décimales
}

// ==========================================
// UTILITAIRES RESPONSIVE
// ==========================================

/**
 * Obtenir la configuration responsive selon la taille d'écran
 */
export function getResponsiveConfig(windowWidth: number) {
  if (windowWidth <= 480) {
    // Mobile
    return {
      cardWidth: 140,
      cardHeight: 180,
      imageHeight: 100,
      padding: 8,
      fontSize: { name: 13, price: 11 },
      radius: 300
    };
  } else if (windowWidth <= 768) {
    // Tablette
    return {
      cardWidth: 160,
      cardHeight: 200,
      imageHeight: 120,
      padding: 10,
      fontSize: { name: 14, price: 12 },
      radius: 350
    };
  } else {
    // Desktop
    return {
      cardWidth: 200,
      cardHeight: 250,
      imageHeight: 160,
      padding: 15,
      fontSize: { name: 16, price: 14 },
      radius: 400
    };
  }
}

// ==========================================
// UTILITAIRES POUR LES MATÉRIAUX
// ==========================================

/**
 * Filtrer les matériaux selon des critères
 */
export function filterMaterials(
  materials: Material[],
  filters: {
    priceMin?: number;
    priceMax?: number;
    nameSearch?: string;
  }
): Material[] {
  return materials.filter(material => {
    // Filtre par prix minimum
    if (filters.priceMin && material.price && material.price < filters.priceMin) {
      return false;
    }
    
    // Filtre par prix maximum
    if (filters.priceMax && material.price && material.price > filters.priceMax) {
      return false;
    }
    
    // Filtre par nom (recherche)
    if (filters.nameSearch) {
      const searchTerm = filters.nameSearch.toLowerCase();
      if (!material.name.toLowerCase().includes(searchTerm)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Trier les matériaux selon différents critères
 */
export function sortMaterials(
  materials: Material[],
  sortBy: 'name' | 'price' | 'id',
  order: 'asc' | 'desc' = 'asc'
): Material[] {
  const sorted = [...materials].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'price':
        const priceA = a.price || 0;
        const priceB = b.price || 0;
        comparison = priceA - priceB;
        break;
      case 'id':
        comparison = a.id.localeCompare(b.id);
        break;
    }
    
    return order === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
}

// ==========================================
// UTILITAIRES DE PERFORMANCE
// ==========================================

/**
 * Debounce pour optimiser les événements de redimensionnement
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle pour limiter la fréquence des animations
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
