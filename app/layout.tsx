import type { Metadata } from "next";
// import { Inter } from "next/font/google"; // Temporarily disabled for debugging
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

// const inter = Inter({ subsets: ["latin"], variable: "--font-sans" }); // Temporarily disabled for debugging

export const metadata: Metadata = {
  title: "TGeasy",
  description: "Manage your advertising posts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased"
          // inter.variable // Temporarily disabled for debugging
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
} 