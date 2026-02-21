# Manual Setup Instructions for OLAS

## Step 1: Install Backend Dependencies

Open a terminal and run:

```bash
cd server
npm install express @prisma/client@5.22.0 bcryptjs jsonwebtoken cors dotenv socket.io express-validator
npm install -D nodemon prisma@5.22.0
```

## Step 2: Generate Prisma Client

```bash
cd server
npx prisma generate
```

## Step 3: Push Schema to Supabase

```bash
cd server
npx prisma db push
```

This will create all the tables in your Supabase database.

## Step 4: Seed the Database

```bash
cd server
npm run seed
```

## Step 5: Install Frontend Dependencies

```bash
cd client
npm install react react-dom react-router-dom axios socket.io-client @monaco-editor/react react-hot-toast
npm install -D @vitejs/plugin-react vite tailwindcss postcss autoprefixer
```

## Step 6: Start the Servers

Open two separate terminals:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

## Step 7: Access the Application

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Login Credentials

After seeding:
- **Admin**: admin@olas.com / admin123
- **Faculty**: faculty@olas.com / faculty123
- **Student**: student@olas.com / student123

## Troubleshooting

### If Prisma commands fail:
1. Delete `node_modules` and `package-lock.json` in server folder
2. Run `npm install` again
3. Try `npx prisma generate` again

### If database connection fails:
- Check your `.env` file has the correct DATABASE_URL
- Ensure your Supabase project is active
- Try the connection string in a database client first

### If frontend won't start:
1. Delete `node_modules` in client folder
2. Run `npm install` again
3. Run `npm run dev`

## Current Configuration

Your `.env` file is already configured with:
- DATABASE_URL: Connected to your Supabase PostgreSQL
- JWT_SECRET: Configured
- CLIENT_URL: http://localhost:5173
- PORT: 5000

All code files are ready - you just need to install dependencies and run the Prisma migrations!
