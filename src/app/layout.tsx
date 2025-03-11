import type { Metadata } from "next";
import "./globals.css";
import { pretendard, notoSans, notoSansKR } from "./fonts";
import "@cloudscape-design/global-styles/index.css";

export const metadata: Metadata = {
  title: "Karpendar - Karpenter NodePool Disruption Budget Visualizer",
  description: "Visualize AWS Karpenter NodePool Disruption Budgets in a human-readable format",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${pretendard.variable} ${notoSans.variable} ${notoSansKR.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
