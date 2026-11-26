# FEBRIA DXF interchange — status and verification

DXF Import / Export is available at `/workspace/dxf-studio` and in the workspace module registry.

## Supported behavior

- Browser-local import of ASCII DXF files up to 5 MB / 20,000 entities.
- Supported entities: `LINE`, `LWPOLYLINE`, `CIRCLE`, and `ARC`.
- Imported coordinates normalize to millimetres using `$INSUNITS` (mm/cm/m/inch); missing or unsupported units default to mm and must be checked by the user.
- Geometry preview and a summary table are provided.
- Export writes AutoCAD R12 ASCII DXF with an explicit `$INSUNITS`, selected output units, and the supported entities.
- Unsupported DXF entities are reported and omitted on export. This is not a round-trip-preserving editor.

## Known limitations and safe use

- No binary DXF, SPLINE, INSERT/BLOCK, HATCH, DIMENSION, TEXT, 3D entities, bulge curves, or legacy `POLYLINE` sequences.
- Layer names are retained for supported entities; blocks, styles, linetypes, and entity metadata are not.
- There is no edit, pattern grading, or geometry repair feature.
- Import/export runs in the browser; files are not uploaded or persisted.
- This capability is CAD interchange scaffolding, not production-ready pattern engineering. Verify units and 1:1 print scale in a CAD application and review the pattern with a qualified pattern maker.

## Verification status

Static source inspection only. The repository has no root JavaScript package manifest/lockfile in the inspected tree, so typecheck, application build, browser tests, and CAD interoperability tests have not been run. The sample DXF at `docs/fixtures/febria-dxf-sample.dxf` can be used after restoring the full application environment.
