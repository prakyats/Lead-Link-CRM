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

# Step 1: Generate the Prisma Client
npx prisma generate

# Step 2: Run database migrations
npx prisma migrate dev
```

### 5. Seed Database

```bash
# Seed (creates default users + sample data)
node prisma/seed.js
```

### 6. Start the Application

**Option A: Quick Start (recommended)**

```bash
# From the project root:
.\start.bat
```

**Option B: Manual start**

```bash
# Terminal 1 - Backend (from project root)
npm run dev:api

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
├── server/                 # Backend Express application
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth middleware
│   ├── prisma/             # Database schema + versioned migrations
│   │   ├── schema.prisma   # Source of truth for data models
│   │   └── migrations/     # SQL migration history (version controlled)
│   ├── routes/             # API routes
│   └── utils/              # Server utilities
├── start.bat               # Quick start script (Windows)
└── README.md
```

## Database Management

- **Version Controlled**: This project uses Prisma Migrate for version-controlled schema evolution.
- **Migration History**: All database changes must go through migration files stored in `prisma/migrations/`. 
- **No Manual Sync**: Direct schema syncing (`db push`) is strictly prohibited to ensure environment consistency across the team.
- **Data Transformations**: Any required data mapping or transformations are performed via scripts (e.g., `map-stages.js`) prior to schema migrations.
- **Developer Workflow**:
  1. Modify `schema.prisma`
  2. Run `npx prisma migrate dev --name your_description`
  3. Commit the generated migration files.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

MIT
