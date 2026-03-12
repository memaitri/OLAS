# OLAS - Online Learning & Assessment System

A full-stack proctored examination platform with integrated IDE, role-based access control, and real-time monitoring.

## Features

- **Role-Based Access Control**: Admin, Faculty, and Student roles
- **Full Proctoring System**: Real-time violation detection and monitoring
- **Integrated IDE**: Multi-language code execution (C, C++, Java, Python, JavaScript)
- **Live Monitoring**: Faculty can monitor students in real-time during exams
- **Violation Management**: Automatic blocking on violation threshold
- **Secure Execution**: Sandboxed code execution with timeouts

## Tech Stack

### Backend
- Node.js + Express.js
- MySQL + Prisma ORM
- JWT Authentication
- Socket.IO for real-time features
- child_process for code execution

### Frontend
- React + Vite
- Tailwind CSS
- Monaco Editor
- Axios
- React Router

## Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Windows/macOS/Linux
- npm

## Setup Instructions

### 1. Clone and Install

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Setup MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE olas;
EXIT;
```

### 3. Configure Environment

Create `server/.env` file:

```env
PORT=5000
DATABASE_URL="mysql://root:your_password@localhost:3306/olas"
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 4. Setup Database Schema

```bash
cd server
npm run prisma:generate
npm run prisma:push
```

### 5. Seed Database

```bash
npm run seed
```

This creates:
- Admin: admin@olas.com / admin123
- Faculty: faculty@olas.com / faculty123
- Student: student@olas.com / student123

### 6. Run Application

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 7. Access Application

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Quick Setup (Automated)

For faster setup, use the migration scripts:

**Windows:**
```bash
cd server
migrate-to-mysql.bat
```

**macOS/Linux:**
```bash
cd server
chmod +x migrate-to-mysql.sh
./migrate-to-mysql.sh
```

## Default Credentials

- **Admin**: admin@olas.com / admin123
- **Faculty**: faculty@olas.com / faculty123
- **Student**: student@olas.com / student123

## Documentation

- **MySQL Setup Guide**: See [MYSQL_SETUP.md](MYSQL_SETUP.md)
- **Quick Start**: See [QUICK_START_MYSQL.md](QUICK_START_MYSQL.md)
- **Migration Details**: See [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)

## Project Structure

```
olas/
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── sockets/
│   ├── sandbox/
│   ├── utils/
│   └── server.js
├── client/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   └── main.jsx
│   └── index.html
└── README.md
```

## Security Notes

- Code execution is sandboxed with 5-second timeout
- JWT tokens expire after 24 hours
- Role-based middleware protects all routes
- Violation tracking prevents cheating
- Process isolation for code execution

## Development

```bash
# Backend dev mode with nodemon
cd server
npm run dev

# Frontend dev mode with Vite
cd client
npm run dev

# Build frontend for production
cd client
npm run build
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally or update MONGODB_URI in .env
- For MongoDB Atlas, use connection string with credentials

### Code Execution Issues
- Ensure compilers are installed (gcc, g++, javac, python, node)
- Add compiler paths to Windows PATH environment variable

### Port Conflicts
- Change PORT in server/.env if 5000 is occupied
- Update CLIENT_URL accordingly

## License

MIT License - Educational Project
