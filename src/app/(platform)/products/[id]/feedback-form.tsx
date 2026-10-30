"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AlertCircleIcon, CheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  COMMENT_MAX,
  type CreateFeedbackData,
  type CreateFeedbackInput,
  createFeedbackSchema,
  type Feedback,
  npsGroup,
} from "@/lib/validations/feedbacks";
import type { ApiErrorResponse } from "@/lib/validations/sign-up";
import { GROUP_CAPTION, ScoreRulerInput } from "./score-ruler-input";

const SERVER_ERROR =
  "A avaliação não foi publicada por um erro no servidor. Tente novamente em alguns instantes.";

async function createFeedback(
  productId: string,
  data: CreateFeedbackData,
): Promise<Feedback> {
  let response: Response;

  try {
    response = await fetch(
      `/api/v1/products/${encodeURIComponent(productId)}/feedbacks`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
  } catch {
    throw new Error(
      "Sem conexão com o servidor. Verifique sua internet e tente novamente.",
    );
  }

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => null)) as ApiErrorResponse | null;
    throw new Error(body?.error.message ?? SERVER_ERROR);
  }

  return response.json();
}

export function FeedbackForm({ productId }: { productId: string }) {
  const router = useRouter();

  const form = useForm<CreateFeedbackInput, unknown, CreateFeedbackData>({
    // Sem nota inicial: o schema barra o envio até alguém escolher uma.
    resolver: zodResolver(createFeedbackSchema),
    mode: "onTouched",
    defaultValues: { score: undefined, comment: "" },
  });

  const [score, comment] = useWatch({
    control: form.control,
    name: ["score", "comment"],
  });
  const remaining = COMMENT_MAX - (comment?.length ?? 0);

  const mutation = useMutation({
    mutationFn: (data: CreateFeedbackData) => createFeedback(productId, data),
    onSuccess: () => {
      form.reset({ score: undefined, comment: "" });
      router.refresh();
    },
  });

  const scoreError = form.formState.errors.score;
  const commentError = form.formState.errors.comment;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
      onChange={() => mutation.isSuccess && mutation.reset()}
    >
      <FieldGroup className="gap-7">
        {mutation.isError && (
          <Alert
            variant="destructive"
            className="border-destructive/40 bg-destructive/5 px-4 py-3"
          >
            <AlertCircleIcon />
            <AlertTitle>Sua avaliação não foi publicada</AlertTitle>
            <AlertDescription>{mutation.error.message}</AlertDescription>
          </Alert>
        )}

        <fieldset className="flex flex-col gap-3">
          <legend
            id="feedback-score-legend"
            className="mb-3 text-[0.9375rem] font-medium"
          >
            De 0 a 10, quanto você recomendaria este produto?
          </legend>
          <Controller
            control={form.control}
            name="score"
            render={({ field }) => (
              <ScoreRulerInput
                name="feedback-score"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={!!scoreError}
                describedBy="feedback-score-caption"
                disabled={mutation.isPending}
              />
            )}
          />
          <p
            id="feedback-score-caption"
            aria-live="polite"
            className={cn(
              "min-h-5 text-sm",
              scoreError ? "text-destructive" : "text-graphite",
            )}
          >
            {scoreError
              ? scoreError.message
              : score === undefined
                ? "0 é nunca recomendaria, 10 é recomendaria com certeza."
                : `Nota ${score}. ${GROUP_CAPTION[npsGroup(score)]}.`}
          </p>
        </fieldset>

        <Field data-invalid={!!commentError}>
          <FieldLabel htmlFor="feedback-comment" className="text-[0.9375rem]">
            Comentário
          </FieldLabel>
          <Textarea
            id="feedback-comment"
            rows={5}
            maxLength={COMMENT_MAX}
            aria-invalid={!!commentError}
            aria-describedby="feedback-comment-count"
            placeholder="O que fez você dar essa nota?"
            disabled={mutation.isPending}
            className="min-h-32 bg-white px-3 py-2.5 text-base leading-relaxed text-foreground md:text-base"
            {...form.register("comment")}
          />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {commentError && <FieldError errors={[commentError]} />}
            </div>
            <FieldDescription
              id="feedback-comment-count"
              className={cn(
                "shrink-0 tabular-nums",
                remaining < 100 && "text-ink",
              )}
            >
              {remaining} caracteres restantes
            </FieldDescription>
          </div>
        </Field>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Button
            type="submit"
            className="h-12 w-full px-8 text-base sm:w-auto"
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Spinner />}
            {mutation.isPending ? "Publicando…" : "Publicar avaliação"}
          </Button>
          <output className="flex items-center gap-1.5 text-sm font-medium text-promoter">
            {mutation.isSuccess && (
              <>
                <CheckIcon aria-hidden className="size-4" />
                Sua avaliação foi publicada.
              </>
            )}
          </output>
        </div>
      </FieldGroup>
    </form>
  );
}
