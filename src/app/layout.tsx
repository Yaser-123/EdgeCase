import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EdgeCase | Automated Web Application Quality & Security Testing",
  description: "Test your web application against extreme UI stress, accessibility, basic security, and network conditions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground selection:bg-primary/30 antialiased">
        {children}
      </body>
    </html>
  );
}
