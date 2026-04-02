# BHB International School ERP - Ultimate Master Blueprint (Final)

## Project Vision
Build a complete AI-powered School ERP + CRM + Marketing + Transport + Finance system for BHB International School (Nursery to Class X, CBSE).

## Complete System Scope
This ERP will handle:

**Enquiry -> Admission -> Student -> Academics -> Fees -> Communication -> Transport -> Finance -> AI -> Automation**

## 1. Admission CRM System (Core)
Strict flow:

**Enquiry -> Follow-up -> Registration -> Document Verification -> Admission Fee -> Final Admission**

### 1.1 Enquiry Module
Sources:
- Office Walk-in
- Survey Team
- Social Media
- Website
- Google Search
- Reference (Staff / Parents / Others)

Features:
- Source tracking
- Staff assignment
- Lead status
- Follow-up scheduling

Automation:
- WhatsApp instant reply
- Daily follow-up reminders

### 1.2 Follow-up System
- Call / WhatsApp / Visit logs
- Next follow-up date
- Lead tagging (Hot / Warm / Cold)

AI:
- Follow-up message suggestion
- Lead scoring

### 1.3 Registration
- Full student and parent details
- Document upload
- Registration receipt

### 1.4 Document Verification
- Checklist system
- Missing document alerts

### 1.5 Admission Fee
- Full / Partial payment
- Receipt generation

### 1.6 Final Admission
Auto actions:
- Student creation
- Unique student ID
- Class assignment
- Parent login creation

Automation:
- Welcome message
- App activation

Reports:
- Source-wise conversion
- Staff performance
- Funnel analytics

## 2. Survey System (Field Admission)
Purpose:
- Door-to-door enquiry collection and verification

Features:
- Mobile form entry
- GPS capture (lat / long)
- Area tagging
- Interest level

Logic:
- Survey entry -> auto enquiry creation

Verification:
- Location validation
- Duplicate detection
- Fake entry alerts

Reports:
- Staff performance
- Area-wise leads
- Conversion percentage

## 3. Online Leads System
Sources:
- Facebook / Instagram
- Google Ads / Forms
- Website forms

Features:
- Webhook integration
- UTM tracking
- Campaign tracking

Logic:
- Online lead -> auto enquiry

Reports:
- Cost per lead
- Conversion rate
- Campaign ROI

## 4. Student Management
- Full student profile
- Parent linkage
- Document storage
- Academic, fee, and attendance mapping

## 5. Fees System
- Fee structure
- Collection
- Receipts
- Ledger
- Defaulters

Automation:
- Due reminders
- Receipt auto-send

## 6. Academics System
Daily Class Taken:
- subject
- topic
- teacher
- homework

Smart Content (Pearson + Leads):
- Content library
- Chapter mapping
- Usage tracking
- Student engagement tracking

AI features:
- Homework auto-generation
- Explanation engine
- Weak student detection

## 7. Attendance
- Student attendance
- Staff attendance

Automation:
- Absent alert
- Low attendance warning

## 8. Exams & Results
- Nursery to UKG -> cartoon format
- Class 1 to 9 -> CBSE pattern

## 9. Timetable
- Auto generation
- Conflict detection

## 10. Communication System
Channels:
- WhatsApp
- SMS
- Email

Events:
- Enquiry
- Admission
- Fees
- Attendance
- Homework
- Results

## 11. AI System
Teacher AI:
- Lesson plans
- Worksheets

Student AI:
- Doubt solving
- Practice

Parent AI:
- Child improvement suggestions

## 12. Finance System
Expenses:
- Daily expense tracking

Staff Advance:
- Advance entry
- Recovery via salary
- Balance tracking

## 13. Transport System
Vehicle Master:
- vehicle details
- driver
- fuel type

Fuel Management:
- Purchase
- Store stock
- Issue to vehicles
- Mileage tracking

Alerts:
- Low mileage
- Fuel misuse
- Due payment

## 14. Vehicle Compliance System
Documents:
- RC
- Insurance
- Fitness
- PUC
- Permit
- Tax
- Driver documents

Alerts:
- 30 / 15 / 7 days before expiry
- Expired alerts

Actions:
- Block vehicle if expired
- Notify management

## 15. Inventory
- Stock management
- Issue / Return

## 16. Certificates
- Bonafide
- TC
- Fee Certificate

## 17. Automation Engine
Daily:
- Follow-up reminders
- Attendance alerts
- Homework alerts

Weekly:
- Weak student report
- Fee due list

Monthly:
- MIS report
- Payroll

## 18. Database Structure
Admission:
- enquiries
- enquiry_followups
- registrations
- document_checklists
- admission_payments

Survey:
- survey_staff
- surveys

Online Leads:
- online_leads
- campaign_tracking

Students:
- students
- parents

Academics:
- classes
- subjects
- class_logs

Smart Content:
- content_library
- content_mapping
- content_usage
- student_activity

Finance:
- fees
- payments
- expenses
- staff_advances
- advance_recoveries

Transport:
- vehicles
- fuel_purchases
- fuel_stock
- fuel_issues
- vehicle_documents
- driver_documents

## 19. Menu Structure
Admissions:
- Enquiry
- Follow-up
- Registration
- Documents
- Admission Fee
- Final Admission
- Survey
- Online Leads

Academics:
- Classes
- Smart Content
- Homework

Accounts:
- Fees
- Expenses
- Staff Advance
- Fuel

Transport:
- Vehicles
- Fuel
- Compliance

## Final Cursor Master Command
Use [bhb_international_school_erp_blueprint (1).md](./bhb_international_school_erp_blueprint%20(1).md) as the detailed implementation guide. This file is the final agreed scope summary and should stay aligned with it.
