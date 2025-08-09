// Instance TWEEN partagée pour tout le projet
// Ceci garantit que tous les modules utilisent la même instance TWEEN
import * as TWEEN from '@tweenjs/tween.js';

// Créer un groupe TWEEN partagé explicite
export const TweenGroup = new TWEEN.Group();

// Exporter aussi l'instance complète pour compatibilité
export default TWEEN;

// Export aussi les types/interfaces utiles
export type { Group } from '@tweenjs/tween.js';
