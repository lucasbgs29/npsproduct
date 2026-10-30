"use client";

import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

type UserMenuProps = {
  firstName: string;
  lastName: string;
  email: string;
};

async function signOut(): Promise<void> {
  const response = await fetch("/api/v1/sign-out", { method: "POST" });
  if (!response.ok) throw new Error("Não foi possível sair.");
}

// Avatar com as iniciais, gerado pelo DiceBear nas cores da paleta.
function avatarUrl(fullName: string): string {
  const params = new URLSearchParams({
    seed: fullName,
    backgroundColor: "172033",
    textColor: "f6f7f9",
    fontWeight: "700",
  });
  return `https://api.dicebear.com/9.x/initials/svg?${params}`;
}

export function UserMenu({ firstName, lastName, email }: UserMenuProps) {
  const router = useRouter();
  const fullName = `${firstName} ${lastName}`;

  const mutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => router.refresh(),
  });

  return (
    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {/* O nome aparece ao lado, então o avatar é decorativo (alt vazio). */}
        <Image
          src={avatarUrl(fullName)}
          alt=""
          width={40}
          height={40}
          unoptimized
          className="size-10 shrink-0 rounded-full"
        />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[0.9375rem] font-bold text-ink">
            {fullName}
          </p>
          <p className="truncate text-sm text-graphite">{email}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="inline-flex h-10 shrink-0 items-center gap-2 border-l border-ruler pl-3 text-[0.9375rem] text-graphite underline-offset-4 hover:text-ink hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60 sm:pl-4"
      >
        {mutation.isPending && <Spinner />}
        {mutation.isError ? "Tentar sair de novo" : "Sair"}
      </button>
    </div>
  );
}
