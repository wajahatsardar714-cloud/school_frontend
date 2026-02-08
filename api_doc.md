School Management System - API Documentation
This document provides a comprehensive reference for the School Management System API.

Base URL
http:// <host>:<port>/api

Authentication
Most endpoints require a JSON Web Token (JWT).

Header: Authorization: Bearer <token>
Middleware: 
authenticate
 (required for most), adminOnly, staffOnly (role-based).
Standard Response Structure
The API uses a standard ApiResponse utility for consistent reporting.

Success (200 OK / 201 Created)

{
  "success": true,
  "message": "Operaton successful",
  "data": { ... }
}
Paginated Success

{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100
  }
}
Error (4xx / 5xx)

{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
1. Authentication Module (/auth)
Handles user login, registration, and profile management.

Login
Endpoint: POST /auth/login
Auth Required: No
Body:
{
  "email": "user@example.com",
  "password": "yourpassword"
}
Description: Authenticates a user. Implements brute-force protection (lockout after 5 failed attempts for 15 minutes).
Success Response: Returns user object and token.
Get Profile
Endpoint: GET /auth/profile
Auth Required: Yes
Description: Retrieves current logged-in user details.
Change Password
Endpoint: PUT /auth/change-password
Auth Required: Yes
Body:
{
  "current_password": "oldpassword",
  "new_password": "newpassword"
}
Register (Admin Only)
Endpoint: POST /auth/register
Auth Required: Yes (Admin)
Body:
{
  "name": "Full Name",
  "email": "email@example.com",
  "password": "password123",
  "role": "ADMIN" // or "STAFF"
}
List Users (Admin Only)
Endpoint: GET /auth/users
Auth Required: Yes (Admin)
Filters: role
Delete User (Admin Only)
Endpoint: DELETE /auth/users/:id
Auth Required: Yes (Admin)
2. Students Module (/students)
Manages student enrollment, profile data, and status changes.

Create Student
Endpoint: POST /students
Auth Required: Yes (Admin)
Body:
{
  "name": "Jane Doe",
  "father_name": "John Doe",
  "cnic": "1234567890123",
  "gender": "FEMALE",
  "dob": "2010-01-01",
  "phone": "03001234567",
  "address": "123 Street, City",
  "guardians": [
    {
      "name": "John Doe",
      "cnic": "1234567890123",
      "relation": "FATHER",
      "phone": "03001234567",
      "occupation": "Engineer"
    }
  ],
  "enrollment": {
    "class_id": 1,
    "section_id": 1,
    "roll_no": "101"
  }
}
Description: Creates a new student, links/creates guardians, and handles initial enrollment in one transaction.
List Students
Endpoint: GET /students
Auth Required: Yes
Query Params: 
search
, class_id, section_id, is_active, page, limit.
Get Student by ID
Endpoint: GET /students/:id
Auth Required: Yes
Description: Returns basic info, guardians, current enrollment, enrollment history, and documents.
Update Student
Endpoint: PUT /students/:id
Auth Required: Yes (Admin)
Enrollment operations
POST /students/:id/enroll: Enroll student.
POST /students/:id/withdraw: Withdraw student.
POST /students/:id/transfer: Transfer student between sections.
POST /students/:id/promote: Promote student to next class.
Student Guardians
POST /students/:id/guardians: Link an existing guardian to a student.
DELETE /students/:id/guardians/:guardianId: Unlink a guardian.
Change Student Status
POST /students/:id/activate: Reactivate a student.
POST /students/:id/deactivate: Mark student as inactive.
POST /students/:id/expel: Expel a student.
POST /students/:id/clear-expulsion: Clear expulsion flag.
3. Guardians Module (/guardians)
Create Guardian
Endpoint: POST /guardians
Body: name, cnic, phone, occupation.
List Guardians
Endpoint: GET /guardians
Query Params: 
search
, page, limit.
Search by CNIC
Endpoint: GET /guardians/search/cnic/:cnic
Auth Required: Yes
Description: Quickly find existing guardian record by 13-digit CNIC.
Get Guardian Details
Endpoint: GET /guardians/:id
Description: Returns guardian details and list of associated students.
Update Guardian
Endpoint: PUT /guardians/:id
Delete Guardian
Endpoint: DELETE /guardians/:id
4. Classes Module (/classes)
Create Class
Endpoint: POST /classes
Body:
{
  "class_type": "SCHOOL", // or "COLLEGE"
  "name": "Class 1",
  "fee_structure": {
    "admission_fee": 5000,
    "monthly_fee": 2000,
    "paper_fund": 500
  }
}
List Classes
Endpoint: GET /classes
Query Params: class_type, is_active, page, limit.
Get Class by ID
Endpoint: GET /classes/:id
Update Class
Endpoint: PUT /classes/:id
Delete Class
Endpoint: DELETE /classes/:id
Fee Structure Management
PUT /classes/:id/fee-structure: Update current fee structure.
GET /classes/:id/fee-history: Retrieve historical fee structures for this class.
5. Sections Module (/sections)
Create Section
Endpoint: POST /sections
Body: class_id, name.
List Sections
Endpoint: GET /sections
Get Section by ID
Endpoint: GET /sections/:id
Update Section
Endpoint: PUT /sections/:id
Delete Section
Endpoint: DELETE /sections/:id
Get Sections by Class
Endpoint: GET /sections/class/:classId
Get Students in Section
Endpoint: GET /sections/:id/students
Description: Returns all active students currently enrolled in the specified section.
6. Vouchers Module (/vouchers)
Handles fee receipt generation.

Generate Single Voucher
Endpoint: POST /vouchers/generate
Body: student_id, 
month
.
Description: Generates a voucher for a specific student. Charges one-time fees only for first enrollment month.
Generate Bulk Vouchers
Endpoint: POST /vouchers/generate-bulk
Body: class_id, section_id (optional), 
month
.
Description: Generates vouchers for all students in a class/section.
List Vouchers
Endpoint: GET /vouchers
Query Params: student_id, 
month
, status, page, limit.
Get Voucher by ID
Endpoint: GET /vouchers/:id
Update Voucher Items
Endpoint: PUT /vouchers/:id/items
Body: items (array of {item_type, amount, description}).
Constraint: Only possible if no payments have been recorded.
Delete Voucher
Endpoint: DELETE /vouchers/:id
Download PDF
Endpoint: GET /vouchers/:id/pdf
7. Fees Module (/fees)
Record Payment
Endpoint: POST /fees/payment
Body: voucher_id, amount, payment_date.
Payment Retrieval
GET /fees/payments: List all payments (filtered by date).
GET /fees/voucher/:id/payments: Payments for a specific voucher.
DELETE /fees/payment/:id: Undo a payment record (Admin only).
GET /fees/payment/:id/receipt: Download PDF receipt.
Defaulters & Dues
GET /fees/defaulters: List students with outstanding balances.
GET /fees/student/:id: Full fee/payment history for a student.
GET /fees/student/:id/due: Current total outstanding for a student.
GET /fees/stats: Fee collection analytics.
8. Faculty Module (/faculty)
Create Faculty Member
Endpoint: POST /faculty
Body:
{
  "name": "Dr. Sarah",
  "cnic": "2345678901234",
  "role": "TEACHER",
  "subject": "Mathematics",
  "base_salary": 45000
}
List Faculty Members
Endpoint: GET /faculty
Query Params: is_active, role, 
search
, page, limit.
Get Faculty by ID
Endpoint: GET /faculty/:id
Update Faculty Member
Endpoint: PUT /faculty/:id
Delete Faculty Member
Endpoint: DELETE /faculty/:id
Faculty Status
PUT /faculty/:id/activate
PUT /faculty/:id/deactivate
Salary Management
PUT /faculty/:id/salary: Update current salary structure.
GET /faculty/:id/salary-history: Retrieve historical salary records.
GET /faculty/stats: Overall faculty statistics.
9. Salaries Module (/salaries)
Generate Salary Voucher
Endpoint: POST /salaries/generate
Body:
{
  "faculty_id": 1,
  "month": "2026-02-01",
  "adjustments": [
    { "type": "BONUS", "amount": 2000, "calc_type": "FLAT" }
  ]
}
Generate Bulk Salaries
Endpoint: POST /salaries/generate-bulk
Body: 
month
, faculty_ids (optional).
Voucher Details
GET /salaries/voucher/:id: Get specific salary voucher.
GET /salaries/vouchers: List/filter salary vouchers.
Adjustments & Payments
POST /salaries/voucher/:id/adjustment: Add adjustment to an existing voucher.
POST /salaries/payment: Record salary disbursement.
GET /salaries/unpaid: List outstanding salary vouchers.
Statistics & PDF
GET /salaries/stats: Salary expenditure analytics.
DELETE /salaries/voucher/:id: Delete voucher (only if unpaid).
GET /salaries/voucher/:id/pdf: Download salary slip.
10. Expenses Module (/expenses)
Create Expense
Endpoint: POST /expenses
Body: title, amount, expense_date.
List Expenses
Endpoint: GET /expenses
Query Params: from_date, to_date, 
search
, min_amount, max_amount.
Expense Operations
GET /expenses/:id: Get specific record.
PUT /expenses/:id: Update expense.
DELETE /expenses/:id: Remove expense.
POST /expenses/bulk: Create multiple expenses at once.
Reports & Analysis
GET /expenses/summary: High-level expense summary.
GET /expenses/daily: Daily totals and itemized breakdowns.
GET /expenses/top: Top expense categories/items.
11. Reports Module (/reports)
Comprehensive financial and operational reports.

Report Types
GET /reports/daily-closing: Consolidated summary of fee collections, salary payments, and expenses for a specific day.
GET /reports/monthly-profit: Profit/loss summary for a specific month.
GET /reports/fee-collection: Detailed fee collection analysis (Query: start_date, end_date, class_id).
GET /reports/defaulters-aging: Aging report for outstanding dues (0-30, 31-60, etc.).
GET /reports/salary-disbursement: HR-specific expenditure report (Query: start_date, end_date).
GET /reports/custom: Custom comprehensive activity report (Query: start_date, end_date).
12. Analytics Module (/analytics)
Strategic Analytics
GET /analytics/dashboard: High-level stats for students, faculty, and daily collections.
GET /analytics/revenue-trends: Monthly profit/loss breakdown over time (Query: months).
GET /analytics/enrollment-trends: Student admission vs. withdrawal metrics.
GET /analytics/class-collection: Revenue performance by class.
GET /analytics/faculty-stats: Teacher-to-student ratios and recruitment trends.
GET /analytics/expense-analysis: Categorical spending breakdown.
GET /analytics/performance: System-wide performance indicators.
13. Documents Module (/documents)
Handles student enrollment documents (photos, CNICs, etc.).

Student Documents
POST /students/:id/documents: Single file upload to R2 storage.
POST /students/:id/documents/bulk: Upload multiple files simultaneously.
GET /students/:id/documents: List all documents for a student.
Document Retrieval & Ops
GET /documents/:id: Fetch document metadata.
GET /documents/:id/download: Direct download stream.
GET /documents/:id/url: Generate temporary signed URL for secure viewing.
DELETE /documents/:id: Permanently remove document from R2 and DB.
PUT /documents/:id: Update document metadata (type, description).
GET /documents/stats: Document storage statistics.
14. Discounts Module (/discounts)
Student Discounts
POST /discounts: Create or overwrite a discount for a student in a class.
GET /discounts: List all active discounts.
GET /discounts/student/:id: Fetch all discounts for a specific student.
PUT /discounts/:id: Update existing discount value/reason.
DELETE /discounts/:id: Remove a discount record.

Comment
⌥⌘M
