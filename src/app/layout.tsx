import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ToasterProvider } from "@/components/providers/toaster-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fortloot Admin - Bot Management Dashboard",
  description: "Advanced bot management system for Fortnite gifting platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} dark`}>
        <QueryProvider>
          <AuthProvider>
            {children}
            <ToasterProvider />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
