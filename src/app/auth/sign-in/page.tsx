import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Entrar",
};

const SCALE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function SignInPage() {
  return (
    <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
      <div className="max-w-md">
        {/* Régua em versão discreta: a marca das telas de conta, sem progresso. */}
        <div
          aria-hidden
          className="mb-8 flex max-w-xs justify-between font-display text-3xl leading-none font-extrabold tabular-nums select-none sm:mb-10"
        >
          {SCALE.map((n) => (
            <span
              key={n}
              className={cn(n >= 9 ? "text-promoter" : "text-ruler")}
            >
              {n}
            </span>
          ))}
        </div>

        <h1 className="font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-ink sm:text-6xl">
          Que nota você dá hoje?
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-graphite">
          Entre com o email e a senha da sua conta para avaliar os produtos que
          você usa.
        </p>
      </div>

      <SignInForm />
    </div>
  );
}
