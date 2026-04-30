const mongoose = require('mongoose');
const fs = require('node:fs');

async function getSampleData() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
  if (!uri.includes('mongodb://')) {
    throw new Error('MONGODB_URI environment variable not set or invalid');
  }
  
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas');

    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name).filter(n => !n.startsWith('system.'));

    const samples = {};

    for (const collectionName of collectionNames) {
      if (['users', 'skills', 'activities', 'departments', 'participations', 'evaluations'].includes(collectionName)) {
        const sample = await mongoose.connection.db.collection(collectionName).findOne({});
        samples[collectionName] = sample;
      }
    }

    fs.writeFileSync('sample_data.json', JSON.stringify(samples, null, 2));
    console.log('Wrote to sample_data.json');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

getSampleData();
