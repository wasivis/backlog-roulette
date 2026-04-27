import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  steamId: { type: String, required: true, unique: true },
  displayName: String,
  avatar: String,
  games: { type: Array, default: [] }
});

export default mongoose.model('User', UserSchema);