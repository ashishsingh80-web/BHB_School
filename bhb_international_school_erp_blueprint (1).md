# BHB International School ERP Blueprint

> Final sync note: `bhb_international_school_erp_blueprint.md` now stores the concise "Ultimate Master Blueprint (Final)" summary. This detailed file remains the implementation guide and should stay consistent with that agreed scope.

## 0. Final Scope Sync
The agreed final scope for this project is:

- admission CRM with strict pipeline: enquiry -> follow-up -> registration -> document verification -> admission fee -> final admission
- survey-led field admissions with GPS capture, validation, duplicate checks, and auto enquiry creation
- online lead capture with webhooks, UTM attribution, and campaign tracking
- student management with parent linkage and document storage
- fee management with reminders, receipts, ledger, and defaulter workflows
- academics with Daily Class Taken and Smart Content
- student and staff attendance with automated alerts
- exams and results for both early-years and CBSE-style formats
- timetable generation with conflict detection
- communication across WhatsApp, SMS, and email
- AI tooling for teachers, students, and parents
- finance covering expenses and staff advance recovery
- transport covering vehicles, fuel, mileage, and compliance
- inventory, certificates, automation engine, and reporting

### Final Menu Intent
The top-level operating menu should continue converging toward:
- Admissions
- Students
- Academics
- Attendance
- Exams & Results
- Fees / Accounts
- Transport
- Communication
- Portals
- HR & Payroll
- Inventory
- Certificates
- Reports
- Master Setup
- Settings

### Final Database Direction
The database should continue evolving around these domain clusters:
- admissions and CRM
- surveys and online leads
- students and parents
- academics and class logs
- smart content usage
- fees and finance
- transport, fuel, and compliance
- communications and automation logs
- users, roles, permissions, and audit trails

## School Context
- School Name: **BHB International School**
- Board: **CBSE**
- Classes: **Nursery to Class X**
- Running Since: **2023**
- Goal: Build a **complete full ERP** using **Cursor** with a modern, modular, role-based structure and practical AI automations.

---

# 1. Project Objective
Build a school-first ERP that manages the full journey:

**Enquiry → Admission → Student Record → Class/Section Allocation → Fees → Attendance → Academics → Exams → Parent Communication → Certificates/TC → Archived Students**

The ERP should become the central operating system for:
- Management
- Principal
- Office Admin
- Accounts
- Teachers
- Reception
- Parents
- Students

---

# 2. Core Product Principles
1. **Role-based access** from day one.
2. **Session-wise architecture** so each academic year is tracked cleanly.
3. **Student lifecycle-based design** instead of disconnected modules.
4. **Automation-first** for repetitive office work.
5. **AI only where it saves time** and improves decisions.
6. **Strong reporting and audit logs** for control and accountability.
7. **Mobile-friendly parent and teacher panels**.

---

# 3. Suggested Technology Stack for Cursor Build
## Frontend
- Next.js
- Tailwind CSS
- shadcn/ui

## Backend
- Next.js API routes or Node.js backend
- Prisma ORM

## Database
- PostgreSQL

## Authentication
- Clerk or NextAuth

## File Storage
- Cloudinary / AWS S3 / Supabase Storage

## Messaging
- WhatsApp API
- SMS gateway
- Email service

## Reports
- PDF generation
- Excel export

## AI Layer
- OpenAI API for smart search, summaries, message drafting, remarks, OCR workflows

---

# 4. Role Structure
## Primary Roles
- Super Admin
- Management
- Principal
- Office Admin
- Admission Desk
- Accounts
- Teacher
- Class Teacher
- Reception
- Transport Manager
- HR/Admin
- Parent
- Student

## Permission Approach
Every role should have:
- view permissions
- create permissions
- edit permissions
- delete permissions
- approve permissions
- export permissions

Also include:
- audit trail
- change logs
- time stamps
- user action tracking

---

# 5. Final Module Hierarchy

## 5.0 Refined Module Architecture (Implementation-Aligned)
To keep this blueprint practical for build execution, treat the ERP as a set of module groups instead of a long flat list. This structure aligns with the current application route groups and makes ownership, sequencing, and dependencies clearer.

### Group A. Foundation & Governance
These modules define identity, permissions, sessions, and operating context for every other workflow.

| Module | Primary scope | Depends on | Current build status |
| --- | --- | --- | --- |
| Dashboard | Role-wise overview, alerts, AI summary, operational KPIs | all transactional modules | partial |
| Master Setup | school profile, sessions, classes, sections, subjects, fee heads, document types, notification templates, transport masters | none | partial |
| Settings & Access Control | users, roles, permissions, audit logs, integrations, system settings | auth and role model | partial |
| Reports & Audit | reporting shell, audit views, executive summaries | all transactional modules | partial |

### Group B. Student Lifecycle Core
These modules should remain tightly integrated because they form the main ERP spine from enquiry to active student operations.

| Module | Primary scope | Depends on | Current build status |
| --- | --- | --- | --- |
| Admissions | enquiry, follow-up, registration, admission form, approvals, pending documents, waitlist, online leads, field survey | master setup | strong |
| Students (SIS) | student list, profile, archives, documents, sibling mapping, promotion/transfer history | admissions, master setup | partial |
| Fees | fee structure, assignment, collection, receipts, refunds, ledger, defaulters, collection analytics | students, master setup | strong |
| Attendance | daily student attendance, staff attendance, leave, monthly reports, alerts | students, sessions, sections | partial |

### Group C. Academic Operations
These modules should be designed as one teaching-operations layer rather than isolated screens.

| Module | Primary scope | Depends on | Current build status |
| --- | --- | --- | --- |
| Academics | teacher allocation, subject allocation, class diary, homework/classwork, syllabus, notebook check, smart content | master setup, students, timetable | partial |
| Daily Class Taken | actual period execution, topic taught, homework issued, missed classes, substitute visibility | academics, timetable, staff mapping | planned |
| Timetable | class timetable, teacher timetable, substitute management, room/period allocation, timetable versions | master setup, HR/staff data | partial |
| Exams & Results | exam setup, marks entry, grade rules, results, report cards, result analysis, weak students | students, academics, attendance | strong |

### Group D. Communication & Experience
This group owns communication flows and family-facing experiences; it should consume data from lifecycle and academic modules rather than duplicate it.

| Module | Primary scope | Depends on | Current build status |
| --- | --- | --- | --- |
| Communication | notices, complaints, SMS, WhatsApp, email, PTM reminders, communication logs, templates | admissions, fees, attendance, exams | partial |
| Parent Portal | attendance, fees, homework, notices, transport-facing views, complaints | students, fees, attendance, academics | partial |
| Student Portal | student dashboard, timetable, homework, notices, self-service views | students, academics, timetable | partial |
| Certificates & Documents | bonafide, fee certificate, ID card, no-dues, TC workflow | students, fees, settings | planned |
| Front Office | visitor register, calls, appointments, enquiries, incoming/outgoing documents | admissions, communication | planned |

### Group E. Operations, Finance & Administration
These modules support back-office execution and should share masters, audit trails, and reporting patterns.

| Module | Primary scope | Depends on | Current build status |
| --- | --- | --- | --- |
| Accounts & Expenses | expenses, staff advance, fuel purchases/issues, profitability support data | master setup, HR, transport | partial |
| HR & Payroll | staff directory, attendance linkage, leave, salary setup, payroll, statutory settings | master setup, settings | partial |
| Transport | routes, stops, vehicles, student mapping, compliance, transport fees, fuel log | students, master setup, fees | partial |
| Inventory & Assets | item master, stock movement, issue register, low-stock alerts, asset register | master setup, accounts | partial |

### Group F. Intelligence & Differentiators
These modules create leverage across the ERP and should be built as reusable services, not siloed pages.

| Module | Primary scope | Depends on | Current build status |
| --- | --- | --- | --- |
| WhatsApp Automation Layer | triggers, templates, delivery logs, failed queue, acknowledgements, analytics | communication plus source modules | partial |
| AI Tutor | teacher tools, student practice, parent support, usage logs | academics, exams, portals | planned |
| AI Ops Layer | summaries, drafting, anomaly detection, search, recommendations | all high-signal modules | partial |

### Canonical Route Groups
Use the following groups as the source of truth for module boundaries:

- `/dashboard`
- `/master/*`
- `/admissions/*`
- `/students/*`
- `/fees/*`
- `/accounts/*`
- `/attendance/*`
- `/academics/*`
- `/timetable/*`
- `/exams/*`
- `/communication/*`
- `/portal/*`
- `/hr/*`
- `/transport/*`
- `/inventory/*`
- `/front-office/*`
- `/certificates/*`
- `/reports/*`
- `/settings/*`

### Build Rule for Module Refinement
When adding new features, prefer extending an existing module before creating a brand-new top-level menu. New modules are only justified when they introduce a distinct owner, workflow, data model, and reporting surface.

## 5.0A WhatsApp Automation & Teacher Daily Class Operations as Cross-System Priorities
These two areas should not be treated as small add-ons. They should be built as **core cross-functional layers** inside the ERP.

### A. WhatsApp Automation Layer
WhatsApp should connect with:
- admissions
- fees
- attendance
- homework
- exams/results
- notices
- transport
- complaints/helpdesk
- parent acknowledgements
- internal staff alerts

### B. Daily Class Taken by Teachers Layer
This should connect with:
- timetable
- teacher login
- class diary
- homework/classwork
- syllabus progress
- substitute management
- principal dashboard
- academic audit reports

The ERP should answer these operational questions every day:
- Which classes were actually taken today?
- Which periods were missed?
- Which teacher was absent?
- What topic was taught?
- What homework was assigned?
- Were parents informed where required?
- What urgent items need WhatsApp follow-up?

---

# 5A. WhatsApp Automation Strategy

## 5A.1 WhatsApp Use Philosophy
WhatsApp should be used in a controlled, template-driven, role-based way.

### Main Purposes
- parent communication
- fee reminders
- attendance alerts
- homework notifications
- exam/result updates
- circulars and notices
- admission follow-up
- complaint acknowledgement
- event reminders
- transport alerts
- teacher/staff reminders internally when needed

### Important Rule
Do not build WhatsApp as only a manual broadcast tool. Build it as a **workflow engine** with:
- trigger-based automation
- message templates
- approval flows for sensitive messages
- delivery log
- failure/retry tracking
- parent response capture where possible

---

## 5A.2 WhatsApp Module Structure
### Include
- WhatsApp template master
- broadcast campaigns
- event-triggered automations
- class-wise/section-wise audience selection
- individual student/parent messaging log
- delivery status tracking
- failed message queue
- parent acknowledgement tracking
- two-way response log if API/provider supports it
- opt-in/consent tracking if needed
- escalation dashboard

### Submenus
- Template Library
- Broadcast Center
- Automated Campaigns
- Delivery Logs
- Failed Messages
- Parent Responses
- Scheduled Messages
- Consent/Opt-in Registry
- Message Analytics

---

## 5A.3 WhatsApp Template Categories
### Admissions
- enquiry acknowledgement
- follow-up reminder
- admission form pending
- document pending
- admission approved
- welcome message

### Fees
- fee due reminder
- overdue fee reminder
- receipt confirmation
- partial payment acknowledgement
- monthly fee alert
- urgent defaulter reminder

### Attendance
- absent student alert
- low attendance warning
- repeated absence notice
- leave status update

### Academics
- homework sent
- classwork summary
- special instruction
- notebook/material reminder
- syllabus support message

### Exams
- exam schedule
- exam preparation reminder
- result published
- PTM invitation
- weak performance alert

### General Notices
- holiday notice
- event/cultural program notice
- emergency closure
- transport delay/change
- meeting reminder

### Complaints/Support
- complaint received
- issue assigned
- issue resolved
- follow-up needed

### Internal Staff Use
- teacher reminder for attendance entry
- marks entry pending
- principal alert on missed classes
- substitute class instruction

---

## 5A.4 WhatsApp Automation Triggers
### Admission Triggers
- new enquiry created
- no follow-up for X days
- admission pending documents
- admission approved/rejected

### Fee Triggers
- fee generated
- due date approaching
- due date crossed
- payment received
- repeated default after X days

### Attendance Triggers
- student marked absent today
- 3 consecutive absences
- attendance below threshold

### Academic Triggers
- homework posted
- class not taken today
- syllabus lag beyond threshold
- PTM scheduled

### Exam Triggers
- exam timetable published
- marks uploaded
- result published
- weak student flag raised

### Operational Triggers
- transport change
- holiday announcement
- emergency alert
- complaint raised/resolved

---

## 5A.5 WhatsApp Automation Levels
### Level 1: Fully Automatic
Use for safe routine messages:
- fee receipt confirmation
- absent student alert
- holiday notice
- admission acknowledgement

### Level 2: Automatic but Approval-Based
Use for messages requiring school control:
- strong fee defaulter reminders
- weak student alerts
- complaint resolution closure
- sensitive behaviour/discipline notice

### Level 3: Manual Assisted by AI
Use when message needs context:
- parent complaint responses
- special counselling messages
- exceptional academic guidance
- principal-level announcements

---

## 5A.6 AI Uses Inside WhatsApp Automation
### AI should help with:
- drafting message in formal/polite/strict tone
- Hindi-English translation
- shortening long circular into parent-friendly format
- creating class-specific versions of same message
- summarizing parent replies
- tagging parent replies by topic: fees, attendance, complaint, transport, homework
- creating follow-up suggestions for office staff

### Example AI Workflows
- Convert long notice into short WhatsApp message
- Draft separate fee reminder versions for normal due and overdue cases
- Summarize 50 parent replies into issue categories
- Suggest reply to parent complaint before human approval

---

## 5A.7 WhatsApp Dashboard Suggestions
### Office/Admin Dashboard Widgets
- messages sent today
- failed deliveries
- pending approvals
- unread parent replies
- top response categories
- campaigns scheduled

### Principal Dashboard Widgets
- urgent parent complaints
- high-risk fee reminders pending
- low attendance alerts sent
- classes with academic alerts sent

### Management Dashboard Widgets
- total messages this month
- delivery success rate
- top automation usage areas
- parent engagement rate

---

## 5A.8 WhatsApp Reports to Include
- date-wise message report
- template usage report
- delivery success/failure report
- class-wise communication report
- fee reminder effectiveness report
- complaint response report
- unread parent response report

---

# 5B. Daily Class Taken by Teachers Module

## 5B.1 Objective
This module should track not only the timetable but the **actual teaching activity executed every day**.

The school should know:
- which periods were scheduled
- which periods were taken
- who took them
- what was taught
- whether homework/classwork was assigned
- whether substitute covered the class
- which classes remain uncovered

---

## 5B.2 Core Functional Areas
### Include
- period-wise class taken entry
- teacher daily login sheet
- actual vs scheduled class tracker
- topic taught entry
- homework/classwork entry linked to class taken
- substitute teacher assignment
- missed class reasons
- practical/activity/special class tagging
- principal academic monitoring dashboard
- daily academic closure report

### Core Fields for Each Class Taken Record
- date
- session
- class
- section
- subject
- period number
- scheduled teacher
- actual teacher
- class status (taken / substituted / cancelled / free / exam / activity)
- topic taught
- chapter/unit reference
- homework assigned
- classwork summary
- remarks
- attendance linkage optional
- delay reason if not taken on time

---

## 5B.3 Teacher Daily Workflow
### Teacher Side Flow
1. Login
2. View today timetable
3. Open current period
4. Mark class status
5. Enter topic taught
6. Enter classwork/homework
7. Save
8. If unable to take class, select reason
9. If substitute taken, actual teacher recorded

### Principal/Admin Side Flow
1. See all scheduled classes for today
2. See taken vs pending vs missed
3. Identify absent teachers
4. Assign substitute if required
5. Review end-of-day academic completion

---

## 5B.4 Class Status Types
- Taken
- Partially Taken
- Substitute Taken
- Not Taken - Teacher Absent
- Not Taken - Holiday/Event
- Not Taken - Exam Use
- Not Taken - Combined Class
- Not Taken - Administrative Reason

These statuses are important for real reporting.

---

## 5B.5 Automation for Daily Class Taken Tracking
### Real-Time Automations
- remind teacher before period if no entry made
- alert principal if period remains unmarked after threshold
- notify substitute coordinator if teacher absent
- auto-create pending class list

### End-of-Day Automations
- teacher-wise class taken summary
- class-wise pending periods report
- missed class report to principal
- syllabus progress snapshot
- homework posting compliance report

### Weekly Automations
- teacher workload vs classes actually taken
- subject coverage summary
- repeated missed period analysis
- class-wise academic continuity report

---

## 5B.6 AI Use in Daily Class Taken Module
### AI can help with:
- summarizing daily class diary for principal
- detecting syllabus lag by subject
- identifying teachers/classes with repeated missed periods
- suggesting catch-up periods
- converting topic taught entries into weekly teaching summary
- drafting parent notice if class schedule disruption affected students

### AI Examples
- “Summarize today’s academic execution for principal.”
- “Which classes lost the most periods this week?”
- “Which subjects are behind syllabus plan?”
- “Create a weekly teaching summary for Class VI-A.”

---

## 5B.7 Daily Class Taken Dashboards
### Teacher Dashboard
- today timetable
- pending period entries
- completed periods
- missed entries
- homework pending to post

### Principal Dashboard
- total periods scheduled today
- taken periods
- missed periods
- substitute-covered periods
- teachers with missing entries
- class-wise execution heatmap

### Management Dashboard
- daily academic discipline score
- teacher compliance rate
- average class coverage rate
- subject-wise completion trend

---

## 5B.8 Reports to Include
- teacher daily class taken report
- class-wise daily coverage report
- subject-wise coverage report
- missed periods report
- substitute coverage report
- topic taught register
- homework compliance report
- weekly academic execution report

---

## 5B.9 Integration with Other Modules
This module should integrate with:
- timetable
- teacher allocation
- attendance
- homework/classwork
- syllabus tracking
- communication center
- principal dashboard
- exam planning

This prevents duplicate work and makes reporting meaningful.

---

## 5B.10 Suggested Menu Placement
### Add Under Academics
- Daily Class Taken
- Topic Taught Register
- Missed Class Tracker
- Substitute Classes
- Weekly Teaching Summary

### Add Under Reports
- Teacher Class Execution Report
- Class Coverage Report
- Subject Coverage Report
- Missed Period Analysis

---

# 5C. AI Tutor for Teachers and Students

## 5C.1 Objective
The AI Tutor should be built as a **role-based academic intelligence layer** inside the ERP for:
- teachers
- students
- parents in limited guided mode
- principal/academic coordinators in monitoring mode

It should not behave like a free uncontrolled chatbot. It should work within:
- class level
- subject level
- chapter level
- syllabus plan
- homework context
- exam pattern
- language preference

This makes it safe, useful, and aligned with school operations.

---

## 5C.2 AI Tutor for Teachers
### Main Purpose
Help teachers save preparation time and improve classroom delivery.

### Teacher AI Capabilities
- lesson plan generation
- chapter explanation support
- worksheet generation
- MCQ generation
- short answer and long answer question generation
- bloom-level question suggestions
- homework generation
- revision sheet creation
- class activity ideas
- viva/practical question suggestions where needed
- remedial teaching suggestions
- weak student support plan drafting
- bilingual teaching aid generation (English/Hindi where needed)
- teacher remark drafting
- parent communication support for academic issues

### Teacher AI Modes
#### 1. Lesson Planner Mode
Teacher selects:
- class
- subject
- chapter
- duration
- learning objective

AI outputs:
- lesson objective
- teaching flow
- examples
- board work points
- activities
- assessment questions
- homework suggestion

#### 2. Assessment Builder Mode
Teacher selects:
- class
- subject
- chapter
- difficulty level
- question type

AI outputs:
- MCQs
- very short questions
- short questions
- long questions
- HOTS/application questions
- answer key draft

#### 3. Remedial Support Mode
Teacher selects weak topic or weak students.

AI outputs:
- simplified explanation
- step-by-step teaching plan
- practice questions
- common mistakes list
- parent support note

#### 4. Class Summary Mode
AI converts teacher inputs from daily class taken module into:
- weekly teaching summary
- pending syllabus summary
- revision plan
- class performance observation

---

## 5C.3 AI Tutor for Students
### Main Purpose
Provide guided academic help based on the student’s class, subject, and syllabus.

### Student AI Capabilities
- explain chapter in simple language
- answer doubts step by step
- generate practice questions
- create revision notes
- quiz student on topic
- give hints instead of full answers when required
- summarize chapter
- explain difficult words
- provide exam preparation support
- suggest study plan before exams
- create weak-topic revision list
- bilingual explanations if needed

### Student AI Modes
#### 1. Learn Mode
Student chooses class, subject, chapter, topic.

AI provides:
- simplified explanation
- key points
- examples
- glossary
- quick recap

#### 2. Practice Mode
AI generates:
- quizzes
- MCQs
- fill in the blanks
- short questions
- chapter tests
- instant feedback

#### 3. Doubt Solver Mode
Student asks a question.

AI should:
- explain according to class level
- show steps where needed
- avoid overly advanced language
- optionally provide a hint-first approach

#### 4. Exam Prep Mode
AI provides:
- important questions
- topic priority list
- revision checklist
- probable mistake areas
- quick revision notes

#### 5. Homework Help Mode
AI helps but should avoid becoming a cheating tool.

Recommended behavior:
- first explain concept
- then give hints
- then provide guided solution
- avoid dumping final answer immediately for every question

---

## 5C.4 Parent-Facing Limited AI Academic Assistant
Parents may use a limited mode to:
- understand homework instructions
- understand exam preparation guidance
- know weak areas of child
- receive study support suggestions at home

This should be a controlled support tool, not a full independent student bot from parent side.

---

## 5C.5 AI Tutor Data Inputs and Integrations
The AI Tutor should connect with:
- class master
- subject master
- chapter/syllabus mapping
- daily class taken module
- homework/classwork
- exam pattern
- student performance data
- weak student reports
- timetable
- teacher lesson planning

This allows context-aware output rather than generic AI answers.

---

## 5C.6 AI Tutor Safety and Control Rules
### For Teachers
- allow generation and editing
- mark AI-generated content clearly in backend if needed
- require teacher review before final publishing to students

### For Students
- restrict content by class/subject
- age-appropriate language
- no unrestricted internet-style responses
- no unsafe/off-topic output
- filter for non-academic use where required
- log tutor interactions for academic analytics

### For School Control
- role-based access
- usage reports
- optional moderation for sensitive outputs
- content template guardrails aligned with school policy

---

## 5C.7 AI Tutor Dashboards
### Teacher Dashboard Widgets
- lesson plans generated this week
- worksheets generated
- remedial plans pending
- AI-supported remarks pending review

### Student Dashboard Widgets
- today’s revision suggestion
- weak topic practice
- last quiz score
- recommended chapter to revise

### Principal Dashboard Widgets
- AI tutor usage by class
- weak topic trends
- teacher preparation support usage
- student practice engagement summary

---

## 5C.8 AI Tutor Reports
- teacher AI usage report
- student AI learning engagement report
- chapter-wise doubt trend report
- weak topic frequency report
- quiz performance trend report
- remedial recommendation report

---

## 5C.9 Suggested Menu Placement
### Add Under Academics
- AI Lesson Planner
- AI Worksheet Generator
- AI Assessment Builder
- AI Remedial Planner

### Add Under Student Portal
- AI Tutor
- Learn Mode
- Practice Mode
- Doubt Solver
- Exam Prep
- Revision Notes

### Add Under Parent Portal
- Academic Support Assistant
- Homework Help Guide
- Weak Area Support

### Add Under Reports
- AI Tutor Usage Report
- Weak Topic Analysis
- Student Learning Engagement

---

## 5C.10 Recommended Phase Placement
### Early AI Version
Include in first AI rollout:
- AI Lesson Planner for teachers
- AI Worksheet Generator
- AI Teacher Remark Generator
- Student Learn Mode
- Student Practice Mode
- Student Doubt Solver (controlled)

### Later AI Expansion
- exam prep planner
- adaptive weak-topic revision recommendations
- parent academic support assistant
- chapter-wise performance prediction

---

## 5C.11 Recommendation for BHB International School
For your school, the AI Tutor should begin as a **curriculum-aligned academic assistant**, not as a general chatbot.

Best starting version:
- Teachers: lesson plans, worksheets, assessments, remedial plans, remarks
- Students: chapter explanation, practice, doubt solving, revision
- Parents: limited homework and weak-topic support

This will make AI directly useful for school operations and learning outcomes.

---

# 5D. Transport Module Expansion

## 5D.1 Objective
The transport module should manage the full movement workflow for students using school transport and provide visibility to admin, transport manager, class teacher, and parents.

## 5D.1A Distance-Based Transport Fee Intelligence
The transport module should support **exact distance-aware transport billing** so that fees can be calculated more fairly and transparently.

### Recommended Billing Models to Support
- fixed route fee
- stop-wise fee
- distance slab fee (for example 0–3 km, 3–5 km, 5–8 km)
- exact distance-based fee using configured per-km logic
- custom override fee for special cases

### Core Principles
- every stop should have a mapped distance from school
- each student should be linked to one pickup stop and optional drop stop
- transport fee should be calculated from the mapped stop distance unless manually overridden by authorized admin
- fee rules should remain configurable session-wise

### Distance Data Points to Store
- school latitude/longitude optional
- stop latitude/longitude optional
- route master distance
- stop distance from school in km
- pickup stop distance
- drop stop distance if different
- billable distance
- fee slab applied
- manual override reason if changed

### Recommended Practical School Setup
For most schools, the most reliable method is:
1. Define route
2. Define stop
3. Assign each stop a verified distance from school
4. Map student to stop
5. Auto-calculate fee from slab or rule

This is better than recalculating live map API distance every time.

---

## 5D.2 Core Features
- route master
- stop master
- vehicle master
- driver and conductor records
- vehicle documents and validity tracking
- student transport allocation
- transport fee integration
- route-wise student list
- pick-up/drop stop mapping
- emergency contact view
- transport change request workflow

## 5D.2A Distance and Fee Configuration Features
### Add these features inside Transport Setup
- school location master
- route-wise stop mapping
- stop distance entry and verification
- distance slab master
- per-km fee rule configuration
- minimum fee rule
- round trip vs one-way fee logic
- transport fee override approval workflow
- session-wise fee chart versioning

### Suggested Admin Screens
- Routes and Stops Master
- Stop Distance Mapping
- Distance Slab Master
- Transport Fee Rule Engine
- Student Stop Assignment
- Manual Fee Override Register

### Automations
- auto-calculate fee on student transport allocation
- recalculate fee if stop changes
- alert if stop distance missing but transport assigned
- maintain audit trail for distance edits and fee overrides

### Reports
- student transport distance report
- stop-wise distance list
- route-wise fee summary
- fee override report
- one-way vs two-way transport report

---

## 5D.3 Daily Transport Operations
- route attendance list
- route departure/arrival status
- student boarding/deboarding status if later implemented
- delayed route flagging
- route issue reporting
- absent transport students list

## 5D.3A Distance-Aware Billing Logic
### Example Logic Models
#### Model 1: Distance Slab
- 0 to 2 km = slab A
- above 2 to 5 km = slab B
- above 5 to 8 km = slab C
- above 8 km = slab D

#### Model 2: Exact Distance Rule
- base fee + per km multiplier
- optional minimum charge
- optional round-trip multiplier

#### Model 3: Stop Master Fee
- each stop has predefined billable fee
- stop distance stored for transparency and reporting

### Best Recommendation for Your School
Use **Stop Master + Distance Slab + Manual Override**.
That gives:
- easy admin control
- transparent parent communication
- reduced dispute risk
- flexible billing for exceptions

---

## 5D.4 Automations
- transport fee billing
- route change approval notifications
- vehicle document expiry reminders
- delay or disruption alerts to parents
- daily route summary to admin

## 5D.5 AI Use
- route optimization suggestions
- stop clustering analysis
- transport utilization report summary

## 5D.5A Parent App Distance Transparency
### Parent App Should Show
- assigned route
- assigned pickup stop
- stop distance from school
- transport fee applied
- whether fee is one-way or two-way
- request change of stop if permitted

This reduces confusion and helps justify transport fee calculation.

---

## 5D.6 Parent App Features
- current route/stop allocation
- transport fee status
- transport notices
- route change request

---

# 5E. Daily Regular Expenses Module

## 5E.1 Objective
This module should capture day-to-day school expenses beyond student fee and payroll systems so that management gets a real operational profitability view.

## 5E.2 Expense Categories
- stationery
- electricity
- water
- internet/phone
- fuel
- vehicle maintenance
- cleaning/sanitation
- printing/photocopy
- teaching materials
- petty cash
- repairs and maintenance
- event expenses
- hospitality
- miscellaneous admin expenses

## 5E.3 Core Features
- expense category master
- vendor/payee master
- daily expense entry
- bill/voucher upload
- payment mode tracking
- branch/school tagging
- approval workflow
- petty cash register
- monthly expense summary
- expense analytics

## 5E.4 Automations
- pending expense approval reminders
- monthly expense closure summary
- budget vs actual alerting if later configured
- recurring expense reminders

## 5E.5 Reports
- daily expense register
- category-wise expense report
- monthly expense summary
- vendor-wise expense report
- cash vs bank expense report
- petty cash balance report

## 5E.6 AI Use
- summarize unusual expense spikes
- monthly expense commentary for management
- recurring expense pattern insights

---

# 5F. PF and ESIC Compliance Layer (India)

## 5F.1 Objective
The HR/payroll module should be designed to support Indian statutory payroll compliance related to PF and ESIC where applicable.

## 5F.2 ERP Scope Recommendation
The ERP should support:
- employee statutory profile fields
- PF applicability flag
- ESIC applicability flag
- UAN field
- ESIC insurance number field
- wage component tagging
- employer and employee contribution calculation logic configuration
- monthly compliance register preparation support
- downloadable payroll compliance reports

## 5F.3 Important Design Note
PF and ESIC rules, thresholds, wage definitions, filing processes, and compliance requirements can change. The ERP should therefore be built with:
- configurable statutory settings
- effective date-based policy configuration
- payroll formula versioning
- override controls for authorized payroll users

Do not hardcode these rules permanently in the first version.

## 5F.4 Suggested Features
- employee statutory eligibility section
- salary structure mapping to statutory heads
- PF and ESIC deduction preview in payroll
- compliance report export
- employee-wise statutory register
- monthly payroll statutory summary
- joining/exits compliance tracking

## 5F.5 Automations
- missing UAN/ESIC data alerts
- payroll run statutory validation check
- monthly compliance checklist reminder
- new employee statutory onboarding checklist

## 5F.6 Reports
- PF eligible employees report
- ESIC eligible employees report
- monthly statutory deduction summary
- missing statutory data report

## 5F.7 Important Implementation Advice
Before finalizing PF/ESIC formulas in production, validate the exact rules and payroll treatment with your accountant/CA/payroll consultant and keep the settings editable in admin.

---

# 5G. Result System by School Stage

## 5G.1 Objective
The result module should support different formats for different age groups.

### Required Bands
- Nursery to UKG: child-friendly cartoon-style progress card
- Class 1 to Class 9: formal CBSE-style school report card pattern

## 5G.2 Nursery to UKG Result Format
### Philosophy
For early classes, report cards should be visually friendly, simple, growth-oriented, and easy for parents to understand.

### Include
- student photo
- colorful/cartoon-style design
- term/assessment period
- attendance summary
- developmental indicators
- habits and behavior indicators
- communication and language development
- number readiness
- creativity/art participation
- physical activity participation
- social interaction
- teacher observations
- parent note section
- stars/grades/icons instead of heavy marks system

### Suggested Evaluation Areas
- speaking and listening
- recognition skills
- pre-writing/writing readiness
- number concepts
- rhymes/story participation
- cleanliness and habits
- confidence and class participation
- art/craft engagement
- motor skills

### AI Use
- teacher observation drafting
- simple positive remarks generation
- parent-friendly developmental summary

## 5G.3 Class 1 to Class 9 Result Format
### Philosophy
Should be structured, formal, and aligned to school’s CBSE-style academic reporting system.

### Include
- scholastic subjects
- periodic test/term exam/internal marks structure as configured
- grades/marks
- attendance
- co-scholastic area
- discipline/behavior
- teacher remarks
- promotion status
- result summary

### Reports
- class result register
- topper list
- subject-wise analysis
- weak student report
- report card PDF

### AI Use
- teacher remarks generation
- subject weakness summary
- parent guidance notes after result

---

# 5H. Automatic Timetable Generation

## 5H.1 Objective
The timetable module should support automatic generation with manual override.

## 5H.2 Inputs Needed
- classes and sections
- subjects
- periods per day
- teacher allocations
- teacher availability
- room/resource constraints if needed
- subject frequency rules
- weekly distribution rules
- assembly/break/library/games periods

## 5H.3 Auto Timetable Features
- generate class timetable automatically
- generate teacher timetable automatically
- avoid teacher clashes
- avoid double booking
- respect subject frequency rules
- support manual edit after generation
- highlight conflicts
- save timetable versions

## 5H.4 Automations
- substitute recommendations when teacher absent
- conflict detection on change
- weekly load summary per teacher

## 5H.5 AI Use
- timetable balance suggestions
- teacher load optimization suggestions
- subject distribution quality check

---

# 5I. Teacher Homework/Classwork Upload Automation

## 5I.1 Objective
The ERP should ensure teachers regularly upload homework and classwork with minimal manual follow-up.

## 5I.2 Core Features
- period-linked classwork entry
- homework upload by date/class/section/subject
- attachment support if needed
- copy previous homework option
- teacher pending entry dashboard
- class teacher monitoring view

## 5I.3 Automations
- reminder to teacher after class if no classwork/homework entered
- end-of-day pending upload reminder
- principal/coordinator summary of missing uploads
- parent app sync when homework published
- weekly compliance report by teacher

## 5I.4 AI Use
- auto-draft homework from topic taught
- convert teacher topic entry into classwork summary
- generate differentiated homework suggestions
- translate homework into parent-friendly format

---

# 5J. Student Interest and Talent Tracking Module

## 5J.1 Objective
The ERP should capture the broader profile of each student beyond marks and fees.

## 5J.2 Trackable Interest Fields
- music
- dance
- sports
- art/craft
- public speaking
- drawing
- drama
- AI
- coding
- robotics
- science activity
- leadership
- social participation
- reading habit
- other custom interests

## 5J.3 Core Features
- student interest profile section
- multiple interest selection
- talent rating or observation notes
- club/activity participation mapping
- competition participation history
- achievement records
- teacher recommendation notes
- parent-declared interests vs school-observed interests

## 5J.4 Uses of This Module
- activity planning
- competition nominations
- personalized parent suggestions
- student development reports
- club/group creation
- talent recognition

## 5J.5 AI Use
- identify interest patterns by class
- suggest suitable enrichment activities
- generate student development insights
- recommend parent support ideas

---

# 5K. Parent App Suggestions Engine

## 5K.1 Objective
The parent app should not only show data but also provide guided suggestions for supporting the child.

## 5K.2 Suggestion Inputs
The system can use:
- attendance trends
- result performance
- weak subjects
- homework completion patterns
- class teacher remarks
- student interests/talents
- behavior/participation notes
- age/class level

## 5K.3 Types of Parent Suggestions
### Academic Suggestions
- revise multiplication tables this week
- focus on reading practice daily for 15 minutes
- encourage written answer practice in science
- improve handwriting with short daily exercise

### Behavior/Discipline Suggestions
- encourage punctuality
- build daily study routine
- improve class material preparedness

### Talent/Interest Suggestions
- consider music practice support
- encourage participation in drawing activity
- explore beginner coding activity at home
- support sports routine if child shows strong interest

### Exam Time Suggestions
- make revision timetable
- focus on weak topics first
- avoid last-minute rush

## 5K.4 Delivery Channels
- parent dashboard cards
- weekly suggestion digest
- result-day guidance note
- WhatsApp suggestions in controlled cases

## 5K.5 AI Use
- personalized guidance notes
- result-linked parent recommendations
- interest-based growth suggestions
- simple home support plan generation

## 5K.6 Safety and Tone Guidance
Parent suggestions should be:
- supportive, not judgmental
- simple and practical
- age-appropriate
- based on school data, not overclaiming psychology

---

# 5L. Expanded Automation Recommendation for BHB International School
For your school, WhatsApp automation and daily class taken tracking should be considered **top-tier operational modules**, not future extras.

## Priority Order Upgrade
### Must be included in early development:
1. Admission + Student Information System
2. Fees
3. Attendance
4. WhatsApp Communication Automation
5. Academics + Daily Class Taken Tracking
6. Reports + Principal Dashboard

This order is better than treating communication and academics as later-stage optional features.

---

# 5.1 Dashboard Module

## 5.1 Dashboard Module
### Purpose
Central summary view by role.

### Include
- school snapshot
- total active students
- class-wise strength
- admissions this month
- pending admissions
- fee collection today
- outstanding dues
- absent students today
- staff attendance summary
- pending approvals
- notices/events
- AI summary card

### AI Use
- executive summary for today
- risk alerts
- action recommendations

---

## 5.2 Master Setup Module
### Include
- school profile
- academic sessions
- classes
- sections
- houses
- subjects
- exam types
- grading rules
- fee heads
- concession categories
- student categories
- religion/category/gender master
- transport routes/stops
- employee designation master
- document types
- holiday calendar
- notification templates

### Why First
All modules depend on this setup.

---

## 5.3 Admission & Enquiry Module
### Include
- enquiry entry
- source tracking
- follow-up history
- registration form
- admission form
- document checklist
- admission review and approval
- class/section allotment
- student ID generation
- admission number generation
- pending documents tracking
- rejected/cancelled admissions
- waitlist

### Key Data
- student personal details
- father/mother/guardian details
- contact details
- address
- previous school details
- DOB
- category/religion/gender
- sibling reference
- transport requirement
- uploaded documents
- admission status

### Automation
- enquiry follow-up reminders
- pending document alerts
- admission confirmation messages
- student login creation
- parent login creation

### AI Use
- admission follow-up message drafts
- admission summary dashboard
- office assistant search queries
- voice-note-to-enquiry summary

---

## 5.4 Student Information System (SIS)
### Include
- complete student profile
- admission history
- academic mapping
- parent/guardian details
- sibling mapping
- document repository
- health/basic alerts
- communication log
- section change/class promotion history
- inactive/withdrawn/archive status

### Student Profile Tabs
- basic info
- parents/guardians
- academics
- fees
- attendance
- homework
- exams/results
- transport
- documents
- communication log
- remarks

### Automation
- missing data alerts
- duplicate record checks
- profile completeness score

### AI Use
- smart natural language student search
- summarized student profile view
- flagged cases summary

---

## 5.5 Fees Management Module
### Include
- fee structure setup
- class-wise fee plans
- fee assignment
- concessions/scholarship/internal discounts
- sibling discount rules
- late fee rules
- transport fee integration
- special charges
- receipts
- refunds/adjustments
- ledger
- daily collection
- online payment status
- due tracking

### Reports
- daily collection report
- monthly collection report
- head-wise report
- concession report
- outstanding dues report
- student ledger
- class-wise due report
- defaulter list

### Automation
- periodic fee generation
- fee due reminders
- late fine auto-calculation
- receipt auto-send
- escalation for old dues
- class teacher due summary

### AI Use
- fee reminder drafting
- dues risk analysis
- class-wise trend analysis
- management fee summary

---

## 5.6 Attendance Module
### Student Attendance
- daily attendance
- class-wise attendance entry
- late mark/half day
- leave entries
- monthly reports
- attendance lock

### Staff Attendance
- attendance entry or biometric integration ready structure
- leave tracking
- monthly attendance reports

### Automation
- absent student alert to parent
- 3-day continuous absence escalation
- low attendance warnings
- attendance close for day

### AI Use
- chronic absentee analysis
- at-risk student list before exams
- anomaly detection in attendance patterns

---

## 5.7 Academics Module
### Include
- subject allocation
- teacher allocation
- class teacher mapping
- lesson plans
- syllabus tracking
- homework/classwork
- class diary
- notebook check records
- teacher remarks

### Automation
- homework notification to parents
- pending syllabus alerts
- weekly teaching summary
- class teacher summary

### AI Use
- lesson plan drafting
- worksheet generation
- homework generation
- bilingual message drafting
- class summary notes

---

## 5.8 Timetable Module
### Include
- class timetable
- teacher timetable
- substitute allocation
- room/period allocation
- workload view

### Automation
- clash detection
- substitute suggestions
- overload alerts

### AI Use
- timetable balance suggestions
- scheduling optimization recommendations

---

## 5.9 Examination & Report Card Module
### Include
- exam setup
- term setup
- marks entry
- subject teacher entry flow
- grade logic
- report card generation
- remarks
- attendance integration
- promotion logic
- result analysis

### Reports
- class result summary
- topper list
- weak students report
- subject-wise performance
- teacher performance by subject
- term comparison

### Automation
- marks entry reminders
- result publish alerts
- weak student list generation
- report card PDFs

### AI Use
- teacher remarks generation
- student performance summary
- parent-friendly result explanation
- subject weakness analysis

---

## 5.10 Parent Communication Module
### Include
- notice board
- SMS/WhatsApp/email center
- class-wise broadcast
- template management
- circulars
- PTM communication
- complaint/issue tracking
- communication history

### Automation
- fee reminders
- absence alerts
- exam reminders
- holiday notices
- birthday greetings
- admission follow-up messages

### AI Use
- message drafting in formal/polite/urgent tone
- Hindi-English translation
- summarize parent issues

---

## 5.11 Parent Portal
### Include
- student profile
- attendance view
- fee ledger and receipts
- homework/classwork
- results/report card
- notices/circulars
- transport info
- complaint/request form

### AI Use
- FAQ assistant
- translated notice summaries

---

## 5.12 Student Portal
### Include
- profile
- homework
- attendance
- report card
- circulars
- timetable

---

## 5.13 HR & Payroll Module
### Include
- staff records
- joining details
- documents
- designation mapping
- salary setup
- attendance linkage
- leave tracking
- payroll generation
- salary slips
- increments/history

### Automation
- monthly payroll run
- leave balance update
- birthday/work anniversary alerts
- document expiry reminders

### AI Use
- appointment letter drafts
- warning letters
- HR summary generation

---

## 5.14 Transport Module
### Include
- route setup
- stop setup
- vehicle records
- driver/conductor details
- route-wise student mapping
- transport fee mapping

### Automation
- transport fee billing
- route occupancy reports
- route fee due list

### AI Use
- route optimization suggestions

---

## 5.15 Inventory & Assets Module
### Include
- stationery inventory
- uniform/book inventory if needed
- issue/return records
- classroom assets
- stock summary
- low stock alerts

### Automation
- low stock alerts
- issue logs

### AI Use
- consumption trend prediction

---

## 5.16 Front Office / Reception Module
### Include
- visitor register
- call log
- enquiry register
- appointment register
- complaint register
- document receive/dispatch

### Automation
- follow-up reminders
- unresolved complaint alerts

### AI Use
- call note summary
- enquiry intent classification

---

## 5.17 Certificates & Document Generator Module
### Include
- bonafide certificate
- fee certificate
- character certificate
- ID card
- admission confirmation
- no dues certificate
- TC request and issuance

### Automation
- auto-fill from student data
- PDF generation
- document number generation
- approval workflow for sensitive documents

### AI Use
- formal letter drafting
- staff/student certificate text suggestions

---

## 5.18 Reports & Analytics Module
### Include
- admissions reports
- class strength reports
- fee reports
- attendance reports
- result reports
- staff reports
- transport reports
- communication logs
- audit reports

### AI Use
- executive MIS summary
- trend analysis
- what-needs-attention recommendations

---

# 6. Menu and Submenu Structure

## Main Menu 1: Dashboard
- Overview
- AI Summary
- Alerts & Tasks
- Recent Activity

## Main Menu 2: Master Setup
- School Profile
- Academic Sessions
- Classes
- Sections
- Subjects
- Fee Heads
- Exam Types
- Holidays
- Student Categories
- Document Types
- Notification Templates
- Transport Masters
- Staff Designations

## Main Menu 3: Admissions
- Enquiry Entry
- Enquiry List
- Follow-Up Tracker
- Registration Form
- Admission Form
- Pending Documents
- Approved Admissions
- Rejected/Cancelled
- Waitlist

## Main Menu 4: Students
- Student List
- Student Profile
- Promote/Transfer Students
- Archived/Inactive Students
- Documents Repository
- Sibling Mapping

## Main Menu 5: Fees
- Fee Structure
- Fee Assignment
- Collect Fee
- Receipts
- Refunds/Adjustments
- Student Ledger
- Defaulter List
- Daily Collection
- Monthly Collection
- Head-wise Reports

## Main Menu 6: Attendance
- Student Attendance
- Staff Attendance
- Leave Entries
- Monthly Attendance Reports
- Low Attendance Alerts

## Main Menu 7: Academics
- Subject Allocation
- Teacher Allocation
- Lesson Plans
- Homework/Classwork
- Class Diary
- Syllabus Tracking
- Notebook Check

## Main Menu 8: Timetable
- Class Timetable
- Teacher Timetable
- Substitute Management
- Room/Period Allocation

## Main Menu 9: Exams & Results
- Exam Setup
- Marks Entry
- Grade Rules
- Result Processing
- Report Card
- Result Analysis
- Weak Students Report

## Main Menu 10: Communication
- Notice Board
- Broadcast Messages
- SMS Center
- WhatsApp Center
- Email Center
- PTM Reminders
- Templates
- Complaint Tracking
- Communication Logs

## Main Menu 11: Parent Portal
- Parent Dashboard
- Attendance
- Fees
- Homework
- Results
- Notices
- Complaints/Requests

## Main Menu 12: Student Portal
- Student Dashboard
- Homework
- Attendance
- Results
- Timetable
- Notices

## Main Menu 13: HR & Payroll
- Staff Directory
- Attendance
- Leave
- Salary Setup
- Payroll Run
- Salary Slips
- Staff Documents

## Main Menu 14: Transport
- Routes
- Stops
- Vehicles
- Student Route Mapping
- Route Reports
- Transport Fees

## Main Menu 15: Inventory
- Item Master
- Stock In
- Stock Out
- Issue Register
- Low Stock Alerts
- Asset Register

## Main Menu 16: Front Office
- Visitor Register
- Call Log
- Enquiries
- Appointments
- Complaints
- Incoming/Outgoing Documents

## Main Menu 17: Certificates
- Bonafide Certificate
- Fee Certificate
- Character Certificate
- ID Card
- No Dues Certificate
- TC Requests
- TC Issue Register

## Main Menu 18: Reports
- Admission Reports
- Student Reports
- Fee Reports
- Attendance Reports
- Academic Reports
- Exam Reports
- Staff Reports
- Transport Reports
- Audit Reports
- AI MIS Summary

## Main Menu 19: Settings & Access Control
- Users
- Roles
- Permissions
- Audit Logs
- System Settings
- Integrations

---

# 7. AI Features Priority List
## Must-Have AI Features for V1
1. Smart Search Assistant
2. AI Message Drafting
3. AI Dashboard Summary
4. AI Teacher Remark Generator
5. OCR-based admission document extraction

## Nice-to-Have AI Features for V2
1. Parent issue summarizer
2. Weak student prediction
3. Fee recovery prioritization
4. Timetable optimization suggestions
5. Staff productivity summary

## Avoid in Initial Version
- facial recognition attendance
- full chatbot everywhere
- voice bot everywhere
- overly complex predictive engines

---

# 8. Automation Blueprint
## Daily Automations
- absent student alert
- fee receipt send
- pending admission follow-up list
- principal daily summary
- teacher pending entry reminders

## Weekly Automations
- class-wise fee due summary
- low attendance report
- enquiry conversion report
- weak student report
- missing documents report

## Monthly Automations
- fee bill generation
- payroll generation
- attendance summary
- management MIS summary
- admission trend report

## Event-Based Automations
- admission approved → generate student ID and parent login
- fee received → receipt + ledger update + message
- result published → notify parent
- TC issued → archive student
- staff onboarded → role/account creation

---

# 9. Database Blueprint (High Level)
## Core Tables
- users
- roles
- permissions
- sessions
- classes
- sections
- students
- student_parents
- admissions
- enquiries
- student_documents
- fee_heads
- fee_structures
- fee_assignments
- fee_transactions
- student_attendance
- staff
- staff_attendance
- staff_leave
- subjects
- teacher_allocations
- lesson_plans
- homework_entries
- timetables
- exams
- marks
- report_cards
- notices
- communications
- complaints
- transport_routes
- transport_stops
- student_transport_map
- inventory_items
- stock_transactions
- certificates
- payroll_runs
- audit_logs

---

# 10. Development Phases
## Phase 1: Foundation (Must Build First)
- authentication
- role system
- master setup
- admission module
- student master
- fees module
- dashboard basics

## Phase 2: Core School Operations
- attendance
- academics
- homework
- communication center
- parent portal basics

## Phase 3: Academic Control
- timetable
- exams
- results
- report card

## Phase 4: Admin Scale Modules
- HR/payroll
- certificates
- front office
- transport
- inventory

## Phase 5: AI + Smart Automation
- smart search
- AI summaries
- OCR document extraction
- AI draft engines
- pattern/risk dashboards

---

# 11. Cursor Development Sequence
## Sprint 1
- auth
- user roles
- dashboard shell
- master setup pages

## Sprint 2
- admission enquiry flow
- admission form
- student creation
- student listing
- student profile page

## Sprint 3
- fee structures
- fee collection
- ledger
- receipt generation
- dues reports

## Sprint 4
- student attendance
- staff attendance
- alerts
- basic reports

## Sprint 5
- homework/classwork
- communication center
- notices
- parent portal basics

## Sprint 6
- timetable
- exams
- marks entry
- report cards

## Sprint 7
- certificates
- front office
- HR/payroll basics
- transport and inventory basics

## Sprint 8
- AI smart search
- AI summaries
- AI message drafting
- OCR workflows

---

# 12. Dashboard Suggestions by Role
## Management Dashboard
- total students
- admissions trend
- total dues
- monthly collection
- staff count
- AI executive summary

## Principal Dashboard
- class attendance
- teacher attendance
- syllabus completion
- weak students
- pending homework

## Accounts Dashboard
- collection today
- collection this month
- outstanding dues
- top defaulters
- concession summary

## Teacher Dashboard
- today timetable
- pending attendance
- pending homework
- class alerts

## Parent Dashboard
- attendance
- fees due
- recent notices
- homework
- exam updates

---

# 13. Important Reports to Include
- admission register
- student master report
- class strength report
- fee collection report
- defaulter report
- student ledger
- attendance monthly report
- result analysis report
- weak student report
- teacher workload report
- certificate issue report
- communication log report
- audit trail report

---

# 14. Key Risks to Avoid
- building all modules together without phases
- weak access control
- no audit log
- too many AI features at start
- poor session structure
- mixing student, fee, and attendance data badly
- no communication history
- no document management

---

# 15. Final Recommendation
For **BHB International School**, the ERP should start with these top 6 priorities:
1. Master Setup
2. Admission + Student Information System
3. Fees
4. Attendance
5. Academics + Homework
6. Communication + Reports

AI should initially focus on:
- smart search
- summaries
- drafting messages
- teacher remarks
- OCR for admission documents

This will produce a practical, scalable, school-ready ERP instead of an overcomplicated system.

---

# 16. Final Sidebar Menu and Route Structure

This sidebar should follow the refined module groups above. Keep the sidebar optimized for operations, not for document completeness. Items that are still planned can stay in the blueprint without appearing in the first production sidebar.

## 16.1 Recommended Sidebar Structure

### 1. Dashboard
- Overview
- AI Summary
- Alerts & Tasks
- Recent Activity

### 2. Master Setup
- School Profile
- Academic Sessions
- Classes
- Sections
- Subjects
- Fee Heads
- Exam Types
- Student Categories
- Document Types
- Notification Templates
- Transport Masters
- Staff Designations

### 3. Admissions
- Enquiry Entry
- Enquiry List
- Follow-Up Tracker
- Registration Form
- Admission Form
- Pending Documents
- Approved Admissions
- Rejected/Cancelled Admissions
- Waitlist
- Survey
- Online Leads

### 4. Students
- Student List
- Student Profile
- Promote / Transfer Students
- Archived / Inactive Students
- Student Documents
- Sibling Mapping

### 5. Fees
- Fee Structure
- Fee Assignment
- Collect Fee
- Receipts
- Refunds / Adjustments
- Student Ledger
- Defaulter List
- Daily Collection
- Monthly Collection
- Head-wise Reports

### 6. Accounts
- Expenses
- Staff Advance
- Fuel (Purchases & Issues)

### 7. Attendance
- Student Attendance
- Staff Attendance
- Leave Entries
- Attendance Reports
- Low Attendance Alerts

### 8. Academics
- Subject Allocation
- Teacher Allocation
- Lesson Plans
- Homework / Classwork
- Smart Content
- Class Diary
- Syllabus Tracking
- Notebook Check

### 9. Timetable
- Class Timetable
- Teacher Timetable
- Substitute Management
- Room / Period Allocation

### 10. Exams & Results
- Exam Setup
- Marks Entry
- Grade Rules
- Result Processing
- Report Card
- Result Analysis
- Weak Students Report

### 11. Communication
- Notice Board
- Broadcast Messages
- SMS Center
- WhatsApp Center
- Email Center
- PTM Reminders
- Templates
- Complaint Tracking
- Communication Logs

### 12. Portals
- Parent Dashboard
- Student Dashboard
- Parent Attendance
- Parent Fees
- Parent Homework
- Student Timetable

### 13. HR & Payroll
- Staff Directory
- Leave
- Salary Setup
- Payroll Run
- Salary Slips

### 14. Transport
- Routes
- Stops
- Vehicles
- Student Route Mapping
- Transport Fees
- Compliance & Documents
- Fuel Log

### 15. Inventory
- Item Master
- Stock In / Out
- Issue Register
- Low Stock Alerts
- Asset Register

### 16. Front Office
- Visitor Register
- Call Log
- Enquiries
- Appointments
- Complaints
- Inward / Outward Documents

### 17. Certificates
- Bonafide Certificate
- Fee Certificate
- Character Certificate
- ID Card
- No Dues Certificate
- TC Requests

### 18. Reports
- Admission Reports
- Student Reports
- Fee Reports
- Attendance Reports
- Exam Reports
- AI MIS Summary
- Audit Reports

### 19. Settings & Access Control
- Users
- Roles
- Permissions
- Audit Logs
- System Settings
- Integrations

---

# 17. Recommended Route Pattern
Use route groups like this:

- /dashboard
- /admissions/*
- /students/*
- /fees/*
- /attendance/*
- /academics/*
- /timetable/*
- /exams/*
- /communication/*
- /ai-tutor/*
- /parent/*
- /student/*
- /transport/*
- /hr/*
- /expenses/*
- /inventory/*
- /front-office/*
- /certificates/*
- /reports/*
- /masters/*
- /settings/*

---

# 18. Cursor Command Pack

## 18.1 Master Build Prompt
Use this first in Cursor:

**Prompt:**
Build a production-ready school ERP for BHB International School (CBSE, Nursery to Class X) using Next.js, TypeScript, Tailwind, shadcn/ui, PostgreSQL, and Prisma. Create a role-based architecture for Super Admin, Management, Principal, Office Admin, Admission Desk, Accounts, Teacher, Class Teacher, Reception, Transport Manager, HR/Admin, Parent, and Student. Use a scalable modular structure with sidebar navigation, protected routes, dashboard cards, data tables, forms, filters, reports, audit logs, and responsive design. The ERP must include Admissions, Students, Fees, Attendance, Academics, Timetable, Exams & Results, Communication, AI Tutor, Parent Portal, Student Portal, Transport, HR & Payroll, Expenses, Inventory, Front Office, Certificates, Reports, Master Setup, and Settings.

---

## 18.2 Sidebar and Layout Prompt
**Prompt:**
Create the full app shell for the school ERP with a professional responsive sidebar, top header, breadcrumb support, role-based menu visibility, notification bell, quick search, profile menu, and dashboard layout. Add menu groups exactly for: Dashboard, Admissions, Students, Fees, Attendance, Academics, Timetable, Exams & Results, Communication, AI Tutor, Parent Portal, Student Portal, Transport, HR & Payroll, Expenses, Inventory, Front Office, Certificates, Reports, Master Setup, and Settings & Access Control.

---

## 18.3 Admissions Module Prompt
**Prompt:**
Build the Admissions module for the school ERP with enquiry entry, enquiry list, follow-up tracker, registration form, admission form, document checklist, approval status, class/section allocation, student ID generation, admission number generation, pending documents screen, approved admissions, rejected/cancelled admissions, and waitlist. Add filters, searchable tables, status badges, timeline history, and role-based actions. On approval, create student and parent records.

---

## 18.4 Students Module Prompt
**Prompt:**
Build the Students module with student list, detailed student profile, document repository, sibling mapping, promotion/transfer workflow, archived students, student achievements, and student interest/talent profile. Include tabs for basic info, parents, academics, fees, attendance, homework, exams, transport, documents, communication logs, remarks, and interest fields like music, dance, sports, art, AI, coding, robotics, leadership, reading, and custom interests.

---

## 18.5 Fees Module Prompt
**Prompt:**
Build the Fees module with fee heads, fee structure, fee assignment, collection screen, receipt generation, student ledger, concessions, refunds/adjustments, defaulter list, daily collection, monthly collection, fee reports, and late fine logic. Add class-wise and student-wise filtering, printable receipts, export support, and dashboard summaries.

---

## 18.6 Attendance Module Prompt
**Prompt:**
Build the Attendance module with student attendance, staff attendance, leave entries, monthly reports, low attendance alerts, and attendance dashboards. Support class-wise daily attendance, bulk marking, half-day, late mark, leave, and summary analytics.

---

## 18.7 Academics + Daily Class Taken Prompt
**Prompt:**
Build the Academics module with subject allocation, teacher allocation, lesson plans, syllabus tracking, notebook check, and a Daily Class Taken system. In Daily Class Taken, support period-wise class execution entry with date, class, section, subject, period, scheduled teacher, actual teacher, class status, topic taught, classwork, homework, and remarks. Add missed class tracker, substitute class flow, weekly teaching summary, and principal dashboard widgets for taken vs missed periods.

---

## 18.8 Homework/Classwork Automation Prompt
**Prompt:**
Build classwork and homework upload workflows linked to the Daily Class Taken module. After teacher class entry, prompt for classwork and homework update. Add pending upload reminders, teacher compliance dashboard, principal/coordinator tracking, parent app sync, and weekly upload compliance reports.

---

## 18.9 Timetable Auto-Generation Prompt
**Prompt:**
Build the Timetable module with timetable setup, class timetable, teacher timetable, automatic timetable generator, substitute timetable, conflict checker, and timetable versions. Support classes, sections, subjects, periods, teacher allocations, availability rules, weekly frequency rules, assembly/break periods, and manual override after generation. Highlight teacher conflicts and save generated versions.

---

## 18.10 Exams & Results Prompt
**Prompt:**
Build the Exams & Results module with exam setup, assessment rules, marks entry, result processing, result analysis, weak student reporting, topper list, and printable result cards. Support two report styles: (1) Nursery to UKG cartoon-style progress cards with developmental indicators, teacher observations, stars/icons, and child-friendly layout; (2) Class 1 to Class 9 CBSE-style report cards with scholastic, co-scholastic, attendance, remarks, and promotion status.

---

## 18.11 WhatsApp Communication Prompt
**Prompt:**
Build a WhatsApp automation center for the ERP with template library, broadcast campaigns, automated trigger-based campaigns, delivery logs, failed message queue, parent replies, scheduled messages, and message analytics. Support categories for admissions, fees, attendance, homework, exams, notices, complaints, transport, and internal teacher reminders. Add approval-based flows for sensitive messages and detailed message logs.

---

## 18.12 AI Tutor Prompt
**Prompt:**
Build an AI Tutor module with separate tools for teachers, students, and limited parent support. Teacher tools should include AI lesson planner, worksheet generator, assessment builder, remedial planner, and remark generator. Student tools should include Learn Mode, Practice Mode, Doubt Solver, Exam Prep, and Revision Notes. Parent support should include homework understanding and weak-area guidance. Build the UI, role-based access, usage logs, and placeholder service integration points.

---

## 18.13 Transport Module Prompt
**Prompt:**
Build the Transport module with route master, stop master, stop distance mapping, vehicle master, driver/conductor records, student transport allocation, distance slab master, transport fee rule engine, one-way/two-way settings, fee override register, route reports, and delay alerts. Add exact distance-aware fee support using stop distance from school, billable distance, slab-based fee logic, manual override with audit trail, and parent-facing transport details.

---

## 18.14 HR, PF, ESIC Prompt
**Prompt:**
Build the HR & Payroll module with staff directory, joining records, staff documents, attendance, leave, salary structure, payroll run, salary slips, PF settings, ESIC settings, and statutory reports. Keep PF and ESIC settings configurable with effective-date-based rules and editable admin settings. Add employee statutory fields like UAN, ESIC number, applicability flags, and payroll deduction preview.

---

## 18.15 Expenses Module Prompt
**Prompt:**
Build a Daily Regular Expenses module with expense category master, vendor/payee master, daily expense entry, bill/voucher upload, approval queue, petty cash register, monthly expense summary, and reports. Support categories like stationery, electricity, internet, fuel, maintenance, printing, cleaning, events, hospitality, and miscellaneous admin expenses.

---

## 18.16 Parent Suggestion Engine Prompt
**Prompt:**
Build a parent-side suggestion engine that shows guidance for supporting the child using attendance trends, result performance, weak subjects, homework completion, teacher remarks, and student interest fields. Add cards like academic suggestions, habit suggestions, talent support ideas, and exam-time guidance. Keep the tone supportive, practical, and age-appropriate.

---

## 18.17 Reports and Audit Prompt
**Prompt:**
Build a central Reports module with filters, exports, printable views, and role-based report access for admissions, students, fees, attendance, academics, timetable, exams, transport, payroll, expenses, communication, AI usage, and audit logs. Add audit trail screens showing user action, old value, new value, entity, timestamp, and module.

---

# 19. Best Development Order
1. App shell + auth + roles
2. Master setup
3. Admissions
4. Students
5. Fees
6. Attendance
7. Academics + Daily Class Taken
8. Homework/Classwork automation
9. Timetable
10. Exams & Results
11. Communication + WhatsApp
12. Transport
13. Parent + Student portals
14. HR & Payroll + PF/ESIC
15. Expenses
16. Reports + audit
17. AI Tutor

---

# 20. Final Recommendation
Use this document as the master implementation guide for Cursor. Build module by module, keep database relations clean, make permissions strict, and add automation only where it reduces staff work. For BHB International School, the highest-value differentiators will be:
- admissions to student lifecycle continuity
- fee + communication automation
- daily class taken monitoring
- stage-wise report card design
- AI tutor support
- transport fee accuracy
- parent-facing actionable suggestions
