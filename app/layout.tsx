import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import "./globals.css";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { AppLayout } from "@/components/layout/app-layout";
import { FABWrapper } from "@/components/fab-wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Golf Diary",
  description: "Professional golf practice diary – feels, problems, drills, and coach notes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <AppLayout>
          {children}
          <FABWrapper />
        </AppLayout>
      </body>
    </html>
  );
}
