export type DxfUnit = "mm" | "cm" | "m" | "inch";
export type DxfPoint = { x: number; y: number };
export type DxfEntity =
  | { type: "LINE"; layer: string; start: DxfPoint; end: DxfPoint }
  | { type: "LWPOLYLINE"; layer: string; points: DxfPoint[]; closed: boolean }
  | { type: "CIRCLE"; layer: string; center: DxfPoint; radius: number }
  | { type: "ARC"; layer: string; center: DxfPoint; radius: number; startAngle: number; endAngle: number };
export type DxfDocument = {
  entities: DxfEntity[];
  sourceUnit: DxfUnit;
  unitDeclared: boolean;
  ignoredEntityTypes: string[];
};

export const MAX_DXF_BYTES = 5 * 1024 * 1024;
export const MAX_DXF_ENTITIES = 20_000;
export const MAX_DXF_VERTICES = 100_000;
const MAX_COORDINATE_MM = 10_000_000;
const UNITS_TO_MM: Record<DxfUnit, number> = { mm: 1, cm: 10, m: 1000, inch: 25.4 };
const UNIT_CODES: Record<number, DxfUnit> = { 1: "inch", 4: "mm", 5: "cm", 6: "m" };

type Pair = { code: number; value: string };

function parsePairs(text: string): Pair[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
  if (lines.length % 2 !== 0) throw new Error("Format DXF tidak lengkap: baris kode/nilai tidak berpasangan.");
  const pairs: Pair[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    const code = Number(lines[i].trim());
    if (!Number.isInteger(code) || code < 0 || code > 1071) throw new Error(`Group code DXF tidak valid pada baris ${i + 1}.`);
    pairs.push({ code, value: lines[i + 1].trim() });
  }
  return pairs;
}

function numberValue(value: string | undefined, label: string): number {
  if (value === undefined || value.trim() === "") throw new Error(`Nilai ${label} tidak ditemukan.`);
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Nilai ${label} bukan angka yang valid.`);
  return number;
}

function toMm(value: number, unit: DxfUnit): number {
  const converted = value * UNITS_TO_MM[unit];
  if (!Number.isFinite(converted) || Math.abs(converted) > MAX_COORDINATE_MM) throw new Error("Koordinat DXF berada di luar batas aman.");
  return converted;
}

function getUnit(pairs: Pair[], fallbackUnit: DxfUnit): { unit: DxfUnit; declared: boolean } {
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i].code !== 0 || pairs[i].value !== "SECTION" || pairs[i + 1]?.code !== 2 || pairs[i + 1]?.value !== "HEADER") continue;
    for (let j = i + 2; j < pairs.length; j++) {
      if (pairs[j].code === 0 && pairs[j].value === "ENDSEC") break;
      if (pairs[j].code === 9 && pairs[j].value === "$INSUNITS") {
        for (let k = j + 1; k < pairs.length && pairs[k].code !== 9 && !(pairs[k].code === 0 && pairs[k].value === "ENDSEC"); k++) {
          if (pairs[k].code === 70) {
            const parsed = UNIT_CODES[Number(pairs[k].value)];
            return parsed ? { unit: parsed, declared: true } : { unit: fallbackUnit, declared: false };
          }
        }
        return { unit: fallbackUnit, declared: false };
      }
    }
    break;
  }
  return { unit: fallbackUnit, declared: false };
}

function one(pairs: Pair[], code: number): string | undefined { return pairs.find(pair => pair.code === code)?.value; }
function all(pairs: Pair[], code: number): string[] { return pairs.filter(pair => pair.code === code).map(pair => pair.value); }
function parsePoint(pairs: Pair[], xCode: number, yCode: number, unit: DxfUnit, label: string): DxfPoint {
  return { x: toMm(numberValue(one(pairs, xCode), `${label}.x`), unit), y: toMm(numberValue(one(pairs, yCode), `${label}.y`), unit) };
}

/** Parse a bounded ASCII DXF subset. Coordinates are normalized to millimetres. */
export function parseDxf(text: string, fallbackUnit: DxfUnit = "mm"): DxfDocument {
  if (!Object.hasOwn(UNITS_TO_MM, fallbackUnit)) throw new Error("Unit fallback tidak valid.");
  if (new TextEncoder().encode(text).byteLength > MAX_DXF_BYTES) throw new Error("Ukuran DXF maksimal 5 MB.");
  const pairs = parsePairs(text);
  const { unit: sourceUnit, declared: unitDeclared } = getUnit(pairs, fallbackUnit);
  const entities: DxfEntity[] = [];
  const ignoredEntityTypes: string[] = [];
  let inEntities = false;
  let records: Pair[][] = [];
  let current: Pair[] | null = null;

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    if (pair.code === 0 && pair.value === "SECTION" && pairs[i + 1]?.code === 2 && pairs[i + 1]?.value === "ENTITIES") {
      inEntities = true;
      records = [];
      current = null;
      i++;
      continue;
    }
    if (inEntities && pair.code === 0 && pair.value === "ENDSEC") break;
    if (!inEntities) continue;
    if (pair.code === 0) {
      current = [];
      records.push(current);
    } else if (current) current.push(pair);
  }

  if (!records.length) throw new Error("Tidak menemukan section ENTITIES pada file DXF.");
  if (records.length > MAX_DXF_ENTITIES) throw new Error("Jumlah entitas melebihi batas 20.000.");
  let vertexCount = 0;
  for (const record of records) {
    const type = (record[0]?.value || "").toUpperCase();
    const data = record.slice(1);
    const layer = (one(data, 8) || "0").slice(0, 128);
    try {
      if (type === "LINE") {
        entities.push({ type, layer, start: parsePoint(data, 10, 20, sourceUnit, "LINE start"), end: parsePoint(data, 11, 21, sourceUnit, "LINE end") });
      } else if (type === "LWPOLYLINE") {
        const xs = all(data, 10);
        const ys = all(data, 20);
        if (xs.length < 2 || xs.length !== ys.length) throw new Error("LWPOLYLINE memerlukan minimal dua pasangan koordinat.");
        vertexCount += xs.length;
        if (vertexCount > MAX_DXF_VERTICES) throw new Error("Jumlah titik melebihi batas 100.000.");
        if (all(data, 42).some(value => numberValue(value, "bulge") !== 0)) throw new Error("LWPOLYLINE dengan segmen bulge/kurva belum didukung; impor dibatalkan agar geometri tidak berubah.");
        entities.push({ type, layer, points: xs.map((x, index) => ({ x: toMm(numberValue(x, "LWPOLYLINE.x"), sourceUnit), y: toMm(numberValue(ys[index], "LWPOLYLINE.y"), sourceUnit) })), closed: (Number(one(data, 70) || "0") & 1) === 1 });
      } else if (type === "CIRCLE") {
        const center = parsePoint(data, 10, 20, sourceUnit, "CIRCLE center");
        const radius = toMm(numberValue(one(data, 40), "CIRCLE radius"), sourceUnit);
        if (radius <= 0) throw new Error("Radius CIRCLE harus lebih dari nol.");
        entities.push({ type, layer, center, radius });
      } else if (type === "ARC") {
        const center = parsePoint(data, 10, 20, sourceUnit, "ARC center");
        const radius = toMm(numberValue(one(data, 40), "ARC radius"), sourceUnit);
        if (radius <= 0) throw new Error("Radius ARC harus lebih dari nol.");
        entities.push({ type, layer, center, radius, startAngle: numberValue(one(data, 50), "ARC start angle"), endAngle: numberValue(one(data, 51), "ARC end angle") });
      } else if (type && type !== "SEQEND") {
        ignoredEntityTypes.push(type);
      }
    } catch (error) {
      throw new Error(`${type || "ENTITY"}: ${error instanceof Error ? error.message : "data tidak valid"}`);
    }
  }
  if (!entities.length) throw new Error("Tidak ada entitas yang didukung. Didukung: LINE, LWPOLYLINE, CIRCLE, ARC.");
  return { entities, sourceUnit, unitDeclared, ignoredEntityTypes: [...new Set(ignoredEntityTypes)] };
}

function fmt(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) > MAX_COORDINATE_MM) throw new Error("Koordinat DXF berada di luar batas aman.");
  return Number(value.toFixed(6)).toString();
}
function pair(code: number, value: string | number): string { return `${code}\n${typeof value === "number" ? fmt(value) : value}\n`; }
function safeLayer(layer: string): string {
  const value = layer.trim() || "0";
  if (value.length > 128 || /[\r\n\0]/.test(value)) throw new Error("Nama layer DXF tidak valid.");
  return value;
}

/** Export the supported 2D entities as ASCII AutoCAD R12 DXF in the selected units. */
export function writeDxf(entities: DxfEntity[], unit: DxfUnit): string {
  if (!Object.hasOwn(UNITS_TO_MM, unit)) throw new Error("Unit ekspor tidak valid.");
  if (!entities.length) throw new Error("Tidak ada entitas untuk diekspor.");
  if (entities.length > MAX_DXF_ENTITIES) throw new Error("Jumlah entitas melebihi batas 20.000.");
  const scale = 1 / UNITS_TO_MM[unit];
  let output = "";
  const insunit = unit === "inch" ? 1 : unit === "mm" ? 4 : unit === "cm" ? 5 : 6;
  output += pair(0, "SECTION") + pair(2, "HEADER") + pair(9, "$ACADVER") + pair(1, "AC1009") + pair(9, "$INSUNITS") + pair(70, insunit) + pair(0, "ENDSEC");
  output += pair(0, "SECTION") + pair(2, "ENTITIES");
  let vertexCount = 0;
  for (const entity of entities) {
    const layer = safeLayer(entity.layer);
    if (entity.type === "LINE") {
      output += pair(0, "LINE") + pair(8, layer) + pair(10, entity.start.x * scale) + pair(20, entity.start.y * scale) + pair(30, 0) + pair(11, entity.end.x * scale) + pair(21, entity.end.y * scale) + pair(31, 0);
    } else if (entity.type === "LWPOLYLINE") {
      if (entity.points.length < 2) throw new Error("LWPOLYLINE harus memiliki minimal dua titik.");
      vertexCount += entity.points.length;
      if (vertexCount > MAX_DXF_VERTICES) throw new Error("Jumlah titik melebihi batas 100.000.");
      output += pair(0, "LWPOLYLINE") + pair(8, layer) + pair(90, entity.points.length) + pair(70, entity.closed ? 1 : 0);
      for (const point of entity.points) output += pair(10, point.x * scale) + pair(20, point.y * scale);
    } else if (entity.type === "CIRCLE") {
      if (entity.radius <= 0) throw new Error("Radius CIRCLE harus lebih dari nol.");
      output += pair(0, "CIRCLE") + pair(8, layer) + pair(10, entity.center.x * scale) + pair(20, entity.center.y * scale) + pair(30, 0) + pair(40, entity.radius * scale);
    } else if (entity.type === "ARC") {
      if (entity.radius <= 0 || !Number.isFinite(entity.startAngle) || !Number.isFinite(entity.endAngle)) throw new Error("Geometri ARC tidak valid.");
      output += pair(0, "ARC") + pair(8, layer) + pair(10, entity.center.x * scale) + pair(20, entity.center.y * scale) + pair(30, 0) + pair(40, entity.radius * scale) + pair(50, entity.startAngle) + pair(51, entity.endAngle);
    } else {
      throw new Error("Tipe entitas DXF tidak didukung.");
    }
  }
  return output + pair(0, "ENDSEC") + pair(0, "EOF");
}

export function unitLabel(unit: DxfUnit): string { return unit === "inch" ? "in" : unit; }
