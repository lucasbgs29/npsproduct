import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Big_Shoulders } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Display: algarismos altos e condensados, para a régua 0–10 caber inteira.
const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin"],
  axes: ["opsz"],
  fallback: ["Arial Narrow", "sans-serif"],
  adjustFontFallback: false,
});

// Texto e formulários: desenhada para máxima legibilidade.
const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: {
    template: "%s | NPSproduct",
    default: "NPSproduct",
  },
  description:
    "Avalie produtos de 0 a 10 e veja o que outras pessoas recomendam.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${bigShoulders.variable} ${atkinson.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
