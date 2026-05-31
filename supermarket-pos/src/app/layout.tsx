import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import LayoutWrapper from "@/components/LayoutWrapper";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RASHIDOV_MARKET.no1_POST",
  description: "POS and Inventory Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900">
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
