export type ModuleKey =
  | "measurements" | "generator" | "editor" | "library" | "fit-studio"
  | "grading" | "fabric" | "export" | "preview-3d" | "production"
  | "assistant" | "projects" | "admin";

export type ModuleDefinition = {key:ModuleKey;title:string;description:string;href:string};
export const MODULES:ModuleDefinition[] = [
  {key:"measurements",title:"Measurement Studio",description:"Profil ukuran tubuh dan data pengukuran.",href:"/workspace/measurements"},
  {key:"generator",title:"AI Pattern Generator",description:"Pembuatan draft pola parametrik dasar.",href:"/workspace/generator"},
  {key:"editor",title:"Pattern Editor",description:"Pengelolaan draft dan file pola.",href:"/workspace/editor"},
  {key:"library",title:"Garment Library",description:"Referensi dasar konstruksi pakaian.",href:"/workspace/library"},
  {key:"fit-studio",title:"Fit Studio",description:"Perhitungan ease dan target ukuran pakaian.",href:"/workspace/fit-studio"},
  {key:"grading",title:"Pattern Grading",description:"Tabel ukuran bertingkat berbasis aturan.",href:"/workspace/grading"},
  {key:"fabric",title:"Fabric & Marker",description:"Estimasi luas dan konsumsi kain.",href:"/workspace/fabric"},
  {key:"export",title:"Export Center",description:"Ekspor draft SVG dan data CSV.",href:"/workspace/export"},
  {key:"preview-3d",title:"3D Preview",description:"Visualisasi konseptual pakaian.",href:"/workspace/preview-3d"},
  {key:"production",title:"Production Management",description:"Daftar tugas dan status produksi.",href:"/workspace/production"},
  {key:"assistant",title:"AI Fashion Assistant",description:"Panduan rule-based pengembangan pola.",href:"/workspace/assistant"},
  {key:"projects",title:"Project Manager",description:"Pembuatan dan pemilihan proyek lokal.",href:"/workspace/projects"},
  {key:"admin",title:"Admin Management",description:"Ringkasan aktivitas lokal.",href:"/workspace/admin"},
];

export type Measurement = {id:string;name:string;garment:string;chest:number;waist:number;hip:number;shoulder:number;bodyLength:number;sleeve:number;neck:number;unit:"cm"};
export type Project = {id:string;name:string;garment:string;status:string;updatedAt:string};
export type Task = {id:string;title:string;done:boolean};
export type Store = {measurements:Measurement[];projects:Project[];tasks:Task[];lastDraft?:{width:number;height:number;svg:string}};
const KEY="febria-core-3000-store-v1";
export function defaultStore():Store {
  return {
    measurements:[],
    projects:[{id:"sample-project",name:"Proyek Contoh Kemeja",garment:"Kemeja",status:"Draft",updatedAt:new Date(0).toISOString()}],
    tasks:[],
  };
}
export function loadStore():Store {
  if(typeof window==="undefined") return defaultStore();
  try {
    const raw=window.localStorage.getItem(KEY);
    if(!raw) return defaultStore();
    const parsed=JSON.parse(raw) as Store;
    return {...defaultStore(),...parsed};
  } catch { return defaultStore(); }
}
export function saveStore(store:Store) {
  if(typeof window!=="undefined") window.localStorage.setItem(KEY,JSON.stringify(store));
}
