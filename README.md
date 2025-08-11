# 🪵 Configurateur 3D de Panneaux Bois

Une application web professionnelle pour configurer des panneaux en bois à la demande avec visualisation 3D dynamique et modélisation BREP (Boundary Representation) grâce à OpenCascade.

## 🚀 Fonctionnalités

- 🔧 **Personnalisation complète** du panneau (dimensions, épaisseur, matière)
- ✏️ **Ajout de découpes interactives** : circulaires, rectangulaires, polygones
- 🧠 **Modélisation BREP** via OpenCascade.js compilé en WebAssembly
- 🖥️ **Affichage 3D dynamique** avec React Three Fiber (basé sur Three.js)
- 🧵 **Architecture multi-thread** avec WebWorker pour isoler le moteur CAD
- 🧩 **Séparation claire du code** entre UI (React), logique métier et CAD
- 🧪 **Base pour export STEP/DXF** (à venir)
- 🧰 **Prêt pour production** CNC ou laser (version pro)

## 🛠️ Stack Technique

- **Frontend** : React + TypeScript + Comlink
- **Moteur CAD** : OpenCascade.js (WebAssembly)
- **Rendu 3D** : React Three Fiber + Drei (Three.js)
- **Multithreading** : WebWorker dédié au moteur OCCT
- **Gestion d’état** : Zustand (en cours d’intégration)
- **UI/UX** : ShadCN UI + Tailwind CSS + Lucide Icons
- **Test & Qualité** : ESLint, Prettier

## 🎯 Utilisation prévue (workflow utilisateur)

1. L’utilisateur définit les dimensions et la matière du panneau
2. Il ajoute des découpes sur les faces (clic ou sélection)
3. Le moteur OCCT calcule la nouvelle géométrie (en WebWorker)
4. Le modèle 3D est mis à jour en temps réel dans React Three Fiber
5. Plus tard : export en STEP, calcul automatique du prix, génération de fichier de production

## 🧱 Architecture

```
[ React UI ]
     ↓
[ Zustand (état) ] ←→ [ React Three Fiber (Canvas) ]
     ↓                     ↑
[ WebWorker → OCCT.js ] → [ Triangulation → BufferGeometry ]
```

## 📦 Gestionnaire de paquets (NPM only)

Ce projet utilise exclusivement **npm**.

- Installation des dépendances:
  - `npm install`
- Démarrer le serveur de développement:
  - `npm run dev`
- Build de production:
  - `npm run build`
- Lint:
  - `npm run lint`

Merci de ne pas utiliser `pnpm` ou `yarn`. Les fichiers `pnpm-lock.yaml` / `yarn.lock` ne doivent pas être committés.

## ✅ Fonctionnalités MVP en place

- ✅ Intégration de OpenCascade.js (OCCT WebAssembly)
- ✅ Communication WebWorker ↔ React

## 🔧 Développement en cours

- 🔄 Gestion d’état centralisée avec Zustand
- 🔄 Onglet “Général” pour taille et matériau
- 🔄 Génération de panneaux avec OCCT côté client
- 🔄 Conversion des shapes OCCT → BufferGeometry
- 🔄 Rendu dynamique avec React Three Fiber
- 🔄 Raycasting sur faces/edges pour découpe précise
- 🔄 Onglet “Découpes/Usinages” (circulaire, rectangulaire, polygonale, chanfrein, etc)
- 🔄Onglet “Finitions” (vernis, laque, inserts filetés…)

## 👨‍💻 Standards de développement

- 📘 Commentaires clairs en français pour la logique métier
- 🔍 Architecture modulaire (src/components, src/models, src/modals…)
- 🧪 Tests unitaires sur les modules critiques
- ✅ Code typé strictement avec TypeScript
-

## 📘 Documentation développement

- 🔍 se référer à la documentation présente sous docs/ ==> docs\doc-opencascade.md pour le développement et des aides sur les fonctions notamment en lien avec OpenCascade

---

> Ce projet est conçu pour servir d’interface de configuration 3D complète et fiable pour une offre de **découpe sur-mesure de panneaux bois** en ligne. Il combine un moteur BREP robuste avec une interface moderne pensée pour des professionnels et des particuliers exigeants.
