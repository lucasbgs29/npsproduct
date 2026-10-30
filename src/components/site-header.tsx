import Link from "next/link";
import { Suspense } from "react";
import { getSession } from "@/server/auth/session";
import { UserMenu } from "./user-menu";

// Cabeçalho da plataforma. O logo entra no static shell; a área da direita
// lê a sessão (dado de request) e por isso fica atrás de um <Suspense>.
export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 pt-6 sm:px-8 sm:pt-10">
      <Link
        href="/"
        className="shrink-0 font-display text-2xl font-extrabold tracking-tight text-ink focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        NPSproduct
      </Link>

      <Suspense fallback={<div aria-hidden className="h-10 w-24" />}>
        <AccountArea />
      </Suspense>
    </header>
  );
}

async function AccountArea() {
  const session = await getSession();

  if (!session) {
    return (
      <Link
        href="/auth/sign-in"
        className="inline-flex h-10 items-center rounded-lg border border-ink px-4 text-[0.9375rem] font-medium text-ink transition-colors hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Entrar
      </Link>
    );
  }

  return (
    <UserMenu
      firstName={session.firstName}
      lastName={session.lastName}
      email={session.email}
    />
  );
}
