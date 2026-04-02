import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Bus,
  Calendar,
  ClipboardList,
  FileBadge,
  FileText,
  Globe,
  GraduationCap,
  Home,
  IndianRupee,
  LayoutDashboard,
  Library,
  MapPin,
  MessageSquare,
  Phone,
  School,
  Settings,
  Shield,
  Sparkles,
  UserCircle,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

/**
 * Main menus — aligned with the synced BHB Ultimate Master Blueprint.
 * Keep high-value operational flows visible first while preserving access to
 * already-built detail screens.
 */
export const navSections: NavSection[] = [
  {
    title: "Dashboard",
    items: [
      { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { title: "AI Summary", href: "/dashboard/ai-summary", icon: BarChart3 },
      { title: "Alerts & Tasks", href: "/dashboard/alerts", icon: Bell },
      { title: "Recent Activity", href: "/dashboard/activity", icon: ClipboardList },
    ],
  },
  {
    title: "Admissions",
    items: [
      { title: "Enquiry", href: "/admissions/enquiry-entry", icon: ClipboardList },
      { title: "Follow-Up", href: "/admissions/follow-up", icon: Bell },
      { title: "Registration", href: "/admissions/registration", icon: FileText },
      { title: "Documents", href: "/admissions/documents", icon: FileBadge },
      { title: "Admission Fee", href: "/admissions/admission-fee", icon: IndianRupee },
      { title: "Final Admission", href: "/admissions/final-admission", icon: Award },
      { title: "Survey", href: "/admissions/survey", icon: MapPin },
      { title: "Online Leads", href: "/admissions/online-leads", icon: Globe },
      { title: "Enquiry List", href: "/admissions/enquiry-list", icon: Users },
      { title: "Admission Form", href: "/admissions/admission-form", icon: FileText },
      { title: "Pending Documents", href: "/admissions/pending-documents", icon: FileBadge },
      { title: "Approved Admissions", href: "/admissions/approved", icon: Award },
      { title: "Rejected / Cancelled", href: "/admissions/rejected", icon: FileText },
      { title: "Waitlist", href: "/admissions/waitlist", icon: Users },
    ],
  },
  {
    title: "Students",
    items: [
      { title: "Student List", href: "/students/list", icon: Users },
      { title: "Student Profile", href: "/students/profile", icon: UserCircle },
      { title: "Promote / Transfer", href: "/students/promote-transfer", icon: GraduationCap },
      { title: "Archived / Inactive", href: "/students/archived", icon: FileText },
      { title: "Documents Repository", href: "/students/documents", icon: Library },
      { title: "Sibling Mapping", href: "/students/siblings", icon: Users },
    ],
  },
  {
    title: "Academics",
    items: [
      { title: "Classes", href: "/master/classes", icon: GraduationCap },
      { title: "Daily Class Taken", href: "/academics/daily-class-taken", icon: ClipboardList },
      { title: "Homework", href: "/academics/homework", icon: BookOpen },
      { title: "Smart Content", href: "/academics/smart-content", icon: Sparkles },
      { title: "Class Diary", href: "/academics/class-diary", icon: BookOpen },
      { title: "Subject Allocation", href: "/academics/subject-allocation", icon: BookOpen },
      { title: "Teacher Allocation", href: "/academics/teacher-allocation", icon: Users },
      { title: "Lesson Plans", href: "/academics/lesson-plans", icon: FileText },
      { title: "Syllabus Tracking", href: "/academics/syllabus", icon: ClipboardList },
      { title: "Notebook Check", href: "/academics/notebook-check", icon: FileText },
    ],
  },
  {
    title: "Attendance",
    items: [
      { title: "Student Attendance", href: "/attendance/students", icon: ClipboardList },
      { title: "Staff Attendance", href: "/attendance/staff", icon: Users },
      { title: "Leave Entries", href: "/attendance/leave", icon: Calendar },
      { title: "Monthly Reports", href: "/attendance/monthly", icon: BarChart3 },
      { title: "Low Attendance Alerts", href: "/attendance/alerts", icon: Bell },
    ],
  },
  {
    title: "Exams & Results",
    items: [
      { title: "Exam Setup", href: "/exams/setup", icon: FileText },
      { title: "Marks Entry", href: "/exams/marks-entry", icon: ClipboardList },
      { title: "Grade Rules", href: "/exams/grade-rules", icon: Award },
      { title: "Result Processing", href: "/exams/results", icon: BarChart3 },
      { title: "Report Card", href: "/exams/report-card", icon: FileText },
      { title: "Result Analysis", href: "/exams/analysis", icon: BarChart3 },
      { title: "Weak Students Report", href: "/exams/weak-students", icon: Users },
    ],
  },
  {
    title: "Fees & Accounts",
    items: [
      { title: "Fees", href: "/fees/collect", icon: IndianRupee },
      { title: "Fee Structure", href: "/fees/structure", icon: IndianRupee },
      { title: "Fee Assignment", href: "/fees/assignment", icon: ClipboardList },
      { title: "Receipts", href: "/fees/receipts", icon: FileText },
      { title: "Student Ledger", href: "/fees/ledger", icon: BookOpen },
      { title: "Defaulters", href: "/fees/defaulters", icon: Bell },
      { title: "Expenses", href: "/accounts/expenses", icon: Wallet },
      { title: "Staff Advance", href: "/accounts/staff-advance", icon: IndianRupee },
      { title: "Fuel", href: "/accounts/fuel", icon: Bus },
      { title: "Monthly Collection", href: "/fees/monthly-collection", icon: BarChart3 },
    ],
  },
  {
    title: "Timetable",
    items: [
      { title: "Class Timetable", href: "/timetable/class", icon: Calendar },
      { title: "Teacher Timetable", href: "/timetable/teacher", icon: Users },
      { title: "Auto Generation", href: "/timetable/auto-generate", icon: Sparkles },
      { title: "Conflict Detection", href: "/timetable/conflicts", icon: Bell },
      { title: "Substitute Management", href: "/timetable/substitutes", icon: Users },
      { title: "Room / Period Allocation", href: "/timetable/rooms", icon: School },
    ],
  },
  {
    title: "Transport",
    items: [
      { title: "Vehicles", href: "/transport/vehicles", icon: Bus },
      { title: "Fuel", href: "/transport/fuel", icon: Bus },
      { title: "Compliance", href: "/transport/compliance", icon: FileBadge },
      { title: "Routes", href: "/transport/routes", icon: Bus },
      { title: "Stops", href: "/transport/stops", icon: MapPin },
      { title: "Student Route Mapping", href: "/transport/mapping", icon: Users },
      { title: "Transport Fees", href: "/transport/fees", icon: IndianRupee },
    ],
  },
  {
    title: "Communication",
    items: [
      { title: "WhatsApp", href: "/communication/whatsapp", icon: MessageSquare },
      { title: "SMS", href: "/communication/sms", icon: MessageSquare },
      { title: "Email", href: "/communication/email", icon: MessageSquare },
      { title: "Notice Board", href: "/communication/notices", icon: Bell },
      { title: "Broadcast Messages", href: "/communication/broadcast", icon: MessageSquare },
      { title: "PTM Reminders", href: "/communication/ptm", icon: Calendar },
      { title: "Templates", href: "/communication/templates", icon: FileText },
      { title: "Complaint Tracking", href: "/communication/complaints", icon: ClipboardList },
      { title: "Communication Logs", href: "/communication/logs", icon: FileText },
    ],
  },
  {
    title: "AI System",
    items: [
      { title: "Teacher AI", href: "/ai/teacher", icon: Sparkles },
      { title: "Student AI", href: "/ai/student", icon: Sparkles },
      { title: "Parent AI", href: "/ai/parent", icon: Sparkles },
      { title: "Automation Engine", href: "/ai/automation", icon: Sparkles },
    ],
  },
  {
    title: "Portals",
    items: [
      { title: "Parent Dashboard", href: "/portal/parent", icon: Home },
      { title: "Parent Attendance", href: "/portal/parent/attendance", icon: ClipboardList },
      { title: "Parent Fees", href: "/portal/parent/fees", icon: IndianRupee },
      { title: "Parent Homework", href: "/portal/parent/homework", icon: BookOpen },
      { title: "Student Dashboard", href: "/portal/student", icon: Home },
      { title: "Student Timetable", href: "/portal/student/timetable", icon: Calendar },
      { title: "Student Homework", href: "/portal/student/homework", icon: BookOpen },
      { title: "Student Attendance", href: "/portal/student/attendance", icon: ClipboardList },
    ],
  },
  {
    title: "HR & Payroll",
    items: [
      { title: "Staff Directory", href: "/hr/directory", icon: Users },
      { title: "Leave", href: "/hr/leave", icon: Calendar },
      { title: "Salary Setup", href: "/hr/salary", icon: IndianRupee },
      { title: "Payroll Run", href: "/hr/payroll", icon: Wallet },
      { title: "Salary Slips", href: "/hr/slips", icon: FileText },
    ],
  },
  {
    title: "Inventory",
    items: [
      { title: "Item Master", href: "/inventory/items", icon: Library },
      { title: "Stock In / Out", href: "/inventory/stock", icon: ClipboardList },
      { title: "Issue Register", href: "/inventory/issues", icon: FileText },
      { title: "Low Stock Alerts", href: "/inventory/alerts", icon: Bell },
      { title: "Asset Register", href: "/inventory/assets", icon: School },
    ],
  },
  {
    title: "Certificates",
    items: [
      { title: "Bonafide", href: "/certificates/bonafide", icon: FileBadge },
      { title: "Fee Certificate", href: "/certificates/fee", icon: IndianRupee },
      { title: "Character Certificate", href: "/certificates/character", icon: FileBadge },
      { title: "ID Card", href: "/certificates/id-card", icon: UserCircle },
      { title: "No Dues", href: "/certificates/no-dues", icon: FileBadge },
      { title: "TC Requests", href: "/certificates/tc-requests", icon: FileText },
    ],
  },
  {
    title: "Reports",
    items: [
      { title: "Admission Reports", href: "/reports/admissions", icon: BarChart3 },
      { title: "Student Reports", href: "/reports/students", icon: Users },
      { title: "Fee Reports", href: "/reports/fees", icon: IndianRupee },
      { title: "Attendance Reports", href: "/reports/attendance", icon: ClipboardList },
      { title: "Exam Reports", href: "/reports/exams", icon: Award },
      { title: "Audit Reports", href: "/reports/audit", icon: Shield },
      { title: "AI MIS Summary", href: "/reports/ai-mis", icon: BarChart3 },
    ],
  },
  {
    title: "Master Setup",
    items: [
      { title: "School Profile", href: "/master/school-profile", icon: School },
      { title: "Academic Sessions", href: "/master/sessions", icon: Calendar },
      { title: "Classes", href: "/master/classes", icon: GraduationCap },
      { title: "Sections", href: "/master/sections", icon: Users },
      { title: "Subjects", href: "/master/subjects", icon: BookOpen },
      { title: "Fee Heads", href: "/master/fee-heads", icon: IndianRupee },
      { title: "Exam Types", href: "/master/exam-types", icon: FileText },
      { title: "Holidays", href: "/master/holidays", icon: Calendar },
      { title: "Student Categories", href: "/master/student-categories", icon: Users },
      { title: "Document Types", href: "/master/document-types", icon: FileBadge },
      { title: "Notification Templates", href: "/master/notification-templates", icon: MessageSquare },
      { title: "Transport Masters", href: "/master/transport", icon: Bus },
      { title: "Staff Designations", href: "/master/staff-designations", icon: UserCog },
    ],
  },
  {
    title: "Front Office",
    items: [
      { title: "Visitor Register", href: "/front-office/visitors", icon: Users },
      { title: "Call Log", href: "/front-office/calls", icon: Phone },
      { title: "Enquiries", href: "/front-office/enquiries", icon: ClipboardList },
      { title: "Appointments", href: "/front-office/appointments", icon: Calendar },
      { title: "Complaints", href: "/front-office/complaints", icon: MessageSquare },
      { title: "Incoming / Outgoing Docs", href: "/front-office/documents", icon: FileText },
    ],
  },
  {
    title: "Settings",
    items: [
      { title: "Users", href: "/settings/users", icon: Users },
      { title: "Roles", href: "/settings/roles", icon: Shield },
      { title: "Permissions", href: "/settings/permissions", icon: Shield },
      { title: "Audit Logs", href: "/settings/audit-logs", icon: FileText },
      { title: "System Settings", href: "/settings/system", icon: Settings },
      { title: "Integrations", href: "/settings/integrations", icon: Settings },
    ],
  },
];
