# EZEmployee HR Dashboard

EZEmployee is now a richer web-based employee operations platform built from the original synopsis. It keeps the core employee management idea, but expands it into a role-based HR dashboard with employee profiles, attendance tracking, leave management, analytics, and SQLite-backed persistence.

## Features

- Role-based login with demo accounts
- Employee CRUD operations
- Employee profile view with photo upload
- Employee self-profile editing
- Attendance management
- Leave request workflow with manager-only approvals
- Password change and demo reset-code flow
- Executive dashboard charts and activity feed
- Department, role, and attendance analytics
- CSV export
- SQLite persistence
- Dark and light themes

## Tech Stack

- Node.js built-in `http`, `fs`, `crypto`, and `node:sqlite`
- HTML, CSS, and vanilla JavaScript
- SQLite database in `data/ezemployee.db`
- Uploaded employee profile photos in `uploads/`

## Demo Staff Accounts

- `admin` / `admin123` - `Admin`
- `hrlead` / `hr123` - `HR`
- `manager` / `manager123` - `Manager`
- `hrlead` and `manager` are now linked to real employee profiles so they can apply for their own leave from the staff dashboard

## Demo Employee Accounts

- Employee usernames are generated from the employee code in lowercase, for example `emp101`
- Default employee password: `employee123`

## Run the Project

```powershell
node server.js
```

Then open:

`http://127.0.0.1:3000`

## Project Structure

- `server.js` - backend server, SQLite setup, and API routes
- `public/index.html` - dashboard markup
- `public/styles.css` - enterprise UI styling
- `public/app.js` - frontend state, forms, charts, and interactions
- `data/ezemployee.db` - SQLite database created at runtime
- `uploads/` - uploaded employee photos

## Main Modules

- `Employee Directory` - create, edit, delete, search, and inspect profiles
- `Attendance Manager` - mark and update daily attendance
- `Leave Management` - submit and review leave requests
- `Reports` - employee status, departments, roles, attendance trend, and activity feed
- `Role-Based Access` - different permissions for Admin, HR, Manager, and Employee

## Employee Self Service

- Employees have a separate sign-in area on the login screen
- Employee accounts can submit only their own attendance
- Employee accounts can submit only their own leave requests
- Employee accounts can edit their own profile details
- Employee accounts can change their password
- Employee accounts cannot access the admin dashboard

## Password Reset Demo

- Use the `Request Reset Code` panel on the login screen
- The demo app shows the reset code directly on screen instead of emailing it
- Reset codes expire after 15 minutes

## Manager Approval Flow

- Only `Manager` accounts can approve or reject leave requests
- `Admin` and `HR` can still create and monitor leave requests, but approvals happen in the separate manager queue
