# 💡 SalaryLens — Salary Bill Tax Validation System

A full-stack web application for uploading salary slips, auto-calculating income tax, detecting TDS discrepancies, and managing reimbursement claims through an approval workflow.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + React Router |
| Backend | Django + Django REST Framework |
| Auth | JWT (SimpleJWT) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| OCR | Tesseract (pytesseract) |

---

## 🚀 Getting Started

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (admin)
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on http://localhost:3000  
Backend API runs on http://localhost:8000

---

## 👤 User Roles

| Role | Permissions |
|---|---|
| **Employee** | Upload salary bills, view tax analysis, file reimbursement claims |
| **Manager** | View all bills, approve/reject bills, approve claims |
| **Finance Admin** | Final claim approval, mark claims as settled |

---

## 📋 Features

- **Salary Bill Upload** — Upload PDF/image payslips
- **OCR Extraction** — Auto-reads salary components via Tesseract
- **Tax Engine** — Calculates income tax under Old & New Regime (India 2024-25)
- **TDS Validation** — Compares computed TDS vs slip TDS, flags discrepancies
- **Reimbursement Claims** — Auto-raises claims for excess TDS
- **3-Stage Approval** — Employee → Manager → Finance workflow
- **Dashboard** — Role-based stats, charts, recent activity

---

## 🔑 API Endpoints

### Auth
```
POST /api/auth/register/
POST /api/auth/login/
GET  /api/auth/profile/
POST /api/auth/refresh/
```

### Salary
```
POST /api/salary/upload/
GET  /api/salary/bills/
GET  /api/salary/bills/all/
POST /api/salary/bills/<id>/review/
POST /api/salary/bills/<id>/recalculate/
POST /api/salary/bills/<id>/claim/
GET  /api/salary/claims/
GET  /api/salary/claims/all/
POST /api/salary/claims/<id>/action/
GET  /api/salary/dashboard/
```

---

## 🧮 Tax Slabs Used (2024-25)

### New Regime
| Income | Rate |
|---|---|
| Up to ₹3L | 0% |
| ₹3L – ₹7L | 5% |
| ₹7L – ₹10L | 10% |
| ₹10L – ₹12L | 15% |
| ₹12L – ₹15L | 20% |
| Above ₹15L | 30% |

Standard Deduction: ₹75,000  
Cess: 4% on tax

### Old Regime
| Income | Rate |
|---|---|
| Up to ₹2.5L | 0% |
| ₹2.5L – ₹5L | 5% |
| ₹5L – ₹10L | 20% |
| Above ₹10L | 30% |

---

## 📁 Project Structure

```
salarylens/
├── backend/
│   ├── accounts/          # User auth & roles
│   ├── salary/            # Bills, claims, tax engine
│   ├── salarylens/        # Django settings & URLs
│   ├── manage.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/    # Navbar
    │   ├── context/       # AuthContext
    │   ├── pages/         # All page components
    │   ├── api.js         # Axios instance
    │   └── App.jsx
    └── package.json
```

---

## 🏫 Project by Team NEXUS — ATME College of Engineering
