# 📋 Plan d'implémentation des fonctionnalités de découpe

## 🎯 Objectif
Implémenter les fonctionnalités de découpe rectangulaire et circulaire avec visualisation 3D en temps réel, en s'appuyant sur l'architecture existante du projet.

## 🏗️ Architecture actuelle analysée

### ✅ Éléments déjà en place
- **Store Zustand** : `panelStore.ts` pour les dimensions du panneau
- **WebWorker OpenCascade** : `occ.worker.ts` avec API pour créer des boîtes
- **Interface UI** : `CuttingPanel.tsx` avec sélection d'outils (rectangle/cercle)
- **Modèles de données** : `CutBox.ts`, `CutCylinder.ts` avec limites et valeurs par défaut
- **Rendu 3D** : `ContentViewer.tsx` + `AppViewer.tsx` avec React Three Fiber
- **Communication Worker** : Comlink pour isoler les calculs CAD

### 🔄 À développer
- Gestion d'état des découpes dans le store
- Opérations booléennes (soustraction) dans le worker
- Synchronisation UI ↔ Modèle 3D
- Validation des positions et dimensions

---

## 📝 Plan détaillé en 6 étapes

### **ÉTAPE 1 : Extension du modèle de données et du store** ✅ **TERMINÉE**
*Durée réelle : 2h*

#### 1.1 Créer les interfaces de découpe unifiées ✅
- **Fichier** : `src/models/Cut.ts` ✅ **CRÉÉ**
- **Contenu** : ✅ **IMPLÉMENTÉ**
  ```typescript
  // Interface de base pour toutes les découpes
  interface BaseCut {
    id: string;
    name: string;
    positionX: number; // Position sur le panneau (mm)
    positionY: number;
    depth: number; // Profondeur de la découpe (0 = traversante)
    createdAt: number;
    updatedAt: number;
  }
  
  // Découpe rectangulaire (MODIFIÉE: width → length, height → width)
  interface RectangularCut extends BaseCut {
    type: 'rectangle';
    length: number; // Longueur (ex width)
    width: number;  // Largeur (ex height)
  }
  
  // Découpe circulaire  
  interface CircularCut extends BaseCut {
    type: 'circle';
    radius: number;
  }
  
  type Cut = RectangularCut | CircularCut;
  ```

#### 1.2 Étendre le store Zustand ✅
- **Fichier** : `src/store/panelStore.ts` ✅ **ÉTENDU**
- **Ajouts** : ✅ **IMPLÉMENTÉS**
  ```typescript
  interface PanelStore {
    // ... existant
    cuts: Cut[];
    editingCutId: string | null;
    addCut: (cut: Cut) => void;
    updateCut: (id: string, updatedCut: Partial<Cut>) => void;
    removeCut: (id: string) => void;
    clearCuts: () => void;
    duplicateCut: (id: string) => void;
    startEditingCut: (id: string) => void;
    stopEditingCut: () => void;
    validateCutPosition: (cut: Cut) => CutValidationResult;
    getCutsOverlap: () => CutOverlapInfo[];
    getCutById: (id: string) => Cut | undefined;
    getCutsByType: (type: Cut['type']) => Cut[];
  }
  ```

#### 1.3 Fonctions de validation ✅
- **Fonctions** : ✅ **IMPLÉMENTÉES DANS LE STORE**
  - `validateCutPosition()` : Vérifier que la découpe reste dans les limites du panneau ✅
  - `getCutsOverlap()` : Détecter les chevauchements entre découpes ✅
  - Validation des dimensions selon les limites définies ✅

#### 🆕 **Fonctionnalités bonus ajoutées** :
- **Factory functions** : `createDefaultCut()`, `createDefaultRectangularCut()`, `createDefaultCircularCut()`
- **Utilitaires** : `generateCutId()`, `generateCutName()`, `updateCutTimestamp()`
- **Gestion édition** : Mode édition avec `editingCutId`
- **Duplication** : `duplicateCut()` avec décalage automatique
- **Accesseurs** : `getCutById()`, `getCutsByType()`

---

### **ÉTAPE 2 : Refactoring de l'interface CuttingPanel** 🔄 **EN COURS**
*Durée estimée : 3-4h* | *Priorité : IMMÉDIATE pour tester le store*

> **Justification** : Tester l'intégration du store avant les calculs OpenCascade complexes

#### 2.1 Connexion au store Zustand
- **Fichier** : `src/dashboard/CuttingPanel.tsx`
- **Remplacement** : `useState` local → `usePanelStore()`
- **Ajout** : Formulaires de paramètres par type de découpe

#### 2.2 Composants dédiés par type de découpe
- **Fichier** : `src/components/cuts/RectangularCutForm.tsx`
  ```typescript
  interface Props {
    cut?: RectangularCut;
    onSave: (cut: RectangularCut) => void;
    onCancel: () => void;
  }
  
  // Formulaire avec validation en temps réel
  // Position X/Y, longueur, largeur, profondeur
  ```

- **Fichier** : `src/components/cuts/CircularCutForm.tsx`
  ```typescript
  // Formulaire rayon, position, profondeur
  ```

#### 2.3 Gestion du mode édition
- State pour savoir quelle découpe est en cours d'édition
- Boutons "Modifier" sur chaque découpe listée
- Mode "ajout" vs "édition"

---

### **ÉTAPE 3 : Extension du WebWorker OpenCascade** 
*Durée estimée : 4-5h* | *Priorité : APRÈS test du store*

#### 3.1 Nouvelles fonctions dans `occ.worker.ts`
- **Fonction** : `createRectangularCut(cut: RectangularCut)`
  ```typescript
  // Crée une boîte de découpe positionnée
  const cutBox = new oc.BRepPrimAPI_MakeBox_2(
    cut.length, cut.width, cut.depth || panelThickness
  ).Shape();
  
  // Translation vers la position
  const translation = new oc.gp_Trsf_1();
  translation.SetTranslation_1(new oc.gp_Vec_4(cut.positionX, cut.positionY, 0));
  ```

- **Fonction** : `createCircularCut(cut: CircularCut)`
  ```typescript
  // Crée un cylindre de découpe
  const cylinder = new oc.BRepPrimAPI_MakeCylinder_4(
    cut.radius, cut.depth || panelThickness
  ).Shape();
  ```

#### 3.2 Fonction de booléen principal
- **Fonction** : `applyAllCuts(panel: TopoDS_Shape, cuts: Cut[])`
  ```typescript
  // Applique toutes les découpes par soustraction séquentielle
  let resultShape = panel;
  
  for (const cut of cuts) {
    const cutShape = cut.type === 'rectangle' 
      ? createRectangularCut(cut)
      : createCircularCut(cut);
    
    const boolean = new oc.BRepAlgoAPI_Cut_3(
      resultShape, cutShape, new oc.Message_ProgressRange_1()
    );
    boolean.Build();
    resultShape = boolean.Shape();
  }
  
  return resultShape;
  ```

#### 3.3 API Worker mise à jour
- **Fonction** : `createPanelWithCuts({ dimensions, cuts })`
  - Génère le panneau de base
  - Applique toutes les découpes
  - Retourne `{ geometry, edges, url }`

---

### **ÉTAPE 4 : Synchronisation temps réel avec la visualisation 3D**
*Durée estimée : 3-4h*

#### 4.1 Mise à jour de `ContentViewer.tsx`
- **Observer** : Changements dans `store.cuts`
- **Déclenchement** : Recalcul automatique via le worker quand les découpes changent
- **Debouncing** : Éviter les recalculs trop fréquents pendant la saisie

#### 4.2 Optimisation des performances
- **Stategie** : Ne recalculer que si une découpe est ajoutée/supprimée/validée
- **Preview** : Mode aperçu pendant l'édition (géométrie simplifiée)
- **Cache** : Mémoriser les formes intermédiaires

#### 4.3 Gestion des erreurs OCCT
- **Try/catch** : Opérations booléennes peuvent échouer
- **Feedback** : Messages d'erreur utilisateur
- **Rollback** : Revenir à l'état précédent en cas d'échec

---

### **ÉTAPE 5 : Interface utilisateur avancée**
*Durée estimée : 4-5h*

#### 5.1 Sélection interactive sur le modèle 3D
- **Raycasting** : Clic sur une face pour placer une découpe
- **Helpers visuels** : Grid, guides, dimensions
- **Preview découpe** : Overlay semi-transparent avant validation

#### 5.2 Liste des découpes avec actions
- **Composant** : `CutsList.tsx`
  ```typescript
  // Pour chaque découpe :
  // - Icône selon le type
  // - Nom + dimensions
  // - Boutons : Modifier, Dupliquer, Supprimer
  // - Toggle visibilité
  ```

#### 5.3 Validation et contraintes
- **Messages d'erreur** : Position hors limites, chevauchement
- **Suggestions automatiques** : Repositionnement intelligent
- **Aperçu invalide** : Découpe en rouge si problème

---

### **ÉTAPE 6 : Fonctionnalités avancées et polish**
*Durée estimée : 3-4h*

#### 6.1 Import/Export de configurations
- **JSON** : Sauvegarder/charger un set de découpes
- **Historique** : Undo/Redo des opérations
- **Templates** : Découpes prédéfinies

#### 6.2 Calculs métier
- **Surface restante** : Calcul automatique après découpes
- **Optimisation** : Suggestions de placement optimal
- **Coût** : Impact des découpes sur le prix

#### 6.3 Tests et documentation
- **Tests unitaires** : Validation, calculs géométriques
- **Tests d'intégration** : Store ↔ Worker ↔ UI
- **Documentation** : README mise à jour, exemples d'usage

---

## 🔧 Détails techniques par composant

### Store Zustand - État global
```typescript
interface PanelStore {
  // État existant
  dimensions: PanelDimensions;
  
  // Nouveau : état des découpes
  cuts: Cut[];
  editingCutId: string | null;
  
  // Actions découpes
  addCut: (cut: Cut) => void;
  updateCut: (id: string, data: Partial<Cut>) => void;
  removeCut: (id: string) => void;
  startEditingCut: (id: string) => void;
  stopEditingCut: () => void;
  
  // Actions de validation
  validateCutPosition: (cut: Cut) => ValidationResult;
  getCutsOverlap: () => OverlapInfo[];
}
```

### Worker OpenCascade - Calculs CAD
```typescript
interface OccWorkerAPI {
  // Existant
  init: () => Promise<boolean>;
  createBox: (dims: PanelDimensions) => Promise<{...}>;
  
  // Nouveau
  createPanelWithCuts: (config: {
    dimensions: PanelDimensions;
    cuts: Cut[];
  }) => Promise<{
    geometry: PanelGeometryDTO;
    edges: EdgeDTO[];
    url: string;
    cuttingInfo: CuttingInfo; // Métadonnées des découpes
  }>;
  
  // Validation géométrique
  validateCutFeasibility: (
    panelDims: PanelDimensions,
    cut: Cut
  ) => Promise<ValidationResult>;
}
```

### Interface utilisateur - Flux
1. **Sélection outil** → `selectedTool` dans le state
2. **Clic "Ajouter"** → Ouvre le formulaire approprié 
3. **Saisie paramètres** → Validation temps réel
4. **Validation** → Ajout dans le store + recalcul 3D
5. **Modification** → Édition in-place avec prévisualisation

---

## ⚡ Points d'attention

### Performance
- **Debouncing** : Éviter les recalculs trop fréquents
- **Web Worker** : Calculs CAD non-bloquants
- **Memoization** : Cache des géométries intermédiaires

### UX/UI
- **Feedback visuel** : Loading states, progress
- **Validation préventive** : Empêcher les saisies impossibles
- **Raccourcis clavier** : Suppr pour effacer, Escape pour annuler

### Robustesse
- **Gestion d'erreur** : Opérations booléennes peuvent échouer
- **Fallback** : État de secours si calcul impossible
- **Limites** : Nombre max de découpes, complexité géométrique

---

## 📈 Extensions futures envisageables

1. **Autres formes** : Polygones, découpes complexes par sketch
2. **3D** : Découpes en biais, chanfreins, congés
3. **Import** : DXF/SVG pour profils personnalisés
4. **Optimisation** : Algorithmes de placement automatique
5. **Simulation** : Rendu réaliste, ombres, matériaux

---

## ✅ Critères de réussite

- ✅ Ajout/suppression de découpes rectangulaires et circulaires
- ✅ Visualisation 3D temps réel des modifications
- ✅ Validation des positions et dimensions
- ✅ Interface intuitive et responsive
- ✅ Performance acceptable (< 2s pour recalcul)
- ✅ Gestion d'erreurs robuste
- ✅ Code maintenable et bien documenté

Le plan est conçu pour être implémenté par étapes incrémentales, chaque étape apportant de la valeur utilisateur immédiate tout en préparant les fonctionnalités suivantes.

---

## 🎉 RÉSUMÉ DES RÉALISATIONS

### ✅ PHASES TERMINÉES (3/6)

**PHASE 1-2-3 : FONDATIONS ET INTERFACE** *(Durée : ~6h)*
- **Modélisation complète** : Interfaces `RectangularCut` et `CircularCut` avec factory functions
- **Store Zustand étendu** : Gestion d'état complète avec CRUD, validation, édition  
- **Interface utilisateur moderne** : Formulaires spécialisés, validation temps réel, feedback utilisateur
- **Tests d'intégration** : Connexion store ↔ UI vérifiée et fonctionnelle
- **Documentation** : Plan détaillé, guide de test, architecture documentée

### 🎯 PROCHAINES ÉTAPES PRIORITAIRES

1. **PHASE 4 : Worker OpenCascade** - Implémentation des calculs géométriques réels
2. **PHASE 5 : Synchronisation 3D** - Affichage des découpes dans le viewer 3D
3. **PHASE 6 : Polish UX** - Mode édition avancé, sauvegarde, gestion d'erreurs

### 📊 ÉTAT TECHNIQUE ACTUEL

- ✅ **0 erreurs TypeScript** - Code type-safe et robuste
- ✅ **Serveur de dev fonctionnel** - Hot reload sur port 5174
- ✅ **Architecture extensible** - Prêt pour l'ajout du worker OpenCascade
- ✅ **Interface testable** - Formulaires fonctionnels avec validation
- ✅ **Logs de debug** - Traçabilité complète des opérations

### 💡 PRÊT POUR LA SUITE
L'architecture est maintenant solide et prête pour l'intégration des calculs géométriques OpenCascade. Les fondations permettront d'ajouter facilement la synchronisation 3D et les fonctionnalités avancées.
