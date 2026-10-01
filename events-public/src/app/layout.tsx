import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { siteUrl } from "@/server/env";
import "./globals.css";
import { Providers } from "./providers";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: "Tiketi", template: "%s | Tiketi" },
  description:
    "Concerts, talks, fairs and nights out, with every time on the venue's own clock.",
  openGraph: { siteName: "Tiketi", locale: "en_GB", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${roboto.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <Providers>
          <SiteHeader />
          <main className="flex flex-1 flex-col">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
