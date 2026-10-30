import "server-only";

import { initTRPC, TRPCError } from "@trpc/server";
import type { Session } from "@/server/auth/session";

export type Context = {
  session: Session | null;
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

// Exige uma sessão válida e garante `ctx.session` não nulo nas procedures.
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Entre na sua conta para continuar.",
    });
  }

  return next({ ctx: { session: ctx.session } });
});
