
# Documentation OpenCascade.js

> **But** : Servir de base de référence pour le développement d’un configurateur 3D paramétrique avec OpenCascade.js (modélisation, booléens, export, maillage, sélection d’arêtes…)

## Table des matières

- [1. Modélisation paramétrique](#1-modélisation-paramétrique)
- [2. Opérations booléennes](#2-opérations-booléennes)
- [3. Chanfreins et congés](#3-chanfreins-et-congés)
- [4. Sélection d’arêtes](#4-sélection-darêtes)
- [5. Import/Export CAO (STEP, DXF…)](#5-importexport-cao-step-dxf)
- [6. Maillage et export STL/GLB](#6-maillage-et-export-stlglb)

## 1. Modélisation paramétrique

OpenCascade.js permet la génération de formes via des paramètres dynamiques (ex : dimensions). Exemples :
```js
const box = new oc.BRepPrimAPI_MakeBox_2(1, 1, 1).Shape();
const sphere = new oc.BRepPrimAPI_MakeSphere_5(new oc.gp_Pnt_3(0.5, 0.5, 0.5), 0.5).Shape();
```
Liste des primitives :
- `BRepPrimAPI_MakeBox`
- `BRepPrimAPI_MakeSphere`
- `BRepPrimAPI_MakeCylinder`
- `BRepPrimAPI_MakeCone`
- `BRepPrimAPI_MakeTorus`
- `BRepPrimAPI_MakePrism`
- `BRepPrimAPI_MakeRevol`

## 2. Opérations booléennes

Union, différence, intersection :
```js
const cut = new oc.BRepAlgoAPI_Cut_3(shape1, shape2, new oc.Message_ProgressRange_1());
cut.Build();
const result = cut.Shape();
```

API :
- `BRepAlgoAPI_Cut`
- `BRepAlgoAPI_Fuse`
- `BRepAlgoAPI_Common`

## 3. Chanfreins et congés

**Conge :**
```js
const fillet = new oc.BRepFilletAPI_MakeFillet(shape);
fillet.Add_2(5, edge);
const result = fillet.Shape();
```

**Chanfrein :**
```js
const chamfer = new oc.BRepFilletAPI_MakeChamfer(shape);
chamfer.Add(5, edge);
const result = chamfer.Shape();
```

## 4. Sélection d’arêtes

Exploration :
```js
const explorer = new oc.TopExp_Explorer_2(shape, oc.TopAbs_EDGE, oc.TopAbs_SHAPE);
while (explorer.More()) {
  const edge = oc.TopoDS.Edge_1(explorer.Current());
  explorer.Next();
}
```

## 5. Import/Export CAO (STEP, DXF…)

**Import STEP :**
```js
const reader = new oc.STEPControl_Reader_1();
reader.ReadFile("file.step");
reader.TransferRoots();
const shape = reader.OneShape();
```

**Export STEP :**
```js
const writer = new oc.STEPControl_Writer_1();
writer.Transfer(shape, oc.STEPControl_AsIs, true, new oc.Message_ProgressRange_1());
writer.Write("out.step");
```

## 6. Maillage et export STL/GLB

**Maillage :**
```js
new oc.BRepMesh_IncrementalMesh_2(shape, 0.1, false, 0.1, false);
```

**Export STL :**
```js
const writer = new oc.StlAPI_Writer_1();
writer.Write(shape, "model.stl");
```

**Export GLB :**
```js
const cafWriter = new oc.RWGltf_CafWriter("model.glb", true);
cafWriter.Perform_2(doc, new oc.TColStd_IndexedDataMapOfStringString_1(), new oc.Message_ProgressRange_1());
```

---

Documentation fusionnée depuis deux sources principales. À intégrer directement dans `/docs/` ou en tant que fichier `README.md` interne accessible aux agents de développement ou LLM.
