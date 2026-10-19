import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "{{TITLE}}", description: "{{DESCRIPTION}}" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="bg-background text-foreground">{children}</body>
    </html>
  );
}
