# 🚀 Quick Start - MySQL Setup

## 1-Minute Setup (Windows)

```bash
cd server
migrate-to-mysql.bat
```

Follow the prompts, then:
```bash
npm run dev
```

---

## 1-Minute Setup (macOS/Linux)

```bash
cd server
chmod +x migrate-to-mysql.sh
./migrate-to-mysql.sh
```

Follow the prompts, then:
```bash
npm run dev
```

---

## Manual Setup (5 minutes)

### Step 1: Install MySQL
- **Windows**: [Download MySQL](https://dev.mysql.com/downloads/mysql/)
- **macOS**: `brew install mysql && brew services start mysql`
- **Linux**: `sudo apt install mysql-server && sudo systemctl start mysql`

### Step 2: Create Database
```bash
mysql -u root -p
```
```sql
CREATE DATABASE olas;
EXIT;
```

### Step 3: Configure
Edit `server/.env`:
```env
DATABASE_URL="mysql://root:your_password@localhost:3306/olas"
```

### Step 4: Setup & Run
```bash
cd server
npm install
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```

### Step 5: Start Frontend
```bash
cd client
npm install
npm run dev
```

---

## Default Login Credentials

After seeding:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@olas.com | admin123 |
| Faculty | faculty@olas.com | faculty123 |
| Student | student@olas.com | student123 |

---

## URLs

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **API**: http://localhost:5000/api

---

## Common Issues

### "Access denied for user 'root'"
```bash
mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### "Unknown database 'olas'"
```bash
mysql -u root -p -e "CREATE DATABASE olas;"
```

### "Cannot find module '@prisma/client'"
```bash
cd server
npm run prisma:generate
```

### Port already in use
```bash
# Change PORT in server/.env
PORT=5001
```

---

## Verify Installation

```bash
# Check MySQL is running
mysql -u root -p -e "SELECT VERSION();"

# Check database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'olas';"

# Check tables created
mysql -u root -p olas -e "SHOW TABLES;"

# Should show:
# Class
# Exam
# StudentExamSession
# Submission
# User
# Violation
# _StudentClasses
```

---

## Next Steps

1. ✅ Login as admin: http://localhost:5173
2. ✅ Create a class
3. ✅ Create an exam
4. ✅ Enroll students
5. ✅ Take exam as student
6. ✅ Monitor as faculty

---

## Need Help?

- **Full Guide**: See `MYSQL_SETUP.md`
- **Migration Details**: See `MIGRATION_SUMMARY.md`
- **Comparison**: See `DATABASE_COMPARISON.md`

---

## One-Liner (If MySQL Already Installed)

```bash
cd server && npm i && npm run prisma:generate && npm run prisma:push && npm run seed && npm run dev
```

🎉 **Done!** Your OLAS system is running on MySQL.
