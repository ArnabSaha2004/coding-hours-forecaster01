# Database URL Setup Guide

## Quick Setup

Your backend uses **MongoDB**. Add your database URL to the `.env` file in the `backend` directory.

## Option 1: Local MongoDB (Default)

If you have MongoDB installed locally:

```env
DATABASE_URL=mongodb://localhost:27017/coding_hours_db
```

### Installing MongoDB Locally

**Windows:**
- Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
- Or use Chocolatey: `choco install mongodb`
- Start MongoDB service: `net start MongoDB`

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

## Option 2: MongoDB Atlas (Cloud - Recommended for Easy Setup)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account
2. Create a new cluster (free tier available)
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Add to `.env`:
   ```env
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/coding_hours_db?retryWrites=true&w=majority
   ```

## Option 3: MongoDB with Authentication

If your local MongoDB has authentication enabled:

```env
DATABASE_URL=mongodb://username:password@localhost:27017/coding_hours_db
```

## Update Your .env File

1. Open `backend/.env`
2. Set the `DATABASE_URL`:
   ```env
   DATABASE_URL=mongodb://localhost:27017/coding_hours_db
   ```
3. Save the file

## Verify Connection

After setting the DATABASE_URL, run:

```bash
cd backend
npm run setup-db
```

This will:
- Connect to your database
- Create necessary collections and indexes
- Verify the setup

Then start your server:

```bash
npm run dev
```

You should see: `✅ Connected to MongoDB`

## Troubleshooting

### "Connection refused"
- Make sure MongoDB is running
- Check the port (default is 27017)
- Verify your DATABASE_URL format

### "Authentication failed"
- Check username and password in connection string
- For MongoDB Atlas, ensure your IP is whitelisted in Network Access

### "Database does not exist"
- MongoDB will create the database automatically on first use
- No need to create it manually

