"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Briefcase, FileText, Mail } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Research report", icon: FileText },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/brief", label: "Weekly brief", icon: Mail },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 md:flex">
      <div className="px-2 pb-7">
        <Logo withWordmark />
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 font-medium text-foreground ring-1 ring-primary/25"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <Icon className={cn("size-4", active && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-3 text-[11px] text-muted-foreground">
        <p className="leading-relaxed">Free-tier backend. First load may take ~50s while the server wakes.</p>
      </div>
    </aside>
  );
}
