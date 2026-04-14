const mongoose = require('mongoose');
const fs = require('fs');

async function getSampleData() {
  const uri = 'mongodb://sarra_mrabet:sarra@ac-skuyy89-shard-00-00.thpvndq.mongodb.net:27017,ac-skuyy89-shard-00-01.thpvndq.mongodb.net:27017,ac-skuyy89-shard-00-02.thpvndq.mongodb.net:27017/test?authSource=admin&replicaSet=atlas-cr5hej-shard-0&tls=true&retryWrites=true&w=majority';
  
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
