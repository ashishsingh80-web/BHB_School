import { AccessDenied } from "@/components/erp/access-denied";
import { ErpRouter } from "@/components/erp/erp-router";
import { canAccessErpPath } from "@/lib/access-control";
import { requireAppUser } from "@/lib/auth";
import { titleForPath } from "@/lib/erp-titles";

type Props = {
  params: Promise<{ path: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ErpCatchAllPage({ params, searchParams }: Props) {
  const { path } = await params;
  const sp = await searchParams;
  const user = await requireAppUser();
  const pathname = `/${path.join("/")}`;
  if (!canAccessErpPath(user.role, pathname)) {
    return <AccessDenied title={titleForPath(pathname)} />;
  }
  return <ErpRouter path={path} searchParams={sp} />;
}
