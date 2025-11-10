# Database Setup Guide

This guide will help you set up PostgreSQL for the Coding Hours Forecaster application.

## Prerequisites

- PostgreSQL installed on your system
- Node.js and npm installed

## Option 1: Local PostgreSQL Setup

### 1. Install PostgreSQL

**Windows:**
- Download from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
- Or use Chocolatey: `choco install postgresql`

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

Open PostgreSQL command line (psql) and run:

```sql
CREATE DATABASE coding_hours_db;
```

Or from terminal:
```bash
createdb coding_hours_db
```

### 3. Create .env File

Create a `.env` file in the `backend` directory:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/coding_hours_db
JWT_SECRET=your_secret_key_here
PORT=4000
```

**Replace:**
- `postgres` with your PostgreSQL username (default is usually `postgres`)
- `your_password` with your PostgreSQL password
- `your_secret_key_here` with a secure random string (for production)

### 4. Run Setup Script

```bash
cd backend
npm run setup-db
```

This will create all necessary tables and indexes.

## Option 2: Cloud Database (Recommended for Easy Setup)

### Using Supabase (Free Tier Available)

1. Go to [Supabase](https://supabase.com) and create a free account
2. Create a new project
3. Go to Project Settings → Database
4. Copy the connection string (URI format)
5. Add it to your `.env` file as `DATABASE_URL`

### Using Neon (Free Tier Available)

1. Go to [Neon](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string
4. Add it to your `.env` file as `DATABASE_URL`

### Using Railway

1. Go to [Railway](https://railway.app) and create an account
2. Create a new PostgreSQL database
3. Copy the connection string from the Variables tab
4. Add it to your `.env` file as `DATABASE_URL`

## Manual Setup (Alternative)

If you prefer to set up manually, you can run the SQL schema directly:

```bash
psql -U postgres -d coding_hours_db -f schema.sql
```

Or copy the contents of `schema.sql` and run it in your PostgreSQL client.

## Verify Setup

After running the setup script, you should see:
- ✅ Connected to database
- ✅ Database schema created successfully!
- ✅ Verified: users and logs tables exist

## Troubleshooting

### Connection Refused
- Make sure PostgreSQL is running
- Check that the port (default 5432) is correct
- Verify your DATABASE_URL format

### Authentication Failed
- Check your username and password in DATABASE_URL
- For local PostgreSQL, you may need to set a password:
  ```sql
  ALTER USER postgres PASSWORD 'your_password';
  ```

### Database Does Not Exist
- Create the database first: `createdb coding_hours_db`
- Or use: `CREATE DATABASE coding_hours_db;` in psql

## Environment Variables

Create a `.env` file in the `backend` directory with:

```env
# Required
DATABASE_URL=postgresql://username:password@host:port/database

# Optional (has defaults)
JWT_SECRET=dev_secret_change_me_in_production
PORT=4000
FRONTEND_URL=http://localhost:5173
```

## Next Steps

Once the database is set up:
1. Start the backend server: `npm run dev`
2. The server should connect to the database without warnings
3. You can now register users and create logs!



