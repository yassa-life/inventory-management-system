# 🌿 Suwasetha Indigenous Medicine Hospital Inventory Management System

A production-ready, bilingual (**English & Sinhala**) full-stack inventory management system tailored for indigenous medicine hospitals. Built with **React 19**, **Vite**, **Express**, and **MongoDB Atlas**, featuring serverless deployment capabilities on **Vercel**.

---

## ✨ Key Features

### 📦 Inventory & FEFO Batch Management
- **FEFO Stock Allocation**: Automatically deducts outgoing inventory starting from the nearest-expiry available batch (*First Expiry, First Out*).
- **Inbound Receipts**: Record incoming inventory packs with automatic conversion to base units (`kg`, `g`, `L`, `mL`, `tablet`, `capsule`, `pill`, `bottle`, etc.).
- **Low Stock & Expiry Alerts**: Automated multi-stage alert checkpoints (90 days, 30 days, 7 days, and expired batches).
- **Catalogue Search**: Filter indigenous medicines by English name, Sinhala name, category, or item code.

### 🔐 Security & Access Control (RBAC)
- **Role-Based Access Control**:
  - 👑 **Administrator**: Full system configuration, user management, stock adjustments, and report generation.
  - 📦 **Storekeeper**: Catalogue management, batch receipting, and alert acknowledgments.
  - 💊 **Dispenser**: Stock issuance and dispensary ledger recording.
  - 📜 **Auditor**: Read-only access to audit logs and movement histories.
- **Mandatory First Login Password Change**: Enforces immediate password updates when staff sign in using a temporary password.
- **Password Reset Requests**: Allows staff to request password resets directly from the administrator.
- **JWT & Bcrypt Security**: Industry-standard authentication tokens with hashed passwords.

### 📊 Analytics & Reporting
- **Interactive Dashboard**: Real-time stats on total medicines, low-stock items, expiring batches, and daily issued quantities.
- **Audit Logging**: Comprehensive trail recording every stock movement, user creation, and password modification.
- **CSV Data Export**: Export complete stock balance reports with a single click.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite 6, TypeScript, Lucide Icons, Recharts |
| **Backend** | Express 5, Node.js, Zod validation, JWT, Bcrypt |
| **Database** | MongoDB 6+ (Node Driver), MongoDB Atlas (Cloud) |
| **Deployment** | Vercel Serverless Functions (`/api`), Static SPA Hosting |

---

## 🚀 Vercel Deployment & MongoDB Atlas Setup

### 1. MongoDB Atlas Configuration
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Network Access**, add IP `0.0.0.0/0` (*Allow access from anywhere*) so Vercel serverless functions can connect.
3. Under **Database Access**, create a database user with read/write access.
4. Copy your connection string:
   ```text
   mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>.mongodb.net/suwasetha_inventory?retryWrites=true&w=majority
   ```
   *(Note: URL-encode any special characters in `<PASSWORD>`, e.g. `@` as `%40` or `#` as `%23`)*.

### 2. Vercel Environment Variables
Set the following variables in **Vercel Project Settings -> Environment Variables**:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas Connection String | `mongodb+srv://user:pass@cluster.mongodb.net/suwasetha_inventory?retryWrites=true&w=majority` |
| `MONGODB_DATABASE` | Database Name | `suwasetha_inventory` |
| `JWT_SECRET` | Secret key for signing tokens | `suwasetha-secure-jwt-secret-key-2026` |
| `ADMIN_EMAIL` | Admin login email | `admin@suwasetha.local` |
| `ADMIN_PASSWORD` | Admin initial temporary password | `AdminPass123!` |
| `ADMIN_NAME` | System administrator name | `System Administrator` |
| `CLIENT_ORIGIN` | CORS allowed origin | `*` |
| `VITE_API_URL` | Base path for frontend API calls | `/api` |

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js**: v20 or later
- **MongoDB**: Local MongoDB instance (or Docker)

### Installation
```bash
# Clone the repository
git clone https://github.com/yassa-life/inventory-management-system.git
cd inventory-management-system

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

### Running Locally
```bash
# Start local MongoDB replica set (Windows PowerShell script included)
npm run db:start

# Seed default catalogue & admin user
npm run db:seed

# Start concurrent development server (Frontend + Backend API)
npm run dev
```

Open `http://localhost:5173` in your browser and sign in with the default admin account:
- **Email**: `admin@suwasetha.local`
- **Password**: `AdminPass123!`

---

## 📁 Repository Structure

```text
├── api/
│   └── index.ts            # Vercel Serverless Function entry point
├── server/
│   ├── db.ts               # MongoDB driver connection & indexes
│   ├── index.ts            # Express REST API routes & middleware
│   ├── seed.ts             # Default database seed script
│   └── stock.ts            # FEFO allocation logic & tests
├── src/
│   ├── lib/
│   │   ├── api.ts          # Frontend API client
│   │   └── i18n.ts         # English / Sinhala translation dictionary
│   ├── App.tsx             # Main React application & pages
│   ├── main.tsx            # React DOM entry point
│   └── styles.css          # Design system & CSS styles
├── vercel.json             # Vercel API & SPA rewrite configuration
└── package.json            # Project dependencies & npm scripts
```

---

## ⚖️ Scope & Disclaimer

This software is strictly an **inventory management system** for tracking drug stock levels, batch expiries, and dispensary movements. It does **not** contain electronic health records (EHR), clinical diagnosis tools, or prescribing features. Sample medicine names and reorder thresholds should be reviewed by an authorized hospital practitioner prior to live clinical operation.

---

## 📄 License

Developed for **Suwasetha Indigenous Medicine Hospital**. All rights reserved.
