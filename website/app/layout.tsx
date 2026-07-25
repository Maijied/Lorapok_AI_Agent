import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lorapok AI",
  description:
    "A futuristic AI agent platform with premium automation, intelligent workflows, and cinematic design.",
  metadataBase: new URL("https://lorapok.github.io"),
  openGraph: {
    title: "Lorapok AI",
    description:
      "A futuristic AI agent platform with premium automation, intelligent workflows, and cinematic design.",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Lorapok AI",
    description:
      "A futuristic AI agent platform with premium automation, intelligent workflows, and cinematic design."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}