# FEBRIA DXF interchange

## Supported functionality

- Browser-local ASCII DXF import and R12 ASCII DXF export.
- Supported planar entities: `LINE`, `LWPOLYLINE` without bulge arcs, `CIRCLE`, and `ARC`.
- Unit recognition via `$INSUNITS` (mm/cm/m/inch); user-selectable fallback if missing/unsupported.
- Coordinates normalize to millimetres internally and can be exported to a selected unit.
- Limits: 5 MiB file, 20,000 entities, and 100,000 polyline vertices.
- Unsupported entity types are reported and omitted. Bulge polylines are rejected because silently flattening curves would change geometry.
- No binary DXF, legacy POLYLINE, SPLINE, INSERT/BLOCK, HATCH, DIMENSION, TEXT, 3D, edit, or production validation.

## Run and test

```bash
npm install
npm run typecheck
npm test
npm run build
```

The sample `docs/fixtures/febria-dxf-sample.dxf` can be loaded in `/workspace/dxf-studio`.

## CAD verification

Open the exported file in a CAD application and measure a known dimension. Confirm the selected units and 1:1 scale before any print or manufacturing workflow. This feature is an interchange utility, not a production pattern certification.
