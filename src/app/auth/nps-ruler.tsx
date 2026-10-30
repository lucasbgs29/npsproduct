import { cn } from "@/lib/utils";

const SCALE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// No NPS, quem responde 9 ou 10 e "promotor".
const PROMOTER_FROM = 9;

type NpsRulerProps = {
  /** Quantos pontos da régua estão preenchidos (0 a 10). */
  value: number;
  /** Texto para leitores de tela e legenda visível abaixo da régua. */
  label: string;
  /** Preenche a régua em sequência ao montar (página de sucesso). */
  animateIn?: boolean;
};

export function NpsRuler({ value, label, animateIn = false }: NpsRulerProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={10}
      aria-valuenow={value}
      aria-label={label}
      className="border-b border-ruler pb-2"
    >
      <div
        aria-hidden
        className="flex justify-between font-display text-[clamp(2.25rem,9.5vw,7.5rem)] leading-[0.85] font-extrabold tabular-nums select-none"
      >
        {SCALE.map((n) => {
          const filled = n <= value && value > 0;

          return (
            <span
              key={n}
              data-filled={filled}
              className={cn(
                "text-ruler transition-colors duration-500 ease-out motion-reduce:transition-none",
                filled && (n >= PROMOTER_FROM ? "text-promoter" : "text-ink"),
                filled &&
                  animateIn &&
                  "animate-[nps-fill_480ms_ease-out_both] motion-reduce:animate-none",
              )}
              style={animateIn ? { animationDelay: `${n * 90}ms` } : undefined}
            >
              {n}
            </span>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-graphite">{label}</p>
    </div>
  );
}
