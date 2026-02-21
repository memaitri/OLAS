# Supabase Setup Instructions

## 1. Get Your Supabase Connection String

1. Go to your Supabase project dashboard
2. Click on "Project Settings" (gear icon)
3. Go to "Database" section
4. Find "Connection string" and select "URI" mode
5. Copy the connection string (it looks like this):

```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

## 2. Update server/.env File

Replace the DATABASE_URL in `server/.env` with your Supabase connection string:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

## 3. Run Prisma Commands

```bash
cd server

# Install dependencies (if not done)
npm install

# Generate Prisma Client
npm run prisma:generate

# Push schema to Supabase
npm run prisma:push

# Seed the database
npm run seed
```

## 4. Start the Application

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

## Connection String Format

The Supabase DATABASE_URL should follow this format:

```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
```

Or the direct connection:

```
postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
```

## Troubleshooting

- Make sure to replace `[YOUR-PASSWORD]` with your actual database password
- Make sure to replace `[YOUR-PROJECT-REF]` with your project reference
- If connection fails, try using the "Transaction" pooler connection string instead
- Ensure your IP is whitelisted in Supabase (or disable IP restrictions for development)
