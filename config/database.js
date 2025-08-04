const mongoose = require('mongoose');

/**
 * MongoDB connection configuration
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/profile-collection';
    
    console.log('🔗 Attempting to connect to MongoDB...');
    console.log('📍 Database:', mongoURI.includes('mongodb.net') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB');
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database name:', mongoose.connection.db.databaseName);
    console.log('🌍 Host:', mongoose.connection.host);
    
    // Test database write permissions
    const testCollection = mongoose.connection.db.collection('connection_test');
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    await testCollection.deleteOne({ test: true });
    console.log('✅ Database write permissions verified');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
