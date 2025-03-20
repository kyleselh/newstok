import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { checkEnvironment } from "../utils/validateEnv";

const inter = Inter({ subsets: ["latin"] });

// Validate environment variables at startup
if (typeof window === 'undefined') {
  // Only run on server side
  checkEnvironment();
}

export const metadata: Metadata = {
  title: "NewsTok - Your Daily News Summary",
  description: "Get your daily dose of news with easy-to-read summaries and headlines",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
