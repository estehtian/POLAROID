export type DxfUnit = "mm" | "cm" | "m" | "inch";
export type DxfPoint = { x: number; y: number };
export type DxfEntity =
  | { type: "LINE"; layer: string; start: DxfPoint; end: DxfPoint }
  | { type: "LWPOLYLINE"; layer: string; points: DxfPoint[]; closed: boolean }
  | { type: "CIRCLE"; layer: string; center: DxfPoint; radius: number }
  | { type: "ARC"; layer: string; center: DxfPoint; radius: number; startAngle: number; endAngle: number };
export type DxfDocument = { entities: DxfEntity[]; sourceUnit: DxfUnit; ignoredEntityTypes: string[] };

export const MAX_DXF_BYTES = 5 * 1024 * 1024;
export const MAX_DXF_ENTITIES = 20000;
const MAX_COORDINATE_MM = 1e7;
const UNITS_TO_MM: Record<DxfUnit, number> = { mm: 1, cm: 10, m: 1000, inch: 25.4 };

function toMm(value: number, unit: DxfUnit): number {
  const converted = value * UNITS_TO_MM[unit];
  if (!Number.isFinite(converted) || Math.abs(converted) > MAX_COORDINATE_MM) {
    throw new Error("Koordinat DXF berada di luar batas aman.");
  }
  return converted;
}
function numberValue(value: string | undefined, label: string): number {
  if (value === undefined || value.trim() === "") throw new Error(`Nilai ${label} tidak ditemukan di DXF.`);
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Nilai ${label} bukan angka yang valid.`);
  return number;
}
type Pair = { code: number; value: string };
function parsePairs(text: string): Pair[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines.length % 2 !== 0) throw new Error("Format DXF tidak lengkap: baris kode/nilai tidak berpasangan.");
  const pairs: Pair[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    const code = Number(lines[i].trim());
    if (!Number.isInteger(code) || code < 0 || code > 1071) throw new Error(`Group code DXF tidak valid pada baris ${i + 1}.`);
    pairs.push({ code, value: lines[i + 1].trim() });
  }
  return pairs;
}
function getUnit(pairs: Pair[]): DxfUnit {
  for (let i = 0; i < pairs.length - 1; i++) {
    if (pairs[i].value === "$INSUNITS") {
      const code = pairs.slice(i + 1).find(pair => pair.code === 70)?.value;
      switch (Number(code)) {
        case 4: return "mm";
        case 5: return "cm";
        case 6: return "m";
        case 1: return "inch";
        default: return "mm";
      }
    }
  }
  return "mm";
}
function getOne(pairs: Pair[], code: number): string | undefined {
  return pairs.find(pair => pair.code === code)?.value;
}
function getAll(pairs: Pair[], code: number): string[] {
  return pairs.filter(pair => pair.code === code).map(pair => pair.value);
}
function parsePoint(pairs: Pair[], xCode: number, yCode: number, unit: DxfUnit, label: string): DxfPoint {
  return {
    x: toMm(numberValue(getOne(pairs, xCode), `${label}.x`), unit),
    y: toMm(numberValue(getOne(pairs, yCode), `${label}.y`), unit),
  };
}

/** Parse a bounded ASCII DXF subset. Coordinates are normalized to millimetres. */
export function parseDxf(text: string): DxfDocument {
  if (new TextEncoder().encode(text).byteLength > MAX_DXF_BYTES) throw new Error("Ukuran DXF maksimal 5 MB.");
  const pairs = parsePairs(text);
  const sourceUnit = getUnit(pairs);
  const entities: DxfEntity[] = [];
  const ignoredEntityTypes: string[] = [];
  let inEntities = false;
  let records: Pair[][] = [];
  let current: Pair[] | null = null;
  for (const pair of pairs) {
    if (pair.code === 0 && pair.value === "SECTION") {
      current = null;
      continue;
    }
    if (pair.code === 2 && pair.value === "ENTITIES" && !inEntities) {
      inEntities = true;
      records = [];
      current = null;
      continue;
    }
    if (inEntities && pair.code === 0 && pair.value === "ENDSEC") {
      inEntities = false;
      current = null;
      break;
    }
    if (!inEntities) continue;
    if (pair.code === 0) {
      current = [];
      records.push(current);
    } else if (current) current.push(pair);
  }
  if (!records.length) throw new Error("Tidak menemukan section ENTITIES pada file DXF.");
  if (records.length > MAX_DXF_ENTITIES) throw new Error("Jumlah entitas melebihi batas 20.000.");

  for (const record of records) {
    const type = record[0]?.value.toUpperCase();
    const layer = (getOne(record.slice(1), 8) || "0").slice(0, 128);
    const data = record.slice(1);
    try {
      if (type === "LINE") {
        entities.push({ type, layer, start: parsePoint(data, 10, 20, sourceUnit, "LINE start"), end: parsePoint(data, 11, 21, sourceUnit, "LINE end") });
      } else if (type === "LWPOLYLINE") {
        const xs = getAll(data, 10);
        const ys = getAll(data, 20);
        if (xs.length < 2 || xs.length !== ys.length) throw new Error("LWPOLYLINE memerlukan minimal dua pasangan koordinat.");
        const points = xs.map((x, index) => ({ x: toMm(numberValue(x, "LWPOLYLINE.x"), sourceUnit), y: toMm(numberValue(ys[index], "LWPOLYLINE.y"), sourceUnit) }));
        entities.push({ type, layer, points, closed: (Number(getOne(data, 70) || "0") & 1) === 1 });
      } else if (type === "CIRCLE") {
        const center = parsePoint(data, 10, 20, sourceUnit, "CIRCLE center");
        const radius = toMm(numberValue(getOne(data, 40), "CIRCLE radius"), sourceUnit);
        if (radius <= 0) throw new Error("Radius CIRCLE harus lebih dari nol.");
        entities.push({ type, layer, center, radius });
      } else if (type === "ARC") {
        const center = parsePoint(data, 10, 20, sourceUnit, "ARC center");
        const radius = toMm(numberValue(getOne(data, 40), "ARC radius"), sourceUnit);
        if (radius <= 0) throw new Error("Radius ARC harus lebih dari nol.");
        entities.push({ type, layer, center, radius, startAngle: numberValue(getOne(data, 50), "ARC start angle"), endAngle: numberValue(getOne(data, ೆಯಲ್ಲಿ), "ARC end angle") });
      } else if (type && !["ENDSEC", "SEQEND", "VERTEX", "POLYLINE"].includes(type)) {
        ignoredEntityTypes.push(type);
      }
    } catch (error) {
      throw new Error(`${type || "ENTITY"}: ${error instanceof Error ? error.message : "data tidak valid"}`);
    }
  }
  if (!entities.length) throw new Error("Tidak ada entitas yang didukung. Didukung: LINE, LWPOLYLINE, CIRCLE, ARC.");
  return { entities, sourceUnit, ignoredEntityTypes: [...new Set(ignoredEntityTypes)] };
}

function fmt(value: number): string {
  if (!Number.isFinite(value)) throw new Error("Tidak dapat mengekspor koordinat non-finite.");
  return Number(value.toFixed(6)).toString();
}
function pair(code: number, value: string | number): string { return `${code}\n${typeof value === "number" ? fmt(value) : value}\n`; }

/** Export supported entities as a plain ASCII AutoCAD R12 DXF in the selected units. */
export function writeDxf(entities: DxfEntity[], unit: DxfUnit): string {
  if (!entities.length) throw new Error("Tidak ada entitas untuk diekspor.");
  if (entities.length > MAX_DXF_ENTITIES) throw new Error("Jumlah entitas melebihi batas 20.000.");
  const scale = 1 / UNITS_TO_MM[unit];
  let output = "";
  output += pair(0, "SECTION") + pair(2, "HEADER") + pair(9, "$ACADVER") + pair(1, "AC1009");
  const insunits = unit === "inch" ? 1 : unit === "mm" ? 4 : unit === "cm" ? 5 : 6;
  output += pair(9, "$INSUNITS") + pair(70, insunits) + pair(0, "ENDSEC");
  output += pair(0, "SECTION") + pair(2, "ENTITIES");
  for (const entity of entities) {
    const layer = entity.layer.slice(0, 128) || "0";
    if (entity.type === "LINE") {
      output += pair(0, "LINE") + pair(8, layer) + pair(10, entity.start.x * scale) + pair(20, entity.start.y * scale) + pair(30, 0) + pair(11, entity.end.x * scale) + pair(21, entity.end.y * scale) + pair(31, 0);
    } else if (entity.type === "LWPOLYLINE") {
      output += pair(0, "LWPOLYLINE") + pair(8, layer) + pair(90, entity.points.length) + pair(70, entity.closed ? 1 : 0);
      for (const point of entity.points) output += pair(10, point.x * scale) + pair(20, point.y * scale);
    } else if (entity.type === "CIRCLE") {
      output += pair(0, "CIRCLE") + pair(8, layer) + pair(10, entity.center.x * scale) + pair(20, entity.center.y * scale) + pair(30, 0) + pair(40, entity.radius * scale);
    } else {
      output += pair(0, "ARC") + pair(8, layer) + pair(10, entity.center.x * scale) + pair(20, entity.center.y * scale) + pair(30, 0) + pair(40, entity.radius * scale) + pair(50, entity.startAngle) + pair(51, entity.endAngle);
    }
  }
  output += pair(0, "ENDSEC") + pair(0, "EOF");
  return output;
}

export function unitLabel(unit: DxfUnit): string { return unit === "inch" ? "in" : unit; }
