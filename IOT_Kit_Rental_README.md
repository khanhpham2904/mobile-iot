# IOT Kit Rental System - README

## Project Overview
**English:** Building a Borrowing and Returning System for IoT Devices at FPT University Ho Chi Minh City  
**Vietnamese:** Xây dựng hệ thống Quản lý mượn trả thiết bị IoT cho trường Đại học FPT Hồ Chí Minh  
**Abbreviation:** IOT-BRM

The IoT course at FPT University Ho Chi Minh City emphasizes hands-on practice using physical hardware kits. Student groups (2–4 members) borrow **Standard Kits**, and each lecturer borrows **one Advanced Kit per class** for teaching.  
Current manual borrowing processes (using ID cards) lack real-time tracking and often result in lost or damaged items. This system aims to **digitize and automate** borrowing with QR codes, digital wallets, and role-based access.

---

## Roles and Portals
- **Sinh viên (Student):** Borrow standard kits in groups, use digital wallet, get notifications.
- **Giảng viên (Lecturer):** Borrow advanced kits per class, track kit usage.
- **Cán bộ đào tạo (Academic Affairs):** Manage class/semester data, configure deposit and penalty rules.
- **Phụ huynh (Parent):** Manage class/semester data, configure deposit and penalty rules.
- **Quản trị viên (Admin):** Manage kits, approve borrowing, handle penalties and refunds.

---

## Key Functionalities

### 1. User & Group Management
- Import users (students/lecturers) via Excel (with email validation: `@fpt.edu.vn`).
- Students form groups (2–4 members), with a **Leader** who manages borrowing.
- Leader handles wallet top-ups and QR-based borrowing.
- Members can view wallet and status but cannot initiate borrow requests.

### 2. Wallet & Deposit System
- Each group has a shared wallet for deposits and penalties.
- Deposit required before borrowing.
- Late returns or damages deduct from deposit.
- Admin can audit transactions and process refunds.

### 3. Kit Management
- CRUD for kits and components (name, quantity, unit price).
- Unique QR code for each kit.
- Kit statuses: AVAILABLE / IN-USE / DAMAGED / MISSING.
- Borrowing and returning performed via QR code scanning by Admin.

### 4. Academic Affairs Features
- Upload semester class lists via Excel (class, lecturer, students).
- CRUD operations: semester, class, student, lecturer.
- Configure deposit rates and penalty policies.

### 5. Student Portal
- Leader generates QR code for borrowing.
- Wallet top-up and transaction history.
- Notifications for requests, approvals, penalties, and reminders.
- Report lost/damaged kits through the app.

### 6. Lecturer Portal
- Request advanced kits for classes.
- Track borrowing status, return deadlines.
- Submit extension or damage reports.

### 7. Admin Dashboard
- Approve/reject borrowing and returning.
- Audit wallets and penalties.
- Generate reports (usage, overdue items, inventory).
- Manage components and status updates.

---

## Business Rules (BR)
1. Only `@fpt.edu.vn` logins allowed.
2. Groups have 2–4 members.
3. One Leader per group with wallet control.
4. Each kit has a unique QR code and component list.
5. Wallet is deposit-only; no withdrawals (except refunds by Admin).
6. Advanced Kits are limited to lecturers.
7. Damaged/missing components are deducted from the deposit.

---

## Non-Functional Requirements
- **RBAC:** Role-Based Access Control (Student, Leader, Lecturer, Admin, AA Staff).
- **Security:** Encrypted transactions and secure login.
- **Scalability:** Support multiple semesters, kits, and user batches.
- **Auditability:** Logs for all borrowing/returning actions.
- **Notifications:** Real-time alerts for deadlines, penalties, and approvals.

---

## Future Enhancements
- Online payment gateway integration.
- Push notifications (mobile & email).
- Borrowing history linked to academic performance.
- Smart analytics dashboard.