# Source extract — SOW — Integrated Resort Management ERP (QuantumCLK Technologies)
- Source file: QuantumCLK_Resort_ERP_SOW.docx
- Source path: /run/media/ash_63/DATA/ERP_Resouce/QuantumCLK_Resort_ERP_SOW.docx
- Extraction date: 2026-10-01T09:41:03+05:30
- sha256: 2adc277bcc874f5e7eb9cf253e99327df0b84cd5ab2a658796f6d7f0e9ceda04
- Note: derived text extract for developers without drive access. The original file is the source of truth; if they differ, the original wins and this extract must be refreshed.
- Method: python-docx paragraph + table text

---

QuantumCLK Technologies
Belagavi, Karnataka
INTEGRATED RESORT MANAGEMENT ERP
Scope of Work & Functional Requirements

CONFIDENTIAL — FOR CLIENT REVIEW

1. Document Control

This document converts the supplied pre-SOW and annotated photographs into a client-ready functional scope.
2. Executive Summary
QuantumCLK Technologies shall design, develop, integrate, deploy and support an integrated Resort Management ERP and Digital Hospitality Platform for the Client.
The platform is intended to connect guest-facing, accommodation, membership, reservation, billing, distribution and management functions through a centralized system.
2.1 Objectives
Centralize resort operations in one platform.
Enable direct online room booking and centralized reservation control.
Maintain unified guest and member profiles.
Support RFID-based member identification and access workflows.
Synchronize supported OTA inventory and reservations.
Automate configured guest communications through WhatsApp/email/SMS.
Provide role-based dashboards for management and operational teams.
Provide management reports for occupancy, reservations, membership, payments and operations.
2.2 Integrated Operating Principle
A reservation can create/update a guest profile; room allocation can interact with housekeeping; enabled dining, spa and facility transactions can be associated with the guest/member account; membership can be linked to RFID; and relevant transactions can flow into billing and reporting.
3. Core ERP Module Map

3.1 End-to-End Guest Journey
Website/OTA → Reservation → Guest Profile → Payment → Front Office → Room Allocation → Housekeeping → Stay → Dining/Spa/Pool/Activities → Guest Folio → Checkout → Feedback/Loyalty → Retention communication.
4. ERP-01 — Resort Website & Content Management System
CORE
Functional Scope
Custom resort-branded UI/UX and responsive frontend.
Home, About, Accommodation, Amenities, Gallery, Contact and policy pages.
Dynamic room and package listings.
Photo/gallery management.
Inquiry and contact forms.
Google Maps and social-media integration.
SEO-friendly page structure.
CMS for content, images, banners and resort information.
Blog/announcement section where configured.
Basic analytics integration.
Deliverables
Website frontend
CMS/admin panel
Room/package content management
Gallery and enquiry management
Production-ready deployment
5. ERP-02 — Booking & Reservation Management
CORE
Functional Scope
Online room booking.
Real-time room availability.
Multiple room categories.
Seasonal/custom pricing.
Booking confirmation workflow.
Reservation management.
Guest booking history.
Booking modification and cancellation handling.
Occupancy management.
Promotional code support where configured.
Booking status tracking.
Advance and partial payment workflow.
Deliverables
Booking engine
Reservation dashboard
Room availability management
Pricing configuration
Booking history and reports
Workflow
Guest selects dates → availability/pricing → guest details → payment where applicable → reservation confirmation → reception/admin visibility.
6. ERP-03 — Front Office Management
CORE
Functional Scope
Reception dashboard.
Guest check-in and check-out.
Walk-in reservation management.
Room allocation and room transfer.
Room and booking search.
Guest verification.
Reservation modification.
Daily arrivals and departures.
Occupancy overview.
Reception activity logs.
Payment/outstanding balance visibility where billing is integrated.
Deliverables
Front-office dashboard
Check-in/check-out workflow
Room allocation
Reservation management
Occupancy tracking
Reception reports
Workflow
Reservation/walk-in → verification → room allocation → check-in → stay → services/charges → checkout → settlement.
7. ERP-04 — Guest Management / CRM
CORE
Functional Scope
Guest registration and profile management.
Booking history and stay history.
Guest preferences and contact information.
Guest search.
Returning guest recognition.
Communication records.
Guest account management.
Linking relevant membership and enabled service activity to the guest profile.
Deliverables
Central guest database
Guest profiles
Booking/stay history
Guest search
Guest administration panel
8. ERP-05 — Membership & Loyalty Management
CORE
Functional Scope
Member registration and enrollment.
Membership ID generation.
Multiple membership tiers.
Loyalty point accumulation.
Reward redemption.
Membership validity management.
Member benefits.
Member dashboard.
Membership transaction history.
Point earning/redemption history.
Membership reports.
Manual loyalty adjustments by authorized administrators.
Renewal and membership status management.
Deliverables
Membership portal
Loyalty point engine
Member dashboard
Tier management
Reward redemption
Membership reports
9. ERP-06 — RFID Membership & Access Management
CORE
Functional Scope
RFID card registration and member verification.
Member-card mapping.
ESP32-based enrollment/reception terminal integration as applicable.
Card issuance, activation/deactivation and replacement.
Card expiry/renewal status.
RFID authentication.
Member access logs.
Secure enrollment workflow.
Supported facility verification for pool/spa/member areas where configured.
Deliverables
RFID enrollment workflow
RFID card management
Included in the base implementation: 1 RFID enrollment/reception terminal + 100 resort-branded RFID membership cards
Access/activity logs
Hardware integration support
Workflow
Member profile → RFID card assignment → card verification → entitlement check → access/usage record → reporting.
10. ERP-07 — Payment & Billing
CORE
Functional Scope
Online payment gateway integration.
UPI, debit/credit card and net banking through selected gateway.
Booking payment collection.
Advance and partial payments.
Payment status tracking.
Invoice generation.
Refund management.
Payment history.
Transaction reports.
Payment reconciliation dashboard.
Guest folio/charge visibility for enabled service modules.
Deliverables
Payment gateway integration
Payment dashboard
Invoice management
Transaction records
Refund management
Financial reports
11. ERP-08 — Central Administration & Reporting
CORE
Functional Scope
Central administration dashboard.
User management.
Role-based access control.
Booking, occupancy, revenue, membership, payment and guest reports.
Excel/CSV/PDF export for supported reports.
System/service management options.
Audit logs.
Central visibility across enabled departments.
Deliverables
Master administration dashboard
User/permission management
Operational reports
Revenue reports
Membership reports
Export functionality
Configuration panel
12. ERP-09 — OTA / Channel Management
CORE
Functional Scope
OTA connectivity with supported channels.
Inventory synchronization.
Room availability updates.
Booking synchronization.
Reservation import.
Centralized booking management.
Channel availability monitoring.
OTA booking reports.
Relevant cancellation/modification synchronization where supported by the OTA API.
Deliverables
OTA integration
Inventory synchronization
Reservation synchronization
Channel management dashboard
OTA reports
Workflow
OTA booking → supported API/channel → central reservation → inventory update → front office → guest communication.
13. ERP-10 — Smart Guest Experience / Digital Guest Portal
OPTIONAL ADD-ON
Functional Scope
QR-code digital compendium.
Resort information directory.
Amenities information.
Local attractions guide.
Reception quick-call.
Guest assistance requests.
Important contact directory.
QR-based guest portal.
Digital resort compendium.
Guest information management.
QR code generation.
Administration panel.
Workflow
Guest scans QR → digital portal → information/services → assistance request or reception contact.
14. ERP-11 — Digital Dining, Restaurant & Kitchen Management
OPTIONAL ADD-ON
Functional Scope
Digital menu and QR menu access.
Room-service ordering.
Dine-in ordering where configured.
Order tracking.
Kitchen notification/dashboard.
Menu management.
Item availability management.
Order management dashboard.
Kitchen order-status updates.
Guest/room association.
Administration panel.
Workflow
Guest → QR/digital menu → order → kitchen → preparing → ready → delivery → billing/guest folio.
15. ERP-12 — Marketing & Communication Automation
OPTIONAL ADD-ON
Functional Scope
WhatsApp booking confirmations.
Booking reminder notifications.
WhatsApp OTP authentication where supported.
Email notifications.
Promotional campaign messaging.
Reservation status updates.
Cancellation notifications.
Custom notification templates.
Scheduled announcements.
Communication history.
Automated messaging workflows.
Communication dashboard.
Workflow
Booking → confirmation → payment/status → reminder → stay communication → checkout → feedback/promotional communication.
16. ERP-13 — Review, Feedback & Promotion Management
OPTIONAL ADD-ON
Functional Scope
Private guest feedback collection.
Star rating submissions.
Feedback categorization.
Discount coupon management.
Promotional coupon generation.
Seasonal offers.
Member-exclusive promotions.
Campaign management.
Promotion usage reports.
Feedback management portal.
Promotion dashboard.
Feedback reports.
Workflow
Checkout → feedback request → response → categorization/review → management action; promotions may be distributed to eligible segments.
17. ERP-14 — Workforce Management / HRMS
OPTIONAL ADD-ON
Functional Scope
Employee registration and profiles.
Department and designation management.
Attendance management.
Shift scheduling.
Leave tracking.
Attendance reports.
Workforce dashboard.
Late-arrival tracking.
Overtime records.
Department-wise staff management.
Manual attendance dashboard.
Supported attendance-hardware integration where finalized.
Workflow
Employee → attendance → shift/leave → workforce records → reports.
Scope boundary: employee, attendance, leave and workforce operations are included; payroll computation and statutory payroll processing are excluded unless separately agreed.
18. Resort Facility Administration — Spa, Swimming Pool & Activities
The ERP architecture shall support administrative control for resort facilities. The exact depth of facility functionality will be finalized during requirement analysis and recorded in the approved implementation baseline.
Swimming Pool / Facility Controls
Facility configuration and operating hours.
Member/guest eligibility verification.
RFID/member verification where enabled.
Capacity/session rules where required.
Entry/usage logging.
Facility status and maintenance/closure status.
Usage reports.
Applicable charges or member benefits.
Spa Administration
Spa service catalogue.
Service pricing and duration.
Appointment/booking records where required.
Staff/therapist assignment.
Member/guest identification.
Membership benefits/discounts where configured.
Service status.
Billing/folio linkage where enabled.
Spa activity and revenue reporting.
Other Resort Facilities
Gym
Indoor/outdoor activities
Banquet/event spaces
Kids/club facilities
Other member/guest amenities as approved
Any full standalone POS, advanced scheduling, specialized hardware control or major facility automation beyond the approved requirements shall be treated as additional scope.
19. Housekeeping & Room Readiness
Housekeeping operations may be connected to the room and front-office workflow so reception can view room readiness.
Housekeeping dashboard.
Room cleaning assignments.
Live room status.
Cleaning progress tracking.
Maintenance request logging.
Supervisor monitoring.
Room readiness updates.
Housekeeping reports.
Workflow
Checkout/cleaning required → task assignment → cleaning in progress → inspection/ready → reception sees updated room status.
20. Maintenance & Service Request Management
The platform can provide a centralized workflow for operational maintenance and guest service requests.
Request creation
Department assignment
Priority and status
Task assignment
Resolution notes
Closure
Maintenance history
Operational reports
Guest assistance routing where digital guest portal is enabled
Example Workflow
Request → department → assigned staff → in progress → resolved → closed → audit/report.
20A. RFID Hardware Delivery & Commissioning
RFID hardware is part of QuantumCLK Technologies’ implementation responsibility and is included in the base project scope, subject to the quantities stated in the approved commercial agreement.
RFID membership card design/branding and card preparation.
Embedded RFID membership cards — 100 cards included in the base implementation.
RFID enrollment/reception terminal — 1 unit included.
Microcontroller/reader-writer hardware integration.
Firmware and secure enrollment/verification logic.
Device configuration and backend/API integration.
Member-card mapping, activation/deactivation and replacement workflow.
Installation/configuration and commissioning of the included terminal.
Functional testing of the RFID workflow with the ERP.
Additional terminals/cards can be supplied as separately priced add-ons.
21. Integrated Guest Folio & Cross-Department Transactions

The exact tax, posting and accounting treatment will be finalized during requirements analysis.
22. User Roles & Role-Based Access

Permission Controls
View
Create
Edit
Delete where authorized
Approve
Export
Configure
Report access
23. Reporting & Management Information
Reservation & Occupancy
Booking reports
Cancellation reports
Occupancy reports
Room availability
Booking source/channel
Revenue & Payments
Revenue summaries
Payment reports
Transaction history
Refunds
Outstanding balances
Service-wise revenue where enabled
Membership & RFID
Active members
New memberships
Renewals
Membership status
Loyalty transactions
RFID activity
Operations
Front office
Housekeeping
Dining
Spa/facility activity
Service requests
HR
Attendance
Leave
Shifts
Overtime
Department-wise workforce
Exports
Excel/CSV/PDF export for supported reports
24. Third-Party Integrations & Dependencies

QuantumCLK will integrate supported services based on available APIs and documentation. Third-party accounts, approvals, subscriptions, usage charges and commissions remain the Client’s responsibility unless explicitly included.
25. Technical, Security, Hosting & Backup
25.1 Application
Responsive web interfaces
Centralized database
Role-based authentication
API-based integrations
Relevant audit logging
25.2 Security
Secure authentication
Role/permission controls
HTTPS/SSL where configured
Basic server hardening
Controlled database access
Application validation
25.3 Backup
Automated server backups where hosted/managed by QuantumCLK
Backup monitoring under AMC subject to hosting arrangement
Recovery procedure documentation
25.4 Hosting
Hosting/server resources shall be provided or selected as mutually agreed. Hosting subscription charges are separate unless expressly included.
26. Implementation Methodology & Deliverables

26.1 Documentation
User Guide
Administrator Guide
System Configuration Documentation
Basic Operational Training Material
Deployment/configuration notes
27. Staff Training & Knowledge Transfer
Staff training will be provided during the first month after production deployment.
Administrator training
Reception/front-office training
Membership/RFID training
Billing/payment workflow training
Dining/spa/facility training where applicable
HR/attendance training where HRMS is enabled
Basic reporting/dashboard training
Training Format
Live operational walkthroughs
Role-based training
Basic troubleshooting guidance
Administrator knowledge transfer
The Client shall nominate appropriate staff and ensure availability during scheduled training sessions.
28. Testing, UAT & Acceptance
28.1 Testing
Module testing
Integration testing
Role/permission testing
Reservation/availability testing
Payment workflow testing
RFID testing where hardware is available
Notification testing where third-party services are configured
28.2 UAT
A staging/UAT version shall be made available for Client review. The Client shall provide consolidated feedback within the agreed review period.
28.3 Acceptance
Critical agreed defects identified during UAT shall be addressed before go-live.
Minor UI refinements/non-critical defects may be handled during support.
New functionality outside this SOW requires a Change Request.
29. Client Responsibilities
Provide accurate resort, room, pricing, membership, dining, spa and facility information.
Provide branding assets, images, logos and approved content.
Provide payment gateway, OTA, WhatsApp and third-party credentials.
Provide/approve RFID and attendance hardware in time.
Provide domain/hosting access where applicable.
Provide agreed employee/member data for migration.
Nominate UAT representatives and provide timely feedback.
Ensure staff availability for training during the first month after deployment.
Obtain required third-party approvals/subscriptions.
29.1 Data Migration
Initial data import, if required, shall be limited to agreed datasets supplied in usable digital format. Large-scale cleansing, restructuring or repeated migration cycles shall be separately estimated.
30. Exclusions & Scope Boundaries
Domain registration charges.
Hosting subscription charges unless expressly included.
Third-party API/subscription charges.
Payment gateway transaction charges.
WhatsApp Business/API and messaging charges.
SMS gateway charges.
OTA commissions/subscriptions.
Additional RFID hardware, terminals or membership cards beyond the quantities included in the base implementation, unless specifically approved as an add-on.
Networking, cabling and physical access-control infrastructure unless separately quoted.
Biometric/RFID devices not explicitly listed in the final agreement.
Major custom features requested after scope approval.
Major enhancements after deployment.
Payroll/statutory HR compliance unless separately specified.
External accounting-software integration unless separately specified.
30.1 Change Requests
Requirements that materially change approved functionality, workflows, integrations, number of roles/screens, third-party systems or data-processing requirements may be treated as Change Requests and commercially estimated before implementation.
31. Warranty, Support & Annual Maintenance
31.1 Initial Post-Launch Support
The implementation includes post-launch support for issue resolution and minor refinements as agreed during project closure.
31.2 Annual Maintenance & Support
Application/server support for the agreed deployment environment.
Basic uptime/health monitoring where hosted by QuantumCLK.
Security patches and maintenance updates.
Bug fixes for delivered scope.
Minor feature/configuration updates.
Backup monitoring where applicable.
Integration troubleshooting subject to third-party availability.
Annual Maintenance & Support is chargeable on an annual basis as per the separate commercial agreement. Major new modules, redesigns, major integrations and substantial enhancements are not included in AMC and shall be quoted separately.
Document Detail | Value
Prepared For | Golden Hills Resort
Prepared By | QuantumCLK Technologies
Project | Integrated Resort Management ERP & Digital Hospitality Platform
Document Type | Scope of Work
Item | Details
Document | Integrated Resort Management ERP — Scope of Work
Prepared For | Golden Hills Resort
Prepared By | QuantumCLK Technologies, Belagavi, Karnataka
Contact | 7676866399
Module | Status | Primary Users
ERP-01 Resort Website & CMS | CORE | Guests / Admin
ERP-02 Booking & Reservation | CORE | Guests / Reception / Admin
ERP-03 Front Office | CORE | Reception / Manager
ERP-04 Guest Management / CRM | CORE | Reception / Manager
ERP-05 Membership & Loyalty | CORE | Membership / Admin
ERP-06 RFID Membership & Access | CORE | Membership / Reception
ERP-07 Payment & Billing | CORE | Accounts / Reception / Admin
ERP-08 Administration & Reporting | CORE | Management / Admin
ERP-09 OTA / Channel Management | CORE | Reservations / Admin
ERP-10 Smart Guest Experience | ADD-ON | Guests / Admin
ERP-11 Digital Dining & Kitchen | ADD-ON | Dining / Kitchen / Guests
ERP-12 Marketing & WhatsApp Automation | ADD-ON | Marketing / Admin
ERP-13 Review & Promotion | ADD-ON | Marketing / Management
ERP-14 Workforce Management / HRMS | ADD-ON | HR / Management
Facility administration: Spa / Pool / Activities | As finalized in approved scope | Operations / Admin
Source | Example Transaction | Record Link
Room | Accommodation charges | Reservation / Guest Folio
Dining | Food & beverage order | Guest / Room / Folio
Spa | Treatment/service | Guest / Member / Folio
Facilities | Applicable facility charge | Guest / Member
Membership | Membership fee/renewal | Member Account
Other | Configured service | Guest / Member
Role | Typical Access
Super Admin | Full configuration, users, reports and administration
Resort Manager | Operational dashboards, reports, reservations and approvals
Reception | Bookings, guests, check-in/out and room allocation
Membership | Members, loyalty and RFID administration
Accounts | Payments, invoices, refunds and financial reports
Housekeeping | Room tasks and room readiness
Dining | Menu, orders and kitchen/dining administration
Spa/Facilities | Appointments/services/facility operations where enabled
HR | Employees, attendance and shifts where enabled
Marketing | Communication and promotions where enabled
Integration | Purpose | Commercial / Dependency
Payment Gateway | Online payments | Transaction charges at actuals
WhatsApp Business/API | Automated communication | Provider/API/message charges at actuals
SMS Gateway | SMS notifications | Provider charges at actuals
Email Service | Email notifications | Provider charges where applicable
OTA APIs | Channel distribution | OTA approval/API/commercial terms
RFID Hardware | Member identification/access | Compatibility and hardware procurement
Attendance Hardware | Employee attendance | Compatibility/API availability
Google Maps | Location display | Provider/API terms
Phase | Activities | Output
1. Requirement Discovery | Department discussions, workflows, room/member/service configuration | Approved requirement baseline
2. UI/UX & Architecture | Screen flows, roles, database/API design | Design baseline
3. Core Development | Website, booking, front office, guest, membership, billing, admin | Core modules
4. Integration & Operations | OTA, RFID and selected optional modules | Integrated build
5. Testing | Functional, integration and regression testing | Tested staging build
6. UAT | Client review and acceptance testing | UAT sign-off
7. Deployment | Production setup and configuration | Production system
8. Training | Staff training during first month after deployment | Trained users
9. Go-Live Support | Issue resolution and minor refinements | Stabilized deployment