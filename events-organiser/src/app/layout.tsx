import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { cookies } from "next/headers";
import {
  CONTRAST_COOKIE,
  parseContrast,
  parseTheme,
  THEME_COOKIE,
} from "@/features/account/appearance";
import "./globals.css";
import { Providers } from "./providers";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Tiketi for organisers",
    template: "%s | Tiketi for organisers",
  },
  description: "Manage your events.",
  robots: { index: false, follow: false },
};

// The organiser's theme and contrast come from cookies, so the first paint already has them.
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const store = await cookies();
  const theme = parseTheme(store.get(THEME_COOKIE)?.value);
  const contrast = parseContrast(store.get(CONTRAST_COOKIE)?.value);
  return (
    <html
      lang="en"
      data-theme={theme === "system" ? undefined : theme}
      data-contrast={contrast === "high" ? "high" : undefined}
      className={`${roboto.variable} antialiased`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
