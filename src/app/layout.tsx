import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Modal from "@/components/Modal";

export const metadata: Metadata = {
  title: "Airtime Queen - Airtime & Rewards",
  description:
    "Your wallet for buying airtime, earning rewards and free airtime advance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="w-full max-w-[400px] mx-auto min-h-[calc(100dvh-65px)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
