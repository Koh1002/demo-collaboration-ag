import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "マルチエージェント連携デモ",
  description:
    "セキュアなマルチエージェントオーケストレーションの概念実証デモ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-gray-900 font-sans">
        {children}
      </body>
    </html>
  );
}
