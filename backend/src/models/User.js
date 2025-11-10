import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  reset_token: { type: String, default: null },
  reset_token_expiry: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
