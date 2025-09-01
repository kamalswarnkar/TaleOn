import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Debug: Check what environment variables are loaded
    console.log('🔍 Environment Variables Debug:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Found' : '❌ Missing');
    console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('MONGO')));
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set. Please check your .env file.');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
