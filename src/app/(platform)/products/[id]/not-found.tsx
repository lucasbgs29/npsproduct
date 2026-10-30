import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ProductNotFound() {
  return (
    <div className="max-w-xl">
      <p
        aria-hidden
        className="font-display text-[clamp(6rem,20vw,11rem)] leading-[0.8] font-extrabold text-ruler"
      >
        404
      </p>
      <h1 className="mt-6 font-display text-4xl leading-[0.95] font-extrabold tracking-tight text-ink sm:text-5xl">
        Este produto não existe ou foi removido.
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-graphite">
        Confira o link ou escolha outro produto na lista.
      </p>
      <Link
        href="/"
        className={cn(buttonVariants(), "mt-8 h-11 px-6 text-base")}
      >
        Ver todos os produtos
      </Link>
    </div>
  );
}
