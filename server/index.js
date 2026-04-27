import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import { Strategy as SteamStrategy } from 'passport-steam';

// Routes
import steamRoutes from './routes/steam.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();

// 1. TRUST PROXY (Crucial for Render/Heroku auth to work)
app.set('trust proxy', 1);

// 2. DYNAMIC CORS (Allows local dev and production Vercel)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// 3. SESSION SETUP
app.use(session({
  secret: process.env.SESSION_SECRET || 'backlog_roulette_secret',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production', // Only sends over HTTPS in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// 4. PASSPORT INITIALIZATION
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new SteamStrategy({
    returnURL: `${process.env.BASE_URL}/api/auth/steam/return`,
    realm: `${process.env.BASE_URL}/`,
    apiKey: process.env.STEAM_API_KEY
  },
  (identifier, profile, done) => {
    // This profile object contains the steamId
    return done(null, profile);
  }
));

// 5. ROUTES
app.use('/api/steam', steamRoutes);
app.use('/api/auth', authRoutes);

// 6. DB CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
});