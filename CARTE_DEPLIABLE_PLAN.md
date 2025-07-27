# 🎴 Plan d'implémentation : Carte Matière Dépliable

## 🎯 Concept général

Remplacer le modal actuel par une animation de dépliage de la carte matière directement dans l'environnement 3D. Lorsque l'utilisateur clique sur une carte dans la sphère, celle-ci se déplace vers l'avant-plan et se déplie pour afficher les informations détaillées.

## 🚀 Avantages de cette approche

### ✅ Expérience utilisateur
- **Continuité 3D** : Pas de rupture avec l'environnement immersif
- **Innovation** : Interface unique et mémorable
- **Fluidité** : Transitions animées naturelles
- **Cohérence** : Intégration parfaite avec MaterialSphere

### ✅ Technique
- **Performance** : Rendu 3D natif optimisé
- **Contrôle** : Maîtrise totale des animations Three.js
- **Évolutivité** : Base solide pour futures améliorations

## 🎬 Séquence d'animation détaillée

### Phase 1 : Activation (200ms)
```typescript
// Actions déclenchées au clic sur une carte
1. Désactivation des TrackballControls
2. Highlight de la carte sélectionnée
3. Début de l'animation de sortie de sphère
```

### Phase 2 : Transition 3D (500ms)
```typescript
// Transformations simultanées
Position: sphérique → centre écran
Rotation: angle_sphère → face_caméra (0°, 0°, 0°)
Échelle: 1.0 → 2.5x
Z-depth: arrière-plan → premier plan
```

### Phase 3 : Dépliage du contenu (300ms)
```typescript
// Révélation des informations
Texture: matériau_simple → matériau_détaillé
Géométrie: carte_standard → carte_étendue
Contenu: apparition progressive des détails
Boutons: fade-in des actions (Sélectionner/Retour)
```

### Phase 4 : État déplié stable
- Carte face utilisateur avec informations complètes
- Interaction possible avec les boutons d'action
- Gestion des événements de retour (Escape, clic extérieur)

## 📋 Structure de la carte dépliée

### 🖼️ Layout proposé
```
┌─────────────────────────────────────────┐
│           TEXTURE MATÉRIAU              │
│          (Image principale)             │
├─────────────────────────────────────────┤
│  🌿 NOM DU MATÉRIAU                    │
│  ────────────────────────────────       │
│  📊 Caractéristiques:                  │
│  • Densité: 0.75 g/cm³                 │
│  • Dureté: Très dur                     │
│  • Couleur: Brun doré                   │
│  • Durabilité: Excellente               │
├─────────────────────────────────────────┤
│  🔨 Applications principales:           │
│  • Parquets haut de gamme              │
│  • Mobilier traditionnel               │
│  • Charpente                           │
├─────────────────────────────────────────┤
│  [💚 Sélectionner] [↩️ Retour]          │
└─────────────────────────────────────────┘
```

## 🛠️ Implémentation technique

### 🏗️ Architecture proposée

#### 1. État de la carte
```typescript
type CardState = 'normal' | 'animating' | 'expanded' | 'collapsing';

interface MaterialCardState {
  id: string;
  state: CardState;
  animationProgress: number;
  originalPosition: THREE.Vector3;
  originalRotation: THREE.Euler;
  originalScale: THREE.Vector3;
}
```

#### 2. Gestionnaire d'animation
```typescript
class MaterialCardAnimator {
  private expandedCard: string | null = null;
  private isAnimating: boolean = false;
  
  async expandCard(cardId: string): Promise<void>
  async collapseCard(cardId: string): Promise<void>
  async collapseAll(): Promise<void>
  isCardExpanded(cardId: string): boolean
  isAnimating(): boolean
}
```

#### 3. Gestionnaire d'événements
```typescript
class MaterialCardEventManager {
  private animator: MaterialCardAnimator;
  private controls: TrackballControls;
  
  handleCardClick(cardId: string): void
  handleBackgroundClick(): void
  handleEscapeKey(): void
  enableControls(): void
  disableControls(): void
}
```

### 🎨 Textures et contenu

#### Texture standard vs détaillée
```typescript
interface MaterialTextures {
  standard: THREE.Texture;     // Texture simple pour la sphère
  detailed: THREE.Texture;     // Texture avec informations pour carte dépliée
  preloaded: boolean;
}
```

#### Générateur de texture détaillée
```typescript
class DetailedTextureGenerator {
  generateDetailedTexture(material: GlobalWoodMaterial): THREE.Texture
  createInfoOverlay(material: GlobalWoodMaterial): HTMLCanvasElement
  updateTextureContent(texture: THREE.Texture, material: GlobalWoodMaterial): void
}
```

## 🎯 Défis techniques et solutions

### 🔧 Gestion des événements
**Défi** : Désactivation temporaire des contrôles
**Solution** : 
```typescript
// Sauvegarde et restauration de l'état des contrôles
const preserveControlsState = () => {
  const state = {
    enabled: controls.enabled,
    enableRotate: controls.enableRotate,
    // ... autres propriétés
  };
  return state;
};
```

### 🎨 Performance et rendu
**Défi** : Double rendu (carte normale + détaillée)
**Solution** :
- Préchargement des textures détaillées au démarrage
- LOD (Level of Detail) pour optimiser les cartes non-actives
- Pool d'objets pour réutiliser les géométries

### 📱 Adaptation responsive
**Défi** : Taille écran variable
**Solution** :
```typescript
const calculateCardSize = () => {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768
  };
  
  return {
    scale: viewport.isMobile ? 1.8 : 2.5,
    position: viewport.isMobile ? [0, 0, 2] : [0, 0, 3]
  };
};
```

## 📅 Planning d'implémentation

### 🎯 Phase 1 : MVP (2-3 jours)
- [ ] Animation de base position/rotation/échelle
- [ ] Désactivation temporaire des contrôles
- [ ] Gestion événements de base (clic, retour)
- [ ] Interface minimale sur carte dépliée

### 🎯 Phase 2 : Contenu détaillé (1-2 jours)
- [ ] Génération textures détaillées
- [ ] Intégration données matériaux
- [ ] Boutons d'action fonctionnels
- [ ] Animations de contenu (fade-in)

### 🎯 Phase 3 : Polish & optimisation (1 jour)
- [ ] Animations avancées (easing, spring)
- [ ] Adaptation responsive mobile
- [ ] Tests performance
- [ ] Gestion erreurs

### 🎯 Phase 4 : Améliorations (optionnel)
- [ ] Mini-carrousel d'images
- [ ] Effets visuels avancés
- [ ] Son et feedback haptique
- [ ] Analytics des interactions

## 🔄 Migration depuis le modal actuel

### Étapes de transition
1. **Préparation** : Extraire la logique métier du MaterialModal
2. **Implémentation** : Créer le système de carte dépliable
3. **Test** : Validation A/B entre modal et carte dépliable
4. **Migration** : Remplacement progressif
5. **Nettoyage** : Suppression du MaterialModal obsolète

### Conservation des données
```typescript
// Réutilisation des données existantes de MaterialModal
const materialDetails = MaterialModal.materialDetails;
// Adaptation au nouveau format de rendu 3D
```

## 📊 Métriques de succès

### 🎯 UX
- [ ] Temps d'interaction réduit
- [ ] Taux de sélection amélioré
- [ ] Feedback utilisateur positif
- [ ] Fluidité des animations (60fps)

### 🔧 Technique
- [ ] Temps de chargement < 200ms
- [ ] Mémoire utilisée stable
- [ ] Compatibilité navigateurs > 95%
- [ ] Aucune régression performance

## 🎉 Valeur ajoutée

Cette implémentation apporterait :

1. **🌟 Différenciation** : Interface unique sur le marché
2. **🎨 Immersion** : Expérience 3D cohérente
3. **⚡ Performance** : Optimisation native Three.js
4. **🎯 UX moderne** : Interactions fluides et intuitives
5. **🔮 Évolutivité** : Base pour futures innovations

---

**📝 Note** : Ce plan constitue une roadmap complète pour l'implémentation de la fonctionnalité carte dépliable. L'approche progressive permet une validation continue et une adaptation selon les retours utilisateurs.

**🚀 Prêt pour démarrage** : Architecture claire, défis identifiés, solutions proposées.
