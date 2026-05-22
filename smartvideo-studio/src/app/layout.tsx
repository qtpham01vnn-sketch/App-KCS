import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { Sidebar } from "@/components/Sidebar";
import { StatusBar } from "@/components/StatusBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tuấn Phạm Studio",
  description: "Local-first AI video generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-full flex flex-col overflow-hidden bg-background text-on-surface selection:bg-primary/30 selection:text-primary">
        <TopNav />
        <Sidebar />
        <main className="fixed top-12 left-20 right-0 bottom-7 overflow-hidden flex bg-background">
          {children}
        </main>
        <StatusBar />
      </body>
    </html>
  );
}
