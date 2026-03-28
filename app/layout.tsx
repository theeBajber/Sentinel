// app/layout.tsxt
import { Inter } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";
import { Nav } from "./ui/nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sentinel - Phishing Detection System",
  description: "Real-time phishing protection and threat monitoring",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-bg-muted text-text-primary flex flex-col items-center`}
      >
        <Nav />
        {children}
      </body>
    </html>
  );
}
