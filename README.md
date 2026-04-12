# LeadLink CRM 🔗

A production-ready, feature-rich CRM application designed for high-performance sales teams. Built with a modern full-stack architecture focusing on stability, developer experience, and scalability.

[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node%20%7C%20Postgres-blue)](https://github.com/prakyats/Lead-Link-CRM)
[![API Docs](https://img.shields.io/badge/API-Swagger-green)](http://localhost:5000/api/docs)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🚀 Quick Start

Launch both the frontend and backend with a single command:

```bash
# Install dependencies (Root & Server)
npm install
npm install --prefix server

# Setup Database
npx prisma migrate dev
npm run seed

# Start the full ecosystem
npm run start:all
```

**Visit:** [http://localhost:5173](http://localhost:5173)  
**API Documentation:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

## 🛠️ Technology Stack

| Layer | Technology | Key Features |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | Tailwind CSS v4, Lucide Icons |
| **State Management** | TanStack Query v5 | Caching, Optimistic Updates, Prefetching |
| **Backend** | Node.js, Express | JWT Auth, Rate Limiting, Swagger UI |
| **Database** | PostgreSQL + Prisma | Type-safe queries, Versioned Migrations |
| **Resilience** | React Error Boundaries | Isolated crash recovery, standard API envelopes |

---

## 🧠 Key Engineering Decisions

### 1. Unified Concurrent Workflow
We eliminated the need for multiple terminals and legacy `.bat` files. Using `concurrently`, developers can boot the entire stack, including the Prisma engine and API documentation, via one command, ensuring a consistent developer experience across Windows, macOS, and Linux.

### 2. Resilience & Stability Layer
*   **Error Boundaries**: Implemented granular React Error Boundaries to prevent full-application crashes. If a specific section (like the Kanban board) fails, only that component shows a recovery UI, while the sidebar and navigation remain functional.
*   **API Standardization**: All backend endpoints follow a strict response envelope: `{ success: boolean, message: string, data: any, errors: array }`. This simplifies frontend error handling and ensures predictable data structures.

### 3. Advanced Server-State Management
Migration from React Context to **TanStack Query** drastically reduced boilerplate and improved perceived performance.
*   **Caching**: Automatic background refetching keeps data fresh.
*   **Optimistic Updates**: UI updates instantly on user actions (mark complete, update stage) before the server confirms, with automatic rollback on failure.

### 4. Interactive API Documentation
Integrated **Swagger (OpenAPI 3.0)** to provide living documentation. This allows frontend developers to test endpoints, view schema requirements, and understand authentication flows without diving into backend code.

---

## 🔐 Access Control Matrix

| Feature | Sales Rep | Manager | Admin |
| :--- | :---: | :---: | :---: |
| **Leads Pipeline** | Own only | All | View Only |
| **Task Management** | Personal | Team | View Only |
| **Manager Reports** | ❌ | ✅ | ❌ |
| **Lead Deletion** | ❌ | ✅ | ❌ |
| **System Audit** | ❌ | ❌ | ✅ |

---

## 📂 Project Structure

```text
LeadLinkCRM/
├── src/                    # Frontend React SPA
│   ├── api/                # TanStack Query hooks & API abstractions
│   ├── components/         # Reusable UI & Layout components
│   ├── contexts/           # Global state (Auth, UI)
│   └── utils/              # Client utilities (Resilience, Formatters)
├── server/                 # Backend Node.js API
│   ├── config/             # Swagger & System configs
│   ├── controllers/        # Business logic handlers
│   ├── prisma/             # Schema & SQL migrations
│   └── routes/             # API Endpoints (Swagger-annotated)
└── package.json            # Root scripts & dependencies
```

---

## 🧪 Development Workflow

### Database Migrations
We enforce version-controlled schema evolution:
1. Modify `server/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <description>`
3. This generates a versioned SQL file and updates the type-safe client.

### Environment Setup
Create a `.env` file in the `server/` directory:
```env
PORT=5000
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
FRONTEND_URL="http://localhost:5173"
```

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ for High-Performance Sales Teams.*
