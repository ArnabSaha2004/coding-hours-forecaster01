# MongoDB Troubleshooting Guide

## Quick Fix for "Invalid Credentials" and "Data Not Stored"

### Problem
- Getting "Invalid credentials" error
- Data not being stored in MongoDB
- Registration/login not working

### Solution

**The issue is that MongoDB is not running or not connected.**

## Step 1: Check if MongoDB is Running

**Windows:**
```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# If not running, start it:
net start MongoDB
```

**macOS:**
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start MongoDB
brew services start mongodb-community
```

**Linux:**
```bash
# Check status
sudo systemctl status mongodb

# Start MongoDB
sudo systemctl start mongodb
```

## Step 2: Use MongoDB Atlas (Easiest Solution)

If you don't have MongoDB installed locally, use the free cloud version:

1. **Go to MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
2. **Create a free account**
3. **Create a new cluster** (free tier)
4. **Click "Connect" → "Connect your application"**
5. **Copy the connection string**
6. **Update `backend/.env`**:
   ```env
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/coding_hours_db?retryWrites=true&w=majority
   ```
   Replace `username` and `password` with your Atlas credentials

## Step 3: Restart Backend Server

After updating `.env`:

```bash
cd backend
npm run dev
```

You should see:
```
✅ Connected to MongoDB
✅ API listening on http://0.0.0.0:4000
```

## Step 4: Test Registration

1. Go to login page
2. Click "Register" tab
3. Enter email and password (min 8 chars)
4. Click "Create Account"

If successful, you'll be redirected to dashboard.

## Common Errors

### "Database connection error"
- MongoDB is not running
- DATABASE_URL is incorrect
- MongoDB service needs to be started

### "Invalid credentials"
- User doesn't exist (register first)
- Wrong password
- MongoDB not connected (data wasn't saved)

### "User exists"
- Email already registered
- Try logging in instead

## Verify MongoDB Connection

Test the connection:
```bash
cd backend
npm run setup-db
```

If successful, you'll see:
```
✅ Connected to MongoDB
✅ Indexes created
🎉 Database setup complete!
```

## Still Having Issues?

1. **Check backend console** - Look for MongoDB connection errors
2. **Verify DATABASE_URL** in `backend/.env`
3. **Check MongoDB logs** (if running locally)
4. **Try MongoDB Atlas** (cloud) - it's easier and free

