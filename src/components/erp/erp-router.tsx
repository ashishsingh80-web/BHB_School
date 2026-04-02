import { StudentsArchivedPage } from "@/components/erp/pages/students-archived";
import { StudentsDocumentsPage } from "@/components/erp/pages/students-documents";
import { StudentsListPage } from "@/components/erp/pages/students-list";
import { StudentsProfilePage } from "@/components/erp/pages/students-profile";
import { StudentsWorkspacePage } from "@/components/erp/pages/students-workspace";
import { AdmissionsEnquiryEntryPage } from "@/components/erp/pages/admissions-enquiry-entry";
import { AdmissionsEnquiryListPage } from "@/components/erp/pages/admissions-enquiry-list";
import { AdmissionsAdmissionFormPage } from "@/components/erp/pages/admissions-admission-form";
import { AdmissionsAdmissionFeePage } from "@/components/erp/pages/admissions-admission-fee";
import { AdmissionsApprovedPage } from "@/components/erp/pages/admissions-approved";
import { AdmissionsFinalAdmissionPage } from "@/components/erp/pages/admissions-final-admission";
import { AdmissionsFollowUpPage } from "@/components/erp/pages/admissions-follow-up";
import { AdmissionsPendingDocumentsPage } from "@/components/erp/pages/admissions-pending-documents";
import { AdmissionsRegistrationPage } from "@/components/erp/pages/admissions-registration";
import { AdmissionsRejectedPage } from "@/components/erp/pages/admissions-rejected";
import { AdmissionsOnlineLeadsPage } from "@/components/erp/pages/admissions-online-leads";
import { AdmissionsSurveyPage } from "@/components/erp/pages/admissions-survey";
import { AdmissionsWaitlistPage } from "@/components/erp/pages/admissions-waitlist";
import { ModulePlaceholder } from "@/components/erp/module-placeholder";
import { DashboardHome } from "@/components/erp/pages/dashboard-home";
import { DashboardWorkspacePage } from "@/components/erp/pages/dashboard-workspace";
import { ClassesPage } from "@/components/erp/pages/classes";
import { FeeHeadsPage } from "@/components/erp/pages/fee-heads";
import { MasterDocumentTypesPage } from "@/components/erp/pages/master-document-types";
import { MasterTransportHubPage } from "@/components/erp/pages/master-transport-hub";
import { SchoolProfilePage } from "@/components/erp/pages/school-profile";
import { SectionsPage } from "@/components/erp/pages/sections";
import { SessionsPage } from "@/components/erp/pages/sessions";
import { SubjectsPage } from "@/components/erp/pages/subjects";
import { FeesAssignmentPage } from "@/components/erp/pages/fees-assignment";
import { FeesCollectPage } from "@/components/erp/pages/fees-collect";
import { FeesDailyCollectionPage } from "@/components/erp/pages/fees-daily-collection";
import { FeesDefaultersPage } from "@/components/erp/pages/fees-defaulters";
import { FeesHeadWisePage } from "@/components/erp/pages/fees-head-wise";
import { FeesLedgerPage } from "@/components/erp/pages/fees-ledger";
import { FeesMonthlyCollectionPage } from "@/components/erp/pages/fees-monthly-collection";
import { FeesReceiptsPage } from "@/components/erp/pages/fees-receipts";
import { FeesRefundsPage } from "@/components/erp/pages/fees-refunds";
import { FeesStructurePage } from "@/components/erp/pages/fees-structure";
import { TimetableWorkspacePage } from "@/components/erp/pages/timetable-workspace";
import { AttendanceAlertsPage } from "@/components/erp/pages/attendance-alerts";
import { AttendanceMonthlyPage } from "@/components/erp/pages/attendance-monthly";
import { AttendanceStudentsPage } from "@/components/erp/pages/attendance-students";
import { AiAutomationPage } from "@/components/erp/pages/ai-automation";
import { AiParentPage } from "@/components/erp/pages/ai-parent";
import { AiStudentPage } from "@/components/erp/pages/ai-student";
import { AiTeacherPage } from "@/components/erp/pages/ai-teacher";
import { AcademicsClassDiaryPage } from "@/components/erp/pages/academics-class-diary";
import { AcademicsHomeworkPage } from "@/components/erp/pages/academics-homework";
import { AcademicsSmartContentPage } from "@/components/erp/pages/academics-smart-content";
import { ExamsMarksEntryPage } from "@/components/erp/pages/exams-marks-entry";
import { ExamsResultsPage } from "@/components/erp/pages/exams-results";
import { ExamsSetupPage } from "@/components/erp/pages/exams-setup";
import { ExamsAnalysisPage } from "@/components/erp/pages/exams-analysis";
import { ExamsGradeRulesPage } from "@/components/erp/pages/exams-grade-rules";
import { ExamsReportCardPage } from "@/components/erp/pages/exams-report-card";
import { ExamsWeakStudentsPage } from "@/components/erp/pages/exams-weak-students";
import { AccountsExpensesPage } from "@/components/erp/pages/accounts-expenses";
import { AccountsFuelPage } from "@/components/erp/pages/accounts-fuel";
import { AccountsStaffAdvancePage } from "@/components/erp/pages/accounts-staff-advance";
import { TransportCompliancePage } from "@/components/erp/pages/transport-compliance";
import { TransportFuelLogPage } from "@/components/erp/pages/transport-fuel-log";
import { TransportFeesPage } from "@/components/erp/pages/transport-fees";
import { TransportMappingPage } from "@/components/erp/pages/transport-mapping";
import { TransportRoutesPage } from "@/components/erp/pages/transport-routes";
import { TransportStopsPage } from "@/components/erp/pages/transport-stops";
import { TransportVehiclesPage } from "@/components/erp/pages/transport-vehicles";
import { InventoryAlertsPage } from "@/components/erp/pages/inventory-alerts";
import { InventoryIssuesPage } from "@/components/erp/pages/inventory-issues";
import { InventoryItemsPage } from "@/components/erp/pages/inventory-items";
import { InventoryStockPage } from "@/components/erp/pages/inventory-stock";
import { HrStaffDirectoryPage } from "@/components/erp/pages/hr-staff-directory";
import { HrPayrollPage } from "@/components/erp/pages/hr-payroll";
import { CertificatesWorkspacePage } from "@/components/erp/pages/certificates-workspace";
import { SettingsAuditLogsPage } from "@/components/erp/pages/settings-audit-logs";
import { SettingsUsersPage } from "@/components/erp/pages/settings-users";
import { SettingsWorkspacePage } from "@/components/erp/pages/settings-workspace";
import { FrontOfficeWorkspacePage } from "@/components/erp/pages/front-office-workspace";
import { CommunicationNoticesPage } from "@/components/erp/pages/communication-notices";
import { CommunicationComplaintsPage } from "@/components/erp/pages/communication-complaints";
import { CommunicationWorkspacePage } from "@/components/erp/pages/communication-workspace";
import { PortalParentAttendancePage } from "@/components/erp/pages/portal-parent-attendance";
import { PortalParentFeesPage } from "@/components/erp/pages/portal-parent-fees";
import { PortalParentHomePage } from "@/components/erp/pages/portal-parent-home";
import { PortalParentHomeworkPage } from "@/components/erp/pages/portal-parent-homework";
import { PortalStudentHomePage } from "@/components/erp/pages/portal-student-home";
import { PortalStudentTimetablePage } from "@/components/erp/pages/portal-student-timetable";
import { ReportsMisPage } from "@/components/erp/pages/reports-mis";
import { titleForPath } from "@/lib/erp-titles";

type Props = {
  path: string[];
  searchParams?: Record<string, string | string[] | undefined>;
};

function firstString(
  v: string | string[] | undefined,
): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export function ErpRouter({ path, searchParams = {} }: Props) {
  const key = path.join("/");
  const href = "/" + key;

  if (key === "dashboard") {
    return <DashboardHome />;
  }

  if (key.startsWith("dashboard/")) {
    const slug = path[1];
    switch (slug) {
      case "ai-summary":
        return <DashboardWorkspacePage mode="ai-summary" />;
      case "alerts":
        return <DashboardWorkspacePage mode="alerts" />;
      case "activity":
        return <DashboardWorkspacePage mode="activity" />;
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  if (key.startsWith("students/")) {
    const slug = path[1];
    switch (slug) {
      case "list":
        return <StudentsListPage />;
      case "documents":
        return <StudentsDocumentsPage />;
      case "promote-transfer":
        return <StudentsWorkspacePage mode="promote-transfer" />;
      case "siblings":
        return <StudentsWorkspacePage mode="siblings" />;
      case "profile":
        return (
          <StudentsProfilePage
            studentId={firstString(searchParams.id)}
          />
        );
      case "archived":
        return <StudentsArchivedPage />;
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  if (key.startsWith("admissions/")) {
    const slug = path[1];
    switch (slug) {
      case "enquiry":
      case "enquiry-entry":
        return <AdmissionsEnquiryEntryPage />;
      case "enquiry-list":
        return (
          <AdmissionsEnquiryListPage
            highlightEnquiryId={firstString(searchParams.enquiryId)}
          />
        );
      case "follow-up":
        return (
          <AdmissionsFollowUpPage
            preselectedEnquiryId={firstString(searchParams.enquiryId)}
          />
        );
      case "registration":
        return <AdmissionsRegistrationPage />;
      case "admission-form":
        return (
          <AdmissionsAdmissionFormPage
            admissionId={firstString(searchParams.admissionId)}
          />
        );
      case "documents":
      case "pending-documents":
        return <AdmissionsPendingDocumentsPage />;
      case "admission-fee":
        return <AdmissionsAdmissionFeePage />;
      case "final-admission":
        return <AdmissionsFinalAdmissionPage />;
      case "approved":
        return <AdmissionsApprovedPage />;
      case "rejected":
        return <AdmissionsRejectedPage />;
      case "waitlist":
        return <AdmissionsWaitlistPage />;
      case "online-leads":
        return <AdmissionsOnlineLeadsPage />;
      case "survey":
        return (
          <AdmissionsSurveyPage surveyId={firstString(searchParams.surveyId)} />
        );
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  if (key.startsWith("accounts/")) {
    const slug = path[1];
    switch (slug) {
      case "expenses":
        return (
          <AccountsExpensesPage month={firstString(searchParams.month)} />
        );
      case "staff-advance":
        return <AccountsStaffAdvancePage />;
      case "fuel":
        return <AccountsFuelPage />;
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  if (key.startsWith("attendance/")) {
    const slug = path[1];
    switch (slug) {
      case "students":
        return (
          <AttendanceStudentsPage
            sectionId={firstString(searchParams.sectionId)}
            dateStr={firstString(searchParams.date)}
          />
        );
      case "monthly":
        return <AttendanceMonthlyPage month={firstString(searchParams.month)} />;
      case "alerts":
        return <AttendanceAlertsPage />;
      case "staff":
      case "leave":
        return <ModulePlaceholder title={titleForPath(href)} />;
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  if (key.startsWith("fees/")) {
    const slug = path[1];
    switch (slug) {
      case "structure":
        return <FeesStructurePage />;
      case "assignment":
        return <FeesAssignmentPage />;
      case "collect":
        return <FeesCollectPage />;
      case "receipts":
        return <FeesReceiptsPage />;
      case "refunds":
        return <FeesRefundsPage />;
      case "ledger":
        return <FeesLedgerPage studentId={firstString(searchParams.studentId)} />;
      case "defaulters":
        return <FeesDefaultersPage />;
      case "daily-collection":
        return <FeesDailyCollectionPage />;
      case "monthly-collection":
        return (
          <FeesMonthlyCollectionPage month={firstString(searchParams.month)} />
        );
      case "head-wise":
        return <FeesHeadWisePage />;
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  if (key.startsWith("exams/")) {
    const slug = path[1];
    switch (slug) {
      case "setup":
        return <ExamsSetupPage />;
      case "marks-entry":
        return (
          <ExamsMarksEntryPage
            examId={firstString(searchParams.examId)}
            sectionId={firstString(searchParams.sectionId)}
          />
        );
      case "results":
        return (
          <ExamsResultsPage examId={firstString(searchParams.examId)} />
        );
      case "weak-students":
        return (
          <ExamsWeakStudentsPage examId={firstString(searchParams.examId)} />
        );
      case "grade-rules":
        return <ExamsGradeRulesPage />;
      case "report-card":
        return (
          <ExamsReportCardPage
            examId={firstString(searchParams.examId)}
            studentId={firstString(searchParams.studentId)}
          />
        );
      case "analysis":
        return <ExamsAnalysisPage />;
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  if (key.startsWith("academics/")) {
    const slug = path[1];
    switch (slug) {
      case "daily-class-taken":
        return (
          <AcademicsClassDiaryPage
            sectionId={firstString(searchParams.sectionId)}
            dateStr={firstString(searchParams.date)}
          />
        );
      case "homework":
        return (
          <AcademicsHomeworkPage
            sectionId={firstString(searchParams.sectionId)}
            fromStr={firstString(searchParams.from)}
            toStr={firstString(searchParams.to)}
          />
        );
      case "class-diary":
        return (
          <AcademicsClassDiaryPage
            sectionId={firstString(searchParams.sectionId)}
            dateStr={firstString(searchParams.date)}
          />
        );
      case "smart-content":
        return <AcademicsSmartContentPage />;
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  if (key.startsWith("transport/")) {
    const slug = path[1];
    switch (slug) {
      case "stops":
        return <TransportStopsPage />;
      case "routes":
        return (
          <TransportRoutesPage routeId={firstString(searchParams.routeId)} />
        );
      case "mapping":
        return (
          <TransportMappingPage sectionId={firstString(searchParams.sectionId)} />
        );
      case "fees":
        return <TransportFeesPage />;
      case "vehicles":
        return (
          <TransportVehiclesPage
            vehicleId={firstString(searchParams.vehicleId)}
          />
        );
      case "compliance":
        return <TransportCompliancePage />;
      case "fuel-log":
      case "fuel":
        return <TransportFuelLogPage />;
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  if (key.startsWith("timetable/")) {
    const slug = path[1];
    switch (slug) {
      case "class":
        return <TimetableWorkspacePage mode="class" />;
      case "teacher":
        return <TimetableWorkspacePage mode="teacher" />;
      case "auto-generate":
        return <TimetableWorkspacePage mode="auto-generate" />;
      case "conflicts":
        return <TimetableWorkspacePage mode="conflicts" />;
      case "substitutes":
        return <TimetableWorkspacePage mode="substitutes" />;
      case "rooms":
        return <TimetableWorkspacePage mode="rooms" />;
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  if (key.startsWith("ai/")) {
    const slug = path[1];
    switch (slug) {
      case "teacher":
        return <AiTeacherPage />;
      case "student":
        return <AiStudentPage />;
      case "parent":
        return <AiParentPage />;
      case "automation":
        return <AiAutomationPage />;
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  if (key.startsWith("inventory/")) {
    const slug = path[1];
    switch (slug) {
      case "items":
        return <InventoryItemsPage />;
      case "stock":
        return <InventoryStockPage />;
      case "alerts":
        return <InventoryAlertsPage />;
      case "issues":
        return <InventoryIssuesPage />;
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  if (key.startsWith("certificates/")) {
    const slug = path[1];
    switch (slug) {
      case "bonafide":
        return <CertificatesWorkspacePage mode="bonafide" />;
      case "fee":
        return <CertificatesWorkspacePage mode="fee" />;
      case "character":
        return <CertificatesWorkspacePage mode="character" />;
      case "id-card":
        return <CertificatesWorkspacePage mode="id-card" />;
      case "no-dues":
        return <CertificatesWorkspacePage mode="no-dues" />;
      case "tc-requests":
        return <CertificatesWorkspacePage mode="tc-requests" />;
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  if (key.startsWith("hr/")) {
    const slug = path[1];
    switch (slug) {
      case "directory":
        return <HrStaffDirectoryPage />;
      case "payroll":
        return <HrPayrollPage />;
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  if (key.startsWith("portal/")) {
    if (key === "portal/parent") {
      return <PortalParentHomePage />;
    }
    if (key === "portal/parent/fees") {
      return (
        <PortalParentFeesPage studentId={firstString(searchParams.studentId)} />
      );
    }
    if (key === "portal/parent/attendance") {
      return (
        <PortalParentAttendancePage
          studentId={firstString(searchParams.studentId)}
        />
      );
    }
    if (key === "portal/parent/homework") {
      return (
        <PortalParentHomeworkPage studentId={firstString(searchParams.studentId)} />
      );
    }
    if (key === "portal/student") {
      return <PortalStudentHomePage />;
    }
    if (key === "portal/student/fees") {
      return (
        <PortalParentFeesPage
          studentId={firstString(searchParams.studentId)}
          basePath="/portal/student"
        />
      );
    }
    if (key === "portal/student/attendance") {
      return (
        <PortalParentAttendancePage
          studentId={firstString(searchParams.studentId)}
          basePath="/portal/student"
        />
      );
    }
    if (key === "portal/student/homework") {
      return (
        <PortalParentHomeworkPage
          studentId={firstString(searchParams.studentId)}
          basePath="/portal/student"
        />
      );
    }
    if (key === "portal/student/timetable") {
      return (
        <PortalStudentTimetablePage
          studentId={firstString(searchParams.studentId)}
        />
      );
    }
    return <ModulePlaceholder title={titleForPath(href)} />;
  }

  if (key.startsWith("communication/")) {
    const slug = path[1];
    switch (slug) {
      case "whatsapp":
        return <CommunicationWorkspacePage mode="whatsapp" />;
      case "sms":
        return <CommunicationWorkspacePage mode="sms" />;
      case "email":
        return <CommunicationWorkspacePage mode="email" />;
      case "broadcast":
        return <CommunicationWorkspacePage mode="broadcast" />;
      case "ptm":
        return <CommunicationWorkspacePage mode="ptm" />;
      case "templates":
        return <CommunicationWorkspacePage mode="templates" />;
      case "logs":
        return <CommunicationWorkspacePage mode="logs" />;
      case "notices":
        return <CommunicationNoticesPage />;
      case "complaints":
        return <CommunicationComplaintsPage />;
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  if (key.startsWith("front-office/")) {
    const slug = path[1];
    switch (slug) {
      case "visitors":
        return <FrontOfficeWorkspacePage mode="visitors" />;
      case "calls":
        return <FrontOfficeWorkspacePage mode="calls" />;
      case "enquiries":
        return <FrontOfficeWorkspacePage mode="enquiries" />;
      case "appointments":
        return <FrontOfficeWorkspacePage mode="appointments" />;
      case "complaints":
        return <FrontOfficeWorkspacePage mode="complaints" />;
      case "documents":
        return <FrontOfficeWorkspacePage mode="documents" />;
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  if (key.startsWith("settings/")) {
    const slug = path[1];
    switch (slug) {
      case "audit-logs":
        return <SettingsAuditLogsPage />;
      case "users":
        return <SettingsUsersPage />;
      case "roles":
        return <SettingsWorkspacePage mode="roles" />;
      case "permissions":
        return <SettingsWorkspacePage mode="permissions" />;
      case "system":
        return <SettingsWorkspacePage mode="system" />;
      case "integrations":
        return <SettingsWorkspacePage mode="integrations" />;
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  if (key.startsWith("reports/")) {
    const slug = path[1];
    switch (slug) {
      case "admissions":
        return <ReportsMisPage focus="admissions" />;
      case "students":
        return <ReportsMisPage focus="students" />;
      case "fees":
        return <ReportsMisPage focus="fees" />;
      case "attendance":
        return <ReportsMisPage focus="attendance" />;
      case "exams":
        return <ReportsMisPage focus="exams" />;
      case "audit":
        return <SettingsAuditLogsPage />;
      case "ai-mis":
        return <ReportsMisPage focus="ai-mis" />;
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  if (key.startsWith("master/")) {
    const slug = path[1];
    switch (slug) {
      case "school-profile":
        return <SchoolProfilePage />;
      case "sessions":
        return <SessionsPage />;
      case "classes":
        return <ClassesPage />;
      case "sections":
        return <SectionsPage />;
      case "subjects":
        return <SubjectsPage />;
      case "fee-heads":
        return <FeeHeadsPage />;
      case "document-types":
        return <MasterDocumentTypesPage />;
      case "transport":
        return <MasterTransportHubPage />;
      default:
        return <ModulePlaceholder title={titleForPath(href)} />;
    }
  }

  return <ModulePlaceholder title={titleForPath(href)} />;
}
