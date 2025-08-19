import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js'; // ✅
import gameRoutes from './routes/gameRoutes.js'; // ✅
import morgan from 'morgan';

dotenv.config();

const app = express();

app.use(cors({
  // origin: ['http://localhost:5173'], // tighten later
  origin: '*',
}));
app.use(express.json());
app.use(morgan('dev'));

app.use('/auth', authRoutes);
app.use('/room', roomRoutes); // ✅
app.use('/game', gameRoutes); // ✅

app.get('/', (_req, res) => {
  res.send('TaleOn Backend is running 🚀');
});

export default app;
