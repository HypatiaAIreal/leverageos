import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "LeverageOS — Your Life as a System of Conscious Leverage",
  description: "Companion app to The Invisible Fulcrum (Garcia Bach & Hypatia, 2026)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased film-grain">
        <Sidebar />
        <main className="lg:ml-64 min-h-screen p-4 pt-16 lg:p-8 lg:pt-8">
          {children}
        </main>
      </body>
    </html>
  );
}
