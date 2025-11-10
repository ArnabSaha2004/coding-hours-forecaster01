// Database setup script
// This script will create the database tables if they don't exist
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Log from './src/models/Log.js';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/coding_hours_db';

async function setupDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(DATABASE_URL);
    console.log('✅ Connected to MongoDB');

    console.log('🚀 Ensuring indexes...');
    await User.init();
    await Log.init();
    console.log('✅ Indexes created');

    console.log('\n🎉 Database setup complete!');
    console.log('You can now start the server with: npm run dev');
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure MongoDB is running and DATABASE_URL is correct');
    }
    process.exit(1);
  } finally {
    try { await mongoose.disconnect(); } catch (_) {}
  }
}

setupDatabase();



