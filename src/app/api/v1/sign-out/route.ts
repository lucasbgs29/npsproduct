import { destroySession } from "@/server/auth/session";

// POST /api/v1/sign-out
// Apaga o cookie de sessao. Responde 204 mesmo sem sessao ativa.
export async function POST() {
  await destroySession();
  return new Response(null, { status: 204 });
}
