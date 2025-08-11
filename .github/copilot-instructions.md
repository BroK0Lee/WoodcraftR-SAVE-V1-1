# Copilot – Instructions du repo

## Contexte projet
- Application front **React** (Vite) avec **React Three Fiber (R3F)** et **Three.js** pour la 3D.
- Gestion d'état avec **Zustand**.
- Objectif : configurateur 3D fluide, interactions intuitives, textures PBR cohérentes (sRGB pour baseColor, linéaire pour normal/roughness/ao).

## Gestionnaire de paquets
- Utiliser exclusivement **npm** (pas de pnpm/yarn).
- Ne pas générer de `pnpm-lock.yaml` ni `yarn.lock` (refusés en CI). Seul `package-lock.json` est autorisé.
- Quand des commandes sont suggérées, toujours proposer la variante `npm`.

## Style & conventions
- Utiliser **TypeScript** pour tous les nouveaux fichiers (types explicites pour props, state, utilitaires).
- Nommage : `useXxx` pour hooks, `XxxStore` pour Zustand, `XxxControls` pour composants UI.
- Composants fonctionnels et fonctions pures privilégiés.
- Limiter les re-renders : utiliser `useMemo`, `useCallback` et sélecteurs fins dans Zustand.
- Séparer logique et rendu : la logique 3D dans des hooks ou modules dédiés.
- **Three.js/R3F** :
  - Centraliser lumières et contrôles caméra.
  - Nettoyer (`dispose()`) les ressources non utilisées.
  - Réutiliser matériaux/textures, éviter les allocations par frame.
- **Textures PBR** : baseColor en sRGB, normal/roughness/ao en linéaire, chargement via `useTexture`.

## Patterns souhaités
- Store Zustand séparé en modules clairs, avec sélecteurs spécifiques.
- Canvas `<Canvas>` unique, composants R3F dédiés aux objets/scènes.
- Chargement via suspense et loader minimaliste.
- Raycasting ciblé, throttling sur événements fréquents.

## Tests & qualité
- Générer des tests unitaires pour les utilitaires et fonctions critiques.
- Fournir des messages de commit clairs et significatifs.
- Découper les PR en changements atomiques.

## Attentes vis-à-vis de Copilot
- Proposer du code idiomatique React/R3F.
- Suivre les conventions ci-dessus sans rappel explicite.
- Justifier les choix de conception si demandé.
- Suggérer des optimisations de performance 3D (memoization, instancing, gestion mémoire).

## À éviter
- Ajouter des bibliothèques lourdes sans discussion.
- Multiplier les états globaux inutiles.
- Placer de la logique lourde directement dans le rendu.
