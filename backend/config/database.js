

const mongoose = require('mongoose');
const { MONGODB_URI } = require('./index');

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    process.exit(1);
  }
}
const userSchema = new mongoose.Schema({
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  name:      { type: String, required: true },
  plan:      { type: String, default: 'free' },
  createdAt: { type: Number, default: Date.now },
});
const urlSchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  longUrl:   { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  title:     { type: String },
  clicks:    { type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },
  expiresAt: { type: Number, default: null },
  createdAt: { type: Number, default: Date.now },
});

urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

const clickSchema = new mongoose.Schema({
  urlId:     { type: String, required: true },
  shortCode: { type: String, required: true },
  timestamp: { type: Number, default: Date.now },
  country:   { type: String },
  device:    { type: String },
  referrer:  { type: String },
});

const counterSchema = new mongoose.Schema({
  id:    { type: String, required: true, unique: true },
  value: { type: Number, required: true },
});

const User    = mongoose.model('User',    userSchema);
const Url     = mongoose.model('Url',     urlSchema);
const Click   = mongoose.model('Click',   clickSchema);
const Counter = mongoose.model('Counter', counterSchema);

module.exports = { connectDB, User, Url, Click, Counter };