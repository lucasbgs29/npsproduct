import "server-only";

import { sealData, unsealData } from "iron-session";
import { cacheLife } from "next/cache";
import { cookies } from "next/headers";

// Contrato de sessão compartilhado entre as features.
export type Session = {
  accountId: string;
  firstName: string;
  lastName: string;
  email: string;
};

const COOKIE_NAME = "nps_session";

// Sessão de 7 dias, sem renovação automática.
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET precisa ter pelo menos 32 caracteres.");
  }

  return secret;
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;

  const data = value as Record<string, unknown>;

  return (
    typeof data.accountId === "string" &&
    typeof data.firstName === "string" &&
    typeof data.lastName === "string" &&
    typeof data.email === "string"
  );
}

// Lê a sessão do cookie. Precisa ficar atrás de um <Suspense> quando usada
// em Server Components (com Cache Components, ler cookies é dado de request).
// Selo ausente, inválido ou expirado retorna `null`.
export async function getSession(): Promise<Session | null> {
  "use cache: private";
  cacheLife("minutes");

  const seal = (await cookies()).get(COOKIE_NAME)?.value;
  if (!seal) return null;

  let secret: string;
  try {
    secret = getSecret();
  } catch (error) {
    console.error(error);
    return null;
  }

  const data = await unsealData<unknown>(seal, {
    password: secret,
    ttl: SESSION_TTL_SECONDS,
  });

  if (!isSession(data)) return null;

  return {
    accountId: data.accountId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
  };
}

// Só pode ser chamada em Route Handlers ou Server Functions.
export async function createSession(session: Session): Promise<void> {
  const seal = await sealData(
    {
      accountId: session.accountId,
      firstName: session.firstName,
      lastName: session.lastName,
      email: session.email,
    } satisfies Session,
    { password: getSecret(), ttl: SESSION_TTL_SECONDS },
  );

  (await cookies()).set(COOKIE_NAME, seal, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

// Só pode ser chamada em Route Handlers ou Server Functions.
export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}
