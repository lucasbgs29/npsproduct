import { cn } from "@/lib/utils";
import {
  type Feedback,
  type NpsGroup,
  npsGroup,
} from "@/lib/validations/feedbacks";

const SCALE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const BAR_COLOR: Record<NpsGroup, string> = {
  detractor: "bg-destructive",
  // Cinza mais claro que o grafite: separa o neutro do verde também para
  // quem não distingue cores. Os rótulos dos grupos abaixo dão o reforço.
  passive: "bg-graphite/55",
  promoter: "bg-promoter",
};

const GROUPS: { group: NpsGroup; label: string; span: string }[] = [
  { group: "detractor", label: "Não recomendam", span: "col-span-7" },
  { group: "passive", label: "Neutras", span: "col-span-2" },
  { group: "promoter", label: "Recomendam", span: "col-span-2" },
];

const decimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

type ScoreDistributionProps = {
  feedbacks: Feedback[];
  /** Média gravada em `products.score`; calculada aqui se ainda não existir. */
  average: number | null;
};

// A régua de notas: quantas avaliações caíram em cada ponto de 0 a 10,
// com o NPS do produto (% que recomendam − % que não recomendam).
export function ScoreDistribution({
  feedbacks,
  average,
}: ScoreDistributionProps) {
  const counts = SCALE.map(
    (n) => feedbacks.filter((feedback) => feedback.score === n).length,
  );
  const total = feedbacks.length;
  const max = Math.max(...counts, 1);

  const byGroup = { detractor: 0, passive: 0, promoter: 0 };
  for (const feedback of feedbacks) byGroup[npsGroup(feedback.score)] += 1;

  const nps =
    total > 0
      ? Math.round(((byGroup.promoter - byGroup.detractor) / total) * 100)
      : null;
  const mean =
    average ??
    (total > 0 ? feedbacks.reduce((sum, f) => sum + f.score, 0) / total : null);

  return (
    <section
      aria-labelledby="distribution-title"
      className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-end lg:gap-16"
    >
      <div>
        <h2 id="distribution-title" className="sr-only">
          Notas recebidas
        </h2>
        <p
          className={cn(
            "font-display text-[clamp(5rem,14vw,9rem)] leading-[0.8] font-extrabold tabular-nums",
            nps === null
              ? "text-ruler"
              : nps > 0
                ? "text-promoter"
                : nps < 0
                  ? "text-destructive"
                  : "text-ink",
          )}
        >
          {nps === null ? "–" : nps > 0 ? `+${nps}` : nps}
          <span className="sr-only"> de NPS</span>
        </p>
        <p className="mt-4 max-w-xs text-[0.9375rem] leading-relaxed text-graphite">
          {nps === null ? (
            "Ninguém avaliou ainda, então este produto não tem NPS."
          ) : (
            <>
              <span className="font-medium text-ink">NPS {nps}</span>: a
              porcentagem de quem recomenda (9 e 10) menos a de quem não
              recomenda (0 a 6).
            </>
          )}
        </p>
        {mean !== null && (
          <p className="mt-2 text-[0.9375rem] text-graphite">
            Média{" "}
            <span className="font-medium text-ink">{decimal.format(mean)}</span>{" "}
            em {plural(total, "avaliação", "avaliações")}.
          </p>
        )}
      </div>

      <div>
        <div
          aria-hidden
          className="grid h-36 grid-cols-11 items-end gap-0.5 border-b border-ruler sm:h-44"
        >
          {counts.map((count, n) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: a posição é a nota
              key={n}
              className="group relative flex h-full items-end px-[18%]"
            >
              <div
                className={cn(
                  "w-full rounded-t-[4px]",
                  count > 0 ? BAR_COLOR[npsGroup(n)] : "bg-transparent",
                )}
                style={{ height: count > 0 ? `${(count / max) * 100}%` : 0 }}
              />
              {count > 0 && (
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 rounded-sm bg-ink px-1.5 py-0.5 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100 motion-reduce:transition-none">
                  {plural(count, "avaliação", "avaliações")}
                </span>
              )}
            </div>
          ))}
        </div>

        <div
          aria-hidden
          className="mt-2 grid grid-cols-11 gap-0.5 text-center font-display text-[clamp(1.5rem,4.5vw,2.75rem)] leading-none font-extrabold tabular-nums"
        >
          {SCALE.map((n) => (
            <span
              key={n}
              className={counts[n] > 0 ? "text-ink" : "text-graphite/45"}
            >
              {n}
            </span>
          ))}
        </div>

        <div aria-hidden className="mt-3 grid grid-cols-11 gap-0.5 text-sm">
          {GROUPS.map(({ group, label, span }) => (
            <div key={group} className={cn(span, "min-w-0")}>
              <div className={cn("h-1 rounded-full", BAR_COLOR[group])} />
              <p className="mt-1.5 truncate text-graphite">
                <span className="hidden sm:inline">{label} </span>
                <span className="font-medium text-ink tabular-nums">
                  {byGroup[group]}
                </span>
              </p>
            </div>
          ))}
        </div>
        <p aria-hidden className="mt-2 text-sm text-graphite sm:hidden">
          De 0 a 6 não recomendam, 7 e 8 são neutras, 9 e 10 recomendam.
        </p>

        <table className="sr-only">
          <caption>Quantidade de avaliações por nota</caption>
          <thead>
            <tr>
              <th scope="col">Nota</th>
              <th scope="col">Avaliações</th>
            </tr>
          </thead>
          <tbody>
            {counts.map((count, n) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a posição é a nota
              <tr key={n}>
                <th scope="row">{n}</th>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
