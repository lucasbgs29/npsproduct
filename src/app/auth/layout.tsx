export default function AuthLayout({ children }: LayoutProps<"/auth">) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-6 pb-16 sm:px-8 sm:pt-10">
      <header className="mb-8 sm:mb-12">
        <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
          NPSproduct
        </span>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
