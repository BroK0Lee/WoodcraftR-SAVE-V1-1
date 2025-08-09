# AI coding agent guide for this repo

This project is a React + TypeScript Vite app for a wood panel configurator with 3D (Three.js via React Three Fiber) and CAD (OpenCascade.js in a WebWorker).

## Big picture
- UI: React components under `src/components` and `src/dashboard` (Sidebar + panels). Tailwind + ShadCN UI.
- State: Zustand stores in `src/store` (e.g., `panelStore.ts`, `dashboardStore.ts`, `loadingStore.ts`, `globalMaterialStore.ts`). Treat stores as the single source of truth for selections and app phases.
- 3D viewer: React Three Fiber scene (`src/components/AppViewer.tsx`, `ContentViewer.tsx`, helpers under `src/helpers/` and `src/components/*` like `EdgesLayer`, `DimensionLabels`).
- CAD: OpenCascade.js (WebAssembly) isolated in `src/workers/occ.worker.ts` with Comlink for messaging; higher-level helpers in `src/helpers/` (e.g., `shapeToGeometry.ts`, `shapeToUrl.ts`). Never run heavy CAD on the main thread.
- Material selection: Code lives in `src/components/materialselector/`. A demo GSAP/CSS 3D carousel `Carousel3D.tsx` can be used on the Material tab; legacy 3D sphere/carousel files exist but should not be expanded unless required.

## Conventions and patterns
- TypeScript strict is enabled (`tsconfig.app.json`), unused imports/params cause errors. Keep functions typed explicitly.
- Aliases: `@/*` maps to `src/*` (see `tsconfig.json`). Use these for imports.
- Separation of concerns:
  - UI components are presentational and read/write through Zustand stores.
  - CAD logic runs inside `occ.worker.ts` only; communicate via Comlink.
  - 3D rendering uses R3F/Drei components; helpers convert OCC shapes to THREE geometries.
- Loading flow: `loadingStore.ts` coordinates multi-step init (WebGL worker, selector, etc.). `MainLoadingPage.tsx` orchestrates steps using store flags.
- Tabs: `dashboardStore.ts` holds `activeTab` controlling Dashboard content (e.g., show Material selector on `material`, 3D viewer otherwise).

## Build, run, debug
- Dev: `npm run dev` (Vite). The app serves on http://localhost:5173.
- Build: `npm run build` runs TypeScript build then Vite production build.
- Lint: `npm run lint` uses the ESLint flat config in `eslint.config.js`.
- WebWorker/WASM: Vite config (`vite.config.ts`) already includes `vite-plugin-wasm` and `vite-plugin-top-level-await`. Do not import OCC WASM directly in components.

## Cross-component data flow
- User interactions (sidebar, panels) update Zustand stores (e.g., `panelStore`, `edgeSelectionStore`).
- Worker computes shapes; helpers translate to THREE and update the R3F scene components.
- Material selection should set the chosen material in `globalMaterialStore` (when using a selector UI). The demo `Carousel3D.tsx` currently uses internal mock data; integrate with the store to apply materials system-wide.

## Important files to know
- `src/App.tsx`: App bootstrap, loading flow hooks.
- `src/dashboard/Dashboard.tsx`: Main layout; shows Material selector (or Carousel3D) on the `material` tab; shows `ContentViewer` otherwise.
- `src/components/ContentViewer.tsx` and `src/components/AppViewer.tsx`: 3D scene wrapper and layers.
- `src/workers/occ.worker.ts`: OpenCascade worker entry; all heavy CAD runs here.
- `src/helpers/shapeToGeometry.ts`: Converts OCC shapes to THREE BufferGeometry.
- `src/store/*Store.ts`: Zustand stores for app state.
- `src/components/materialselector/Carousel3D.tsx`: Demo GSAP/CSS 3D carousel component (panel-scoped).

## Patterns to follow in this codebase
- Keep long-running computations out of components; use workers and async calls.
- Use Zustand actions/selectors instead of prop-drilling for global state like selected material, panel dimensions, etc.
- When adding a new 3D feature, encapsulate it as a small React component under `src/components` and rely on helpers in `src/helpers` for geometry conversion.
- For materials, use `globalMaterialStore` and `globalWoodMaterialService.ts` to load/resolve assets from `/public/textures/wood/...`.

## Testing and verification
- The repo includes small manual test pages and debug scripts (`test-*.js`, `debug-*.js`).
- No formal test runner is wired; prefer small in-repo harnesses or R3F story components when prototyping features.

## Common pitfalls
- Avoid importing three.js CSS3DRenderer or GSAP in core viewer code paths; the Carousel demo is self-contained and must not block other UI (ensure it’s sized to its panel and doesn’t use `min-h-screen`).
- Don’t access OCC APIs on the main thread; always route through `occ.worker.ts` and keep messages serializable.
- Respect strict TS and eslint settings; unused imports or variables will break `npm run build`.

## Example: show Material carousel on the Material tab
- In `Dashboard.tsx`:
  - `import Carousel3D from '@/components/materialselector/Carousel3D'`
  - Render `{activeTab === 'material' ? <Carousel3D /> : <ContentViewer />}` inside the right panel.
- To wire selection into the app, dispatch to `useGlobalMaterialStore.getState().setSelectedMaterial(material)` inside the carousel click handler and propagate into the viewer materials.

## Where to ask for clarity
- See `AGENTS.md` for architectural goals and constraints.
- See `docs/doc-opencascade.md` for OCC usage patterns.
- If the 3D selector needs to be simplified, prefer presentational React over bespoke three.js DOM + CSS3D bridges.
