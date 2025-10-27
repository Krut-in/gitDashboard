/**
 * Root Layout Component
 *
 * This is the main layout wrapper for the entire application.
 * It sets up global styles, fonts, metadata, and provides the HTML structure.
 * All pages in the app are rendered as children of this layout.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GitHub Contribution Dashboard",
  description:
    "Track and visualize your GitHub contributions and repository insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
