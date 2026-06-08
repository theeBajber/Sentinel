// app/layout.tsxt
import { Inter } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";
import { Nav } from "./ui/nav";
import { AuthProvider } from "@/lib/auth-context";
import { ConsentProvider } from "./ui/consent-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sentinel - Phishing Detection System",
  description: "Real-time phishing protection and threat monitoring",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-bg-muted text-text-primary flex flex-col min-h-screen`}
      >
        <AuthProvider>
          <ConsentProvider>
            <Nav />
            <div className="flex-1 flex flex-col">
              {children}
            </div>
          </ConsentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
