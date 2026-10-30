import type { Metadata } from "next";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Criar conta",
};

export default function SignUpPage() {
  return (
    <SignUpForm
      intro={
        <>
          <h1 className="font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-ink sm:text-6xl">
            Avalie os produtos que você usa.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-graphite">
            Crie sua conta para dar notas de 0 a 10 e ver o que outras pessoas
            recomendam.
          </p>
        </>
      }
    />
  );
}
