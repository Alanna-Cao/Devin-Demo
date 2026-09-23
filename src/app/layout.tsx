import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/platform/ui/AppShell";

export const metadata: Metadata = {
  title: "Internal Tools Platform",
  description: "Proof of concept for a code-owned internal tools platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
