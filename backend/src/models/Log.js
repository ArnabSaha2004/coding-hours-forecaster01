import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  hours: { type: Number, required: true },
  project: { type: String, default: 'General' },
  notes: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

LogSchema.index({ user_id: 1, date: -1 });

export default mongoose.models.Log || mongoose.model('Log', LogSchema);
