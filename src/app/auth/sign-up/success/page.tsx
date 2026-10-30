import type { Metadata } from "next";
import { NpsRuler } from "../../nps-ruler";

export const metadata: Metadata = {
  title: "Conta criada",
};

export default function SignUpSuccessPage() {
  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      <NpsRuler value={10} label="Cadastro completo: 10 de 10" animateIn />

      <div className="max-w-xl">
        <h1 className="font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-ink sm:text-6xl">
          Conta criada.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-graphite">
          Você já pode avaliar produtos de 0 a 10 no NPSproduct.
        </p>
      </div>
    </div>
  );
}
