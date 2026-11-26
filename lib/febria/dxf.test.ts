import assert from "node:assert/strict";
import test from "node:test";
import { parseDxf, writeDxf, type DxfEntity } from "./dxf";

const entities: DxfEntity[] = [
  { type: "LINE", layer: "SEAM", start: { x: 0, y: 0 }, end: { x: 250, y: 400 } },
  { type: "LWPOLYLINE", layer: "CUT", points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 200 }], closed: true },
  { type: "CIRCLE", layer: "NOTCH", center: { x: 50, y: 75 }, radius: 5 },
  { type: "ARC", layer: "CURVE", center: { x: 30, y: 40 }, radius: 12, startAngle: 10, endAngle: 160 },
];

test("round-trips supported entities and units including final newline", () => {
  for (const unit of ["mm", "cm", "m", "inch"] as const) {
    const parsed = parseDxf(writeDxf(entities, unit));
    assert.equal(parsed.sourceUnit, unit);
    assert.equal(parsed.unitDeclared, true);
    assert.equal(parsed.entities.length, entities.length);
    assert.deepEqual(parsed.entities, entities);
  }
});

test("uses caller-selected fallback units when the header has no supported INSUNITS", () => {
  const text = "0\nSECTION\n2\nENTITIES\n0\nLINE\n10\n1\n20\n2\n11\n3\n21\n4\n0\nENDSEC\n0\nEOF\n";
  const parsed = parseDxf(text, "cm");
  assert.equal(parsed.unitDeclared, false);
  assert.equal(parsed.sourceUnit, "cm");
  assert.deepEqual(parsed.entities[0], { type: "LINE", layer: "0", start: { x: 10, y: 20 }, end: { x: 30, y: 40 } });
});

test("rejects malformed, unsupported-only, and curved bulge polylines instead of silently changing geometry", () => {
  assert.throws(() => parseDxf("0\nSECTION\n2\nENTITIES\n0\nLINE\n10\n0\n"), /tidak berpasangan/i);
  assert.throws(() => parseDxf("0\nSECTION\n2\nENTITIES\n0\nTEXT\n1\nignored\n0\nENDSEC\n0\nEOF\n"), /tidak ada entitas/i);
  const bulge = "0\nSECTION\n2\nENTITIES\n0\nLWPOLYLINE\n90\n2\n10\n0\n20\n0\n42\n0.5\n10\n1\n20\n1\n0\nENDSEC\n0\nEOF\n";
  assert.throws(() => parseDxf(bulge), /bulge/i);
});

test("rejects unsafe output layer values and invalid geometry", () => {
  assert.throws(() => writeDxf([{ ...entities[0], layer: "SEAM\n0\nEOF" }], "mm"), /layer/i);
  assert.throws(() => writeDxf([{ type: "CIRCLE", layer: "0", center: { x: 0, y: 0 }, radius: 0 }], "mm"), /radius/i);
});
