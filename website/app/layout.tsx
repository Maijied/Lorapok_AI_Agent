import React, { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Lorapok AI Agent",
  description: "Lorapok – 🐛 Expert coding agent with CLI and web interface."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}