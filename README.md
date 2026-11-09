<<<<<<< HEAD
# 🏨 Hostel & 🚌 Transport Management System (MERN Stack)

A full-stack, enterprise-grade **Hostel & Transport Management System** built with **MongoDB, Express.js, React 19, and Node.js**, styled with modern **Tailwind CSS**, featuring dynamic **Dark Mode** toggle, role-based access control, interactive **Leaflet.js** live GPS fleet tracking, visual room matrix grids, student outpass workflows, complaint tracking, and online fee billing.

---

## 🌟 Key Features

### 🔐 1. Authentication & Layouts
- **Role-Based Login / Register**: Quick-switch tabs for **Admin**, **Warden**, **Driver**, and **Student/Parent** with 1-click demo credential autofill.
- **Client-Side Validation**: Zod-powered schema validation with field hints and error messaging.
- **Role-Based Protected Routes**: Dynamic navigation sidebar and navbar tailored specifically to the user's role.
- **Dark Mode Support**: Global theme toggle (Light / Dark) persisting to `localStorage` and synchronizing with Tailwind's class-based styling.
- **Responsive Navigation**: Collapsible mobile drawer, sticky header, and quick demo role switchers in the top navigation.

### 🏢 2. Hostel Management UI
- **Room Matrix / Grid View**: Color-coded room cards by availability:
  - 🟢 **Green**: Available
  - 🔴 **Red**: Occupied
  - 🟡 **Yellow**: Under Maintenance
- **Capacity & Occupant Badges**: Real-time bed counter and occupant roster.
- **Room Allocation Portal**: Modal to assign students to vacant beds with room and roll number mapping.
- **Student Room Swap**: Interactive dialog for Wardens to swap students between designated rooms and beds.
- **Maintenance Toggle**: Mark rooms in/out of maintenance status directly from the card.
- **Weekly Mess Menu Schedule**: Multi-course dining timetable (Breakfast, Lunch, Evening Snacks, Dinner) with interactive Monday–Sunday day picker.
- **Complaint Box UI**: Maintenance ticketing system categorized by **Plumbing**, **Wi-Fi**, **Electrical**, **Carpentry**, **Cleaning**, with priority badges and Warden status resolution notes.

### 🚌 3. Transport Management UI
- **Route & Stop Directory**: Accordion-based schedule listing routes, assigned drivers, emergency contacts, morning pickup, and evening return timings.
- **Student Transport Assignment**: Interface to map students to specific designated bus stops.
- **Interactive Live Tracking (Leaflet.js)**: Real-time simulated bus locations, waypoints, polyline route paths, and dynamic speedometer telemetry.
- **Parent Alert Notification Banner**: Real-time broadcasts notifying students and parents of bus arrivals, traffic delays, and emergency detours.
- **Fleet Vehicles Directory**: Vehicle model details, seating capacities, and insurance/fitness validity records.

### 💳 4. Fee & Financial Management UI
- **Billing & Invoice Tables**: Summary table tracking Hostel Fees, Transport Dues, and Mess Dues.
- **Payment Badges**: Clear badges for **Paid**, **Pending**, and **Overdue** statuses.
- **Online Payment Simulator**: Simulated 256-bit payment gateway supporting UPI, NetBanking, and Cards with instant receipt generation.
- **Analytics Widgets**: Visual admin summary cards showing total enrolled students, room occupancy rate gauge, active routes, and collected fee revenues.

---

## 🔑 Pre-Configured Demo Credentials

Use the convenient quick-fill buttons on the login screen or enter the credentials below:

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| 🛡️ **Admin** | `admin@hostel.com` | `admin123` | Institutional analytics, user management, full access across all portals |
| 🏢 **Warden** | `warden@hostel.com` | `warden123` | Room matrix allocation, student room swaps, outpass approvals, complaint resolution |
| 🚌 **Driver** | `driver@hostel.com` | `driver123` | Route management, fleet monitoring, live tracking, parent broadcast alerts |
| 🎓 **Student** | `student@hostel.com` | `student123` | My Room & roommates, weekly mess menu, outpass requests & tracker, fee payment |

---

## 📁 Project Architecture

```
Web-Project/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection with graceful mock fallback
│   │   ├── models/
│   │   │   ├── User.model.js         # User schema with bcrypt password hashing
│   │   │   ├── Room.model.js         # Hostel rooms, beds, occupants, amenities
│   │   │   ├── Route.model.js        # Routes, stops, arrival timings, GPS coordinates
│   │   │   ├── Vehicle.model.js      # Buses, capacity, driver assignment, insurance
│   │   │   ├── Complaint.model.js    # Infrastructure tickets & resolution tracking
│   │   │   ├── Fee.model.js          # Invoices, fee types, payment statuses
│   │   │   └── Outpass.model.js      # Leave requests & warden approval workflow
│   │   ├── controllers/
│   │   │   ├── auth.controller.js    # Login, register, profile, user management
│   │   │   ├── hostel.controller.js  # Rooms, allocation, swap, outpass, mess menu
│   │   │   ├── transport.controller.js # Routes, stops, simulated GPS, alerts
│   │   │   ├── fee.controller.js     # Invoices & payment settlement
│   │   │   └── complaint.controller.js# Ticket submission and resolution
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── hostel.routes.js
│   │   │   ├── transport.routes.js
│   │   │   ├── fee.routes.js
│   │   │   └── complaint.routes.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js    # JWT verification
│   │   │   └── role.middleware.js    # Role-based endpoint authorization
│   │   ├── utils/
│   │   │   ├── generateToken.js      # JWT signing
│   │   │   ├── initialData.js        # Seed dataset for all roles and modules
│   │   │   └── store.js              # Database & in-memory state synchronization
│   │   └── server.js                 # Express server & CORS configuration
│   ├── .env                          # PORT, MONGO_URI, JWT_SECRET, CLIENT_URL
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── favicon.ico
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx            # Header, brand, theme toggle, role switcher, profile
    │   │   ├── Sidebar.jsx           # Role-based dynamic navigation links
    │   │   ├── ProtectedRoute.jsx    # Client-side role authorization guard
    │   │   ├── Modal.jsx             # Accessible modal dialog
    │   │   └── Table.jsx             # Filterable and searchable data table
    │   ├── context/
    │   │   └── AuthContext.jsx       # Global auth, JWT, dark mode theme provider
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── Login.jsx         # Role-based login with demo autofill
    │   │   │   └── Register.jsx      # Account creation with Zod validation
    │   │   ├── admin/
    │   │   │   ├── AdminDashboard.jsx# Metrics, occupancy breakdown, fleet analytics
    │   │   │   └── UserManagement.jsx# Manage system accounts and roles
    │   │   ├── warden/
    │   │   │   ├── WardenDashboard.jsx# Key metrics, urgent issues
    │   │   │   ├── RoomAllocation.jsx# Visual Room Matrix (Green/Red/Yellow), swap & assign
    │   │   │   ├── LeaveRequests.jsx # Outpass review & authorization
    │   │   │   └── Complaints.jsx    # Maintenance complaint box
    │   │   ├── transport/
    │   │   │   ├── TransportDashboard.jsx # Fleet overview & parent alert broadcast
    │   │   │   ├── RouteManager.jsx       # Route accordion & student stop mapping
    │   │   │   └── LiveTracking.jsx       # Leaflet.js interactive map with live telemetry
    │   │   └── student/
    │   │       ├── StudentDashboard.jsx # My room, weekly mess menu, bus stop info
    │   │       ├── OutpassForm.jsx      # Digital leave form & status tracker
    │   │       └── FeeStatus.jsx        # Invoices table & online payment modal
    │   ├── services/
    │   │   ├── axiosInstance.js      # Base URL & JWT Bearer interceptor
    │   │   ├── authService.js
    │   │   ├── hostelService.js
    │   │   └── transportService.js
    │   ├── utils/
    │   │   └── validators.js         # Zod schemas, formatters, and status styles
    │   ├── App.jsx                   # Central router & role guards
    │   ├── main.jsx                  # React DOM entry point
    │   └── index.css                 # Tailwind CSS & Leaflet map styling
    ├── .env                          # VITE_API_URL
    ├── tailwind.config.js
    └── package.json
```

---

## 🚀 How to Run the Project

### 1. Start the Backend API Server
```bash
cd backend
npm install
npm run dev
# or: node src/server.js
```
The server will start at `http://localhost:5000`.

> **Note on MongoDB**: If a local MongoDB instance is running, it connects automatically. If MongoDB is offline, the backend gracefully runs with an **in-memory data store with live state updates**, allowing full instant testing without any database setup required.

### 2. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🎨 Dark Mode
Toggle dark mode anytime using the **Sun / Moon** icon in the top header navbar. The application immediately adapts text, backgrounds, cards, borders, and modal dialogs with smooth transitions.

=======
# ST-HMSystem
Semester 6 final project
>>>>>>> ddb8efd792dd8aebaca98471e19519bed5e65a61
