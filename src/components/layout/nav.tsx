"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Bell, Briefcase, Calendar, ChartColumnIncreasing, FileText, Mail } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Research", icon: FileText },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/simulatore", label: "Simulatore", icon: ChartColumnIncreasing },
  { href: "/brief", label: "Brief", icon: Mail },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/macro", label: "Macro", icon: Calendar },
];

// Pill tabs with a sliding indicator. Sits in the header on desktop and
// becomes a floating bottom bar on phones (below md).
export function Nav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  const activeIndex = NAV.findIndex((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  );

  const measure = useCallback(() => {
    const el = navRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    setPill(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
  }, []);

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, activeIndex]);

  return (
    <nav
      ref={navRef}
      aria-label="Sezioni"
      className={cn(
        "relative flex gap-0.5 rounded-full border border-border bg-card p-1",
        "max-md:fixed max-md:inset-x-3 max-md:bottom-[calc(10px+env(safe-area-inset-bottom,0px))] max-md:z-40",
        "max-md:justify-between max-md:rounded-[22px] max-md:bg-card/90 max-md:p-1.5 max-md:backdrop-blur-xl",
      )}
    >
      {pill && (
        <span
          aria-hidden="true"
          className="absolute inset-y-1 rounded-full bg-secondary shadow-[inset_0_0_0_1px_var(--border)] transition-[left,width] duration-[450ms] ease-[cubic-bezier(.3,1.3,.5,1)] motion-reduce:transition-none max-md:inset-y-1.5 max-md:rounded-2xl"
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {NAV.map((item, i) => {
        const Icon = item.icon;
        const active = i === activeIndex;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-active={active}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative z-10 flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              "max-md:flex-1 max-md:flex-col max-md:gap-0.5 max-md:rounded-2xl max-md:px-1 max-md:py-1.5 max-md:text-[10.5px]",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-[17px] md:hidden" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
