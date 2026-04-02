"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import type { UserRole } from "@prisma/client";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ErpSidebar } from "@/components/erp/erp-sidebar";
import { defaultLandingPathForRole } from "@/lib/access-control";
import { titleForPath } from "@/lib/erp-titles";

export function ErpHeader({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const title = titleForPath(pathname);
  const homeHref = defaultLandingPathForRole(role);

  return (
    <header className="bg-background/80 flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Sheet>
          <SheetTrigger
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "md:hidden",
            )}
          >
            <Menu className="size-4" />
            <span className="sr-only">Open navigation</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <ErpSidebar className="border-0" role={role} />
          </SheetContent>
        </Sheet>
        <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={homeHref}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "hidden sm:inline-flex",
          )}
        >
          Dashboard
        </Link>
        <UserButton />
      </div>
    </header>
  );
}
