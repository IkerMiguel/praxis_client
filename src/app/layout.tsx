import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import GlobalLoader from "@/components/ui/GlobalLoader";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "PRAXIS // CAMPUS CRMS",
  description: "Gestión e infraestructura del campus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={montserrat.className}>
      <body className="antialiased bg-[#0D111D] text-slate-100 font-sans">
        <GlobalLoader />
        {children}
      </body>
    </html>
  );
}