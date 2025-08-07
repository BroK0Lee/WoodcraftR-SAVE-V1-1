# 🌲 Intégration des Textures de Bois dans le Carousel 3D

## 📁 Structure des Assets

Les textures de bois sont organisées dans `src/assets/textures/wood/` :

```
src/assets/textures/wood/
├── chataignier/
│   ├── chataignier_basecolor.jpg    ← Utilisée dans le carousel
│   ├── chataignier_ao.jpg
│   ├── chataignier_normal.jpg
│   ├── chataignier_roughness.jpg
│   └── chataignier_caract.txt
├── chene/
│   ├── chene_basecolor.jpg         ← Utilisée dans le carousel
│   └── ...
└── [autres_bois]/
```

## 🎠 Configuration du Carousel

### Matériaux Disponibles

Le carousel utilise maintenant **7 vraies textures de bois** :

| ID | Nom | Texture | Prix |
|---|---|---|---|
| `chataignier` | Châtaignier | `chataignier_basecolor.jpg` | 45€/m² |
| `chene` | Chêne | `chene_basecolor.jpg` | 52€/m² |
| `frene` | Frêne | `frene_basecolor.jpg` | 48€/m² |
| `hetre` | Hêtre | `hetre_basecolor.jpg` | 42€/m² |
| `merisier` | Merisier | `merisier_basecolor.jpg` | 65€/m² |
| `noyer` | Noyer | `noyer_basecolor.jpg` | 78€/m² |
| `sycomore` | Sycomore | `sycomore_basecolor.jpg` | 55€/m² |

### 🔧 Utilisation dans le Code

```typescript
import { getAllWoodMaterials, getWoodMaterialById } from './woodMaterials';

// Obtenir tous les matériaux
const materials = getAllWoodMaterials();

// Obtenir un matériau spécifique
const chene = getWoodMaterialById('chene');
```

### 🎯 Avantages de cette Approche

1. **Performance** : Images préchargées par Vite (pas de fetch async)
2. **Typage** : TypeScript avec autocomplétion 
3. **Optimisation** : Vite optimise automatiquement les images
4. **Cache** : Images mises en cache par le navigateur
5. **Simplicité** : Pas de gestion d'erreurs async complexe

## 🔄 Migration depuis le Service Global

Si vous voulez utiliser le `GlobalWoodMaterialService` plus tard :

```typescript
// Actuel (simple, pour carousel)
import { getAllWoodMaterials } from './woodMaterials';

// Future (complet, avec caractéristiques)
import { GlobalWoodMaterialService } from '../../services/globalWoodMaterialService';
```

## 🎨 Personnalisation

Pour ajouter un nouveau bois :

1. **Créer le dossier** : `src/assets/textures/wood/nouveau_bois/`
2. **Ajouter l'image** : `nouveau_bois_basecolor.jpg`
3. **Importer** dans `woodMaterials.ts` :
   ```typescript
   import nouveauBoisTexture from '../../assets/textures/wood/nouveau_bois/nouveau_bois_basecolor.jpg';
   ```
4. **Ajouter au tableau** :
   ```typescript
   {
     id: 'nouveau_bois',
     name: 'Nouveau Bois',
     image: nouveauBoisTexture,
     price: 60
   }
   ```

## 🚀 Test du Carousel

1. Lancer : `npm run dev`
2. Ouvrir : `http://localhost:5173`
3. Aller : Panneau Matériaux → "Tester Carousel 3D"
4. Voir : 7 textures de bois réelles dans le carousel !

## 📊 Format Material

```typescript
interface Material {
  id: string;           // Identifiant unique
  name: string;         // Nom d'affichage
  image: string;        // URL de l'image (gérée par Vite)
  price?: number;       // Prix en €/m²
}
```

Les images sont automatiquement optimisées et cachées par Vite pour une performance maximale ! 🚀
