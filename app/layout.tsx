import type {Metadata} from "next";
import type {ReactNode} from "react";
import "./globals.css";

export const metadata:Metadata={
  title:{default:"FEBRIA CORE 3000",template:"%s | FEBRIA CORE 3000"},
  description:"Ruang kerja rekayasa pola, visualisasi fashion, dan koordinasi produksi.",
};

export default function RootLayout({children}:{children:ReactNode}) {
  return <html lang="id"><body>{children}</body></html>;
}
