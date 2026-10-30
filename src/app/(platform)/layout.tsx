import { SiteHeader } from "@/components/site-header";

export default function PlatformLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-8 pb-16 sm:px-8 sm:pt-12">
        {children}
      </main>
    </>
  );
}
