import { Logo } from "@/components/brand/logo";
import { OWNER_NAME, SITE_URL } from "@/lib/site";

import { Nav } from "./nav";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 bg-background/85 backdrop-blur-xl max-md:bg-background max-md:backdrop-blur-none">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-6 py-3">
          <Logo withWordmark />
          <div className="ml-auto">
            <Nav />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col animate-rise">{children}</main>
      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-6 pb-8 pt-4 text-xs text-faint max-md:pb-28">
        <span>{OWNER_NAME}</span>
        {SITE_URL && (
          <a href={SITE_URL} target="_blank" rel="noopener" className="transition-colors hover:text-muted-foreground">
            website ↗
          </a>
        )}
        <span className="ml-auto">Free-tier server: the first load can take ~50s</span>
      </footer>
    </div>
  );
}
