const SCALE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Esqueleto quieto: mesma grade da página, sem animação.
export default function ProductLoading() {
  return (
    <div aria-busy className="flex flex-col gap-16 sm:gap-24">
      <output className="sr-only">Carregando o produto…</output>
      <div
        aria-hidden
        className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-end md:gap-12"
      >
        <div className="aspect-[4/3] rounded-md bg-ruler/50" />
        <div className="flex flex-col gap-4">
          <div className="h-14 w-4/5 rounded-sm bg-ruler/60 sm:h-20" />
          <div className="h-5 w-full max-w-lg rounded-sm bg-ruler/40" />
          <div className="h-5 w-2/3 max-w-md rounded-sm bg-ruler/40" />
        </div>
      </div>
      <div
        aria-hidden
        className="grid grid-cols-11 gap-0.5 border-t border-ruler pt-2 text-center font-display text-[clamp(1.5rem,4.5vw,2.75rem)] leading-none font-extrabold text-ruler lg:ml-[33%]"
      >
        {SCALE.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  );
}
