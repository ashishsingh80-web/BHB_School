import { PortalFamilyHomePage } from "@/components/erp/pages/portal-family-home";

export async function PortalStudentHomePage() {
  return (
    <PortalFamilyHomePage basePath="/portal/student" portalLabel="Student portal" />
  );
}
