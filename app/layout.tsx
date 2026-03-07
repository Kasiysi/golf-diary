import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import "./globals.css";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { AppLayout } from "@/components/layout/app-layout";
import { FABWrapper } from "@/components/fab-wrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
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
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <AppLayout>
          {children}
          <FABWrapper />
        </AppLayout>
      </body>
    </html>
  );
}
