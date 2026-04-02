import { redirect } from "next/navigation";

import { ErpHeader } from "@/components/erp/erp-header";
import { ErpSidebar } from "@/components/erp/erp-sidebar";
import { ensureAppUser } from "@/lib/auth";

export default async function ErpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await ensureAppUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="bg-background flex min-h-screen">
      <ErpSidebar className="hidden md:flex" role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <ErpHeader role={user.role} />
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
