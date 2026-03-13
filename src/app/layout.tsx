import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ProcessDraw — Process Flow Diagram Builder",
  description: "Create clean, standardized process flow diagrams for Pharma API manufacturing. No design skills needed.",
  keywords: ["process flow diagram", "pharma", "API manufacturing", "GMP", "BPCR", "equipment qualification"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
