# MySQL Setup Guide

## Migration Complete: Supabase → MySQL ✅

All Supabase references have been removed. The system now uses MySQL with Prisma ORM.

---

## Prerequisites

1. **Install MySQL Server**
   - Windows: Download from [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
   - macOS: `brew install mysql`
   - Linux: `sudo apt-get install mysql-server`

2. **Start MySQL Service**
   - Windows: MySQL service should auto-start
   - macOS: `brew services start mysql`
   - Linux: `sudo systemctl start mysql`

---

## Step 1: Create Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE olas;

# Create user (optional, for better security)
CREATE USER 'olas_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON olas.* TO 'olas_user'@'localhost';
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

---

## Step 2: Configure Environment

Update `server/.env` with your MySQL connection:

```env
PORT=5000
DATABASE_URL="mysql://root:password@localhost:3306/olas"
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_olas_2024
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Connection String Format:
```
mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

Examples:
- Local root: `mysql://root:password@localhost:3306/olas`
- Custom user: `mysql://olas_user:your_secure_password@localhost:3306/olas`
- Remote: `mysql://user:pass@192.168.1.100:3306/olas`

---

## Step 3: Install Dependencies & Setup Database

```bash
cd server

# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Push schema to MySQL (creates all tables)
npm run prisma:push

# Seed database with initial data
npm run seed
```

---

## Step 4: Verify Setup

```bash
# Check tables were created
mysql -u root -p olas -e "SHOW TABLES;"

# Should show:
# +---------------------------+
# | Tables_in_olas            |
# +---------------------------+
# | Class                     |
# | Exam                      |
# | StudentExamSession        |
# | Submission                |
# | User                      |
# | Violation                 |
# | _StudentClasses           |
# | _prisma_migrations        |
# +---------------------------+
```

---

## Step 5: Start the Application

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

---

## Database Schema (MySQL)

The exact schema from your Supabase setup has been preserved:

### Tables:
- **User** - Students, faculty, and admins
- **Class** - Course classes
- **Exam** - Exams with questions and settings
- **StudentExamSession** - Active exam sessions
- **Submission** - Code submissions per question
- **Violation** - Proctoring violations
- **_StudentClasses** - Many-to-many relation (students ↔ classes)

### All Features Preserved:
✅ User authentication & roles
✅ Class management
✅ Exam creation & monitoring
✅ Code execution & submissions
✅ Proctoring system with violations
✅ Real-time monitoring via Socket.IO
✅ Automatic session blocking on max violations

---

## Troubleshooting

### Connection Error: "Access denied for user"
```bash
# Reset MySQL root password
mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### Error: "Unknown database 'olas'"
```bash
mysql -u root -p -e "CREATE DATABASE olas;"
```

### Port 3306 already in use
```bash
# Check what's using the port
netstat -ano | findstr :3306  # Windows
lsof -i :3306                 # macOS/Linux

# Stop MySQL and restart
# Windows: Services → MySQL → Restart
# macOS: brew services restart mysql
# Linux: sudo systemctl restart mysql
```

### Prisma Client errors
```bash
cd server
rm -rf node_modules/.prisma
npm run prisma:generate
```

---

## Default Credentials (After Seeding)

### Admin
- Email: `admin@olas.com`
- Password: `admin123`

### Faculty
- Email: `faculty@olas.com`
- Password: `faculty123`

### Student
- Email: `student@olas.com`
- Password: `student123`

---

## Useful Commands

```bash
# View Prisma schema
cat server/prisma/schema.prisma

# Open Prisma Studio (GUI for database)
cd server
npm run prisma:studio

# Reset database (WARNING: Deletes all data)
cd server
npx prisma migrate reset

# View MySQL logs
# Windows: Check MySQL data directory
# macOS: tail -f /usr/local/var/mysql/*.err
# Linux: sudo tail -f /var/log/mysql/error.log
```

---

## Production Deployment

For production, use a managed MySQL service:

1. **AWS RDS MySQL**
   ```
   mysql://admin:password@olas-db.xxxxx.us-east-1.rds.amazonaws.com:3306/olas
   ```

2. **Google Cloud SQL**
   ```
   mysql://root:password@/olas?unix_socket=/cloudsql/project:region:instance
   ```

3. **DigitalOcean Managed Database**
   ```
   mysql://user:password@db-mysql-nyc1-12345.ondigitalocean.com:25060/olas?ssl-mode=REQUIRED
   ```

4. **PlanetScale** (MySQL-compatible, serverless)
   ```
   mysql://user:password@aws.connect.psdb.cloud/olas?sslaccept=strict
   ```

---

## Migration Complete ✅

- ❌ Supabase removed
- ❌ PostgreSQL removed
- ✅ MySQL configured
- ✅ All functionality preserved
- ✅ Schema matches exactly
- ✅ Violations, sessions, and monitoring intact
