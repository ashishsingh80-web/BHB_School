import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 p-6">
      <div className="max-w-lg space-y-4 text-center">
        <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          CBSE · Nursery to Class X
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          BHB International School ERP
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Enquiry through admission, student records, class allocation, fees,
          attendance, academics, exams, and parent communication — in one modular,
          role-based workspace.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/sign-in" className={cn(buttonVariants())}>
            Staff sign in
          </Link>
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
