# DXF Import / Export

Available at `/workspace/dxf-studio` on `main`.

## Supported

- ASCII DXF import up to 5 MB and 20,000 entities.
- `LINE`, `LWPOLYLINE`, `CIRCLE`, and `ARC`.
- `$INSUNITS`: mm, cm, m, and inch. Unsupported/missing units default to mm.
- Geometry preview, entity summary, and local export.
- ASCII DXF R12 output with selected units.

## Limitations

- No binary DXF, SPLINE, HATCH, INSERT/BLOCK, DIMENSION, TEXT, 3D, bulges, or legacy POLYLINE handling.
- Unsupported entities are omitted from export.
- No pattern editing or production validation.
- Verify unit and 1:1 scale in CAD and with a qualified pattern maker.

## Verification status

Static source inspection only. The repository does not contain an audited root package manifest, so build/browser/CAD interoperability tests remain pending.
