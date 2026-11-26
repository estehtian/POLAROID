import {notFound} from "next/navigation";
import ModuleWorkspace from "@/components/febria/ModuleWorkspace";
import VisualFashionStudio from "@/components/febria/VisualFashionStudio";
import DxfStudio from "@/components/febria/DxfStudio";
import {MODULES, type ModuleKey} from "@/lib/febria/store";

export function generateStaticParams() {
  return MODULES.map(module=>({module:module.key}));
}
export default async function ModulePage({params}:{params:Promise<{module:string}>}) {
  const {module}=await params;
  if(!MODULES.some(m=>m.key===module)) notFound();
  if(module==="visual-studio") return <VisualFashionStudio/>;
  if(module==="dxf-studio") return <DxfStudio/>;
  return <ModuleWorkspace moduleKey={module as ModuleKey}/>;
}
