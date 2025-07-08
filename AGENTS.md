# 🤖 AGENTS.md — Convention de collaboration IA pour le projet Configurateur 3D

Ce fichier définit les responsabilités, le périmètre, les priorités et les contraintes que doivent respecter tous les agents IA ou modèles de langage (LLMs) assistant au développement de l'application.

---

## 🧠 Objectif général du projet

Développer une application web professionnelle permettant à des clients de **personnaliser des panneaux en bois** (dimensions, découpes, usinages, finitions), avec une **visualisation 3D dynamique** et une **modélisation BREP fiable** via **OpenCascade.js**.

L'application doit être fiable, fluide, extensible et adaptée à un usage industriel (CNC, export STEP/DXF).

---

## 🔍 Rôle des agents IA

Un agent IA doit :

- Fournir des **propositions techniques précises** et adaptées à un environnement React / React Three Fiber /Three.js
- Suivre les standards **TypeScript strict**, **modularité du code** et **lisibilité métier**
- Intégrer **OpenCascade.js via WebAssembly** dans un WebWorker
- Préserver l'architecture modulaire du projet (répartition claire entre UI, CAD, et logique de gestion)
- Proposer des **structures de données claires** pour les découpes, la géométrie, les paramètres client
- Aider à l'intégration de **React Three Fiber** pour l'affichage 3D
- Suggérer des évolutions réalistes et professionnalisantes (calcul de prix, export, CI/CD…)

---

## 🧱 Structure actuelle du projet

### Frontend
- React + TypeScript + Comlink
- React Three Fiber + Drei pour la scène 3D
- Zustand pour la gestion de l’état (store centralisé)
- ShadCN UI + Tailwind pour les composants d'interface
- Leva pour le contrôle interactif de paramètres

### Backend (local dans le navigateur)
- WebWorker dédié à OpenCascade.js (compilé via Emscripten)
- Communication main thread ↔ worker via Comlink

---

## 🎯 Priorités de développement

1. Affichage dynamique du panneau en 3D avec découpes
2. Intégration robuste du moteur OCCT dans un WebWorker
3. Architecture modulaire et évolutive
4. Calculs CAD non bloquants pour l’UI
5. À terme : Export STEP / DXF et moteur de pricing

---

## ⚠️ Contraintes à respecter

- Ne jamais intégrer d’appel bloquant dans le thread principal
- Ne jamais écrire de logique CAD directement dans un composant React
- Toujours prioriser la **séparation des responsabilités** :
  - UI = composants purs
  - Moteur CAD = encapsulé dans le worker
  - Rendu = R3F + Drei
  - État = Zustand
- Toute proposition de code doit être :
  - Typée en TypeScript
  - Commentée (en français si métier, en anglais si technique)
  - Écrite de façon modulaire et lisible
- Se référer à la documentation présente sous docs/ ==> docs\doc-opencascade.md pour le développement et les fonctions en lien avec OpenCascade
---

## 🛠️ Fichiers et modules recommandés

| Fichier                     | Rôle                                                         |
|----------------------------|--------------------------------------------------------------|
| `src/occ/worker/occ.worker.ts` | Chargement de OCCT.js, gestion des shapes et triangulations | |
| `src/models/Panel.ts`             | Structure du panneau, paramètres initiaux, découpes        |
| `src/store/panelStore.ts`         | Zustand store : dimensions, matières, découpes             |
| `src/tools/geometry.ts`           | Conversion shape → BufferGeometry                          |

---

## ✅ Bonnes pratiques pour les agents

- Avant d’écrire du code, **clarifier les entrées / sorties attendues**
- Poser des questions si un point est ambigu : `Quelles dimensions sont modifiables ?`, `Les découpes sont-elles fixes ou paramétriques ?`, etc.
- Proposer **des fonctions réutilisables**, bien nommées, avec types explicites
- Toujours envisager la **scalabilité** de la solution : que se passe-t-il si on ajoute 10 découpes ? ou une extrusion ?
- Favoriser la **simplicité UX** : menus clairs, actions visibles, feedback immédiat

---

## 📦 Futurs rôles d’agents IA

- Optimisation WebAssembly pour le poids du module OCCT
- Génération automatique de STEP / DXF
- Génération de devis à partir des découpes et finitions
- Suggestion automatique de nesting pour découpe laser
- Assistant IA de configuration client final (chatbot configurateur)

---

> Toute proposition faite par un agent IA doit pouvoir être justifiée techniquement et compatible avec la stratégie d’architecture définie dans ce projet.
