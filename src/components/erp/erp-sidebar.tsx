"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@prisma/client";

import { defaultLandingPathForRole, filterNavSectionsForRole } from "@/lib/access-control";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function ErpSidebar({
  className,
  role,
}: {
  className?: string;
  role: UserRole;
}) {
  const pathname = usePathname();
  const navSections = filterNavSectionsForRole(role);
  const homeHref = defaultLandingPathForRole(role);

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground flex h-full w-64 shrink-0 flex-col border-r",
        className,
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <Link href={homeHref} className="font-semibold tracking-tight">
          BHB International
        </Link>
      </div>
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="flex flex-col gap-4">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="text-muted-foreground mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "hover:bg-sidebar-accent/60",
                        )}
                      >
                        <item.icon className="size-4 shrink-0 opacity-80" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Separator className="mt-3 bg-sidebar-border" />
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
