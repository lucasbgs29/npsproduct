"use client";

import { cn } from "@/lib/utils";
import { type NpsGroup, npsGroup } from "@/lib/validations/feedbacks";

const SCALE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Frase curta que acompanha a nota escolhida, sem o jargão do NPS.
export const GROUP_CAPTION: Record<NpsGroup, string> = {
  detractor: "Você não recomendaria",
  passive: "Você talvez recomendasse",
  promoter: "Você recomendaria",
};

const GROUP_TEXT: Record<NpsGroup, string> = {
  detractor: "text-destructive",
  passive: "text-ink",
  promoter: "text-promoter",
};

const GROUP_BAND: Record<NpsGroup, string> = {
  detractor: "bg-destructive",
  passive: "bg-graphite",
  promoter: "bg-promoter",
};

type ScoreRulerInputProps = {
  name: string;
  value: number | undefined;
  onChange: (value: number) => void;
  onBlur: () => void;
  invalid: boolean;
  describedBy?: string;
  disabled?: boolean;
};

// Régua 0–10 como grupo de radios nativos: setas do teclado trocam a nota,
// Tab entra e sai do grupo, e leitores de tela anunciam "Nota 7 de 10".
export function ScoreRulerInput({
  name,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy,
  disabled,
}: ScoreRulerInputProps) {
  const hasValue = value !== undefined;

  return (
    <div
      role="radiogroup"
      aria-labelledby={`${name}-legend`}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className="grid grid-cols-11 gap-0.5"
    >
      {SCALE.map((n) => {
        const group = npsGroup(n);
        const checked = value === n;

        return (
          <label
            key={n}
            className={cn(
              "group relative flex cursor-pointer flex-col items-center rounded-sm pt-1 select-none",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={checked}
              disabled={disabled}
              onChange={() => onChange(n)}
              onBlur={onBlur}
              aria-label={`Nota ${n} de 10`}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "font-display text-[clamp(1.75rem,5.5vw,2.75rem)] leading-none font-extrabold tabular-nums transition-colors duration-150 motion-reduce:transition-none",
                checked
                  ? GROUP_TEXT[group]
                  : hasValue
                    ? "text-graphite/45 group-hover:text-graphite"
                    : "text-graphite group-hover:text-ink",
              )}
            >
              {n}
            </span>
            {/* A faixa colorida mostra a que grupo cada nota pertence. */}
            <span
              aria-hidden
              className={cn(
                "mt-2 w-full rounded-full transition-[height,opacity] duration-150 motion-reduce:transition-none",
                GROUP_BAND[group],
                checked ? "h-2 opacity-100" : "h-1 opacity-35",
              )}
            />
          </label>
        );
      })}
    </div>
  );
}
