import { PortalFamilyHomePage } from "@/components/erp/pages/portal-family-home";

export async function PortalParentHomePage() {
  return (
    <PortalFamilyHomePage basePath="/portal/parent" portalLabel="Parent portal" />
  );
}
