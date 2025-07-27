# Test d'intégration - Fonctionnalités de découpe

## État actuel de l'implémentation

✅ **TERMINÉ :**
- Modèles de données (`Cut.ts`) avec interfaces `RectangularCut` et `CircularCut`
- Store Zustand (`panelStore.ts`) avec gestion complète des découpes (CRUD, validation, édition)
- Interface utilisateur (`CuttingPanel.tsx`) avec formulaires spécialisés et intégration du store
- Validation en temps réel des formulaires
- Boutons de création de découpes avec validation

## Tests à effectuer

### 1. Test de l'interface utilisateur
1. Ouvrir l'application sur http://localhost:5174/
2. Naviguer vers l'onglet "Découpes" (si disponible dans le Dashboard)
3. Vérifier que les éléments suivants sont visibles :
   - Sélecteur d'outils (Rectangle/Cercle)
   - Bouton "Ajouter une découpe" 
   - Section "Découpes actives" (vide initialement)
   - Section "Paramètres de découpe" avec formulaires

### 2. Test de création de découpes rectangulaires
1. Sélectionner l'outil "Rectangle"
2. Vérifier que le formulaire affiche :
   - Position X, Y
   - Longueur, Largeur
   - Profondeur (0 = traversant)
3. Modifier les valeurs et créer une découpe
4. Vérifier que la découpe apparaît dans "Découpes actives"
5. Vérifier l'affichage des dimensions dans la liste

### 3. Test de création de découpes circulaires
1. Sélectionner l'outil "Cercle"
2. Vérifier que le formulaire affiche :
   - Position X, Y
   - Rayon
   - Diamètre (calculé automatiquement)
   - Profondeur
3. Modifier les valeurs et créer une découpe
4. Vérifier l'affichage du diamètre dans la liste

### 4. Test de validation des formulaires
1. Essayer de créer une découpe avec des valeurs nulles ou négatives
2. Vérifier que le bouton "Créer" est désactivé
3. Vérifier que les valeurs négatives sont automatiquement corrigées à 0

### 5. Test de suppression de découpes
1. Créer plusieurs découpes
2. Supprimer une découpe via l'icône "poubelle"
3. Vérifier que la liste se met à jour

### 6. Test du bouton "Ajouter une découpe" général
1. Cliquer sur le bouton "Ajouter une découpe" (celui en haut)
2. Vérifier qu'une découpe avec des valeurs par défaut est créée

### 7. Test de la console de debug
1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet Console
3. Vérifier que les logs de debug s'affichent :
   - `🔧 CuttingPanel Debug:`
   - État des découpes, outil sélectionné, etc.

## État attendu du store

Le store Zustand doit contenir :
- `cuts: Cut[]` - Liste des découpes créées
- `selectedCutTool: Cut['type']` - Outil actuellement sélectionné
- `isEditingCut: boolean` - Mode édition
- `editingCutId: string | null` - ID de la découpe en cours d'édition

## Problèmes connus à corriger

### À FAIRE ENSUITE :
1. **Mode édition des découpes** - Double-clic pour éditer les paramètres
2. **Synchronisation avec la visualisation 3D** - Afficher les découpes dans le viewer
3. **Validation avancée** - Vérifier que les découpes ne sortent pas du panneau
4. **Worker OpenCascade** - Calculs géométriques réels
5. **Gestion des erreurs** - Messages d'erreur user-friendly
6. **Sauvegarde/chargement** - Persistence des configurations

## Structure des données

```typescript
interface RectangularCut {
  id: string;
  type: 'rectangle';
  name: string;
  positionX: number;
  positionY: number;
  length: number;
  width: number;
  depth: number;
}

interface CircularCut {
  id: string;
  type: 'circle';
  name: string;
  positionX: number;
  positionY: number;
  radius: number;
  depth: number;
}
```

## Notes de développement

- Le serveur de développement tourne sur le port 5174
- Les hot reloads fonctionnent correctement
- Aucune erreur TypeScript détectée
- L'architecture est prête pour l'extension avec le worker OpenCascade
