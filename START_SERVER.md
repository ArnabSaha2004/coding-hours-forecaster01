# How to Start the Backend Server

## Quick Start

1. **Open a new terminal/command prompt**

2. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

4. **You should see:**
   ```
   ✅ API listening on http://0.0.0.0:4000
   ✅ Server is ready to accept requests
   ✅ Connected to MongoDB (if MongoDB is running)
   ```

## If You See MongoDB Connection Errors

The server will still start even if MongoDB isn't running, but database operations won't work.

### Option 1: Install and Start MongoDB

**Windows:**
- Download from: https://www.mongodb.com/try/download/community
- Install and start the MongoDB service

**Or use MongoDB Atlas (Cloud - Free):**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster
4. Get connection string
5. Update `backend/.env`:
   ```
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/coding_hours_db
   ```

## Running Both Frontend and Backend

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Or from the root directory:
```bash
npm run dev
```

## Verify Server is Running

Visit: http://localhost:4000/health

You should see: `{"status":"ok"}`

