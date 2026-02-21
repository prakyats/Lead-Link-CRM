# Lead Link CRM

A full-stack CRM application built with React, Node.js, Express, and PostgreSQL.

## Tech Stack

| Layer      | Technology                             |
|------------|----------------------------------------|
| Frontend   | React 19, Vite, Tailwind CSS v4, React Router |
| Backend    | Node.js, Express, Prisma ORM           |
| Database   | PostgreSQL                             |
| Auth       | JWT (JSON Web Tokens), bcrypt          |

## Getting Started

### Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org))
- **PostgreSQL** database ([download](https://www.postgresql.org/download/))
- **Git**

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd "Lead Link CRM"
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Configure Environment

Create `server/.env` (copy from the example):

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your values:

```env
PORT=3001
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/lead_link_crm"
JWT_SECRET=your_super_secret_jwt_key_here
```

### 4. Set Up the Database

```bash
cd server
npx prisma generate
npx prisma db push
```

Seed the database with initial users:

```bash
# Run the seed script (if available)
node prisma/seed.js
```

### 5. Start the Application

**Option A: Quick Start (recommended)**

```bash
# From the project root:
.\start.bat
```

**Option B: Manual start**

```bash
# Terminal 1 - Backend
cd server
node server.js

# Terminal 2 - Frontend
npm run dev
```

Visit **http://localhost:5173**

### Default Login Credentials

| Role    | Email              |  Password  |
|---------|--------------------|------------|
| Admin   | admin@crm.com      |  admin123  |
| Manager | manager@crm.com    | manager123 |
| Sales   | sales@crm.com      |  sales123  |

## Role-Based Access Control

| Feature           | Admin | Manager | Sales |
|-------------------|:-----:|:-------:|:-----:|
| View Dashboard    | ✅    | ✅      | ✅    |
| Manage Leads      | ✅    | ✅      | ✅    |
| View Reports      | ✅    | ✅      | ❌    |
| System Settings   | ✅    | ❌      | ❌    |
| Create Leads      | ❌    | ❌      | ✅    |

## Project Structure

```
Lead Link CRM/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React Context providers (Auth, Leads, Tasks)
│   ├── pages/              # Page components (Dashboard, Leads, etc.)
│   └── utils/              # Helper utilities (roles, permissions, api)
├── server/                 # Backend Express application
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth middleware
│   ├── routes/             # API routes
│   ├── prisma/             # Database schema
│   └── utils/              # Server utilities
├── start.bat               # Quick start script (Windows)
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

MIT
