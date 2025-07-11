import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { NotificationCenter } from "@/components/ui/NotificationCenter";
import { PageTransition } from "@/components/ui/PageTransition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Steward - AI-Powered Receipt Tracker",
  description: "Track expenses and analyze receipts with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <PageTransition transitionType="fade">
              {children}
            </PageTransition>
            <NotificationCenter 
              position="bottom-right" 
              variant="subtle"
              className="z-40"
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
