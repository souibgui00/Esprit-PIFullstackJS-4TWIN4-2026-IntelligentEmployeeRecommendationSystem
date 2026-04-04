const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017/project28'; // Ensure the db name is correct
async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    // In NestJS Mongoose usually uses the URI db name. If not, it uses 'test'
    // Let's check 'project28' first
    let db = client.db('project28');
    let parts = await db.collection('participations').find().toArray();
    let acts = await db.collection('activities').find().toArray();
    
    // If empty, try 'test'
    if (parts.length === 0 && acts.length === 0) {
      db = client.db('test');
      parts = await db.collection('participations').find().toArray();
      acts = await db.collection('activities').find().toArray();
    }

    console.log('PARTICIPATIONS COUNT:', parts.length);
    if (parts.length > 0) console.log('Sample Participation:', parts[parts.length - 1]);
    
    const actsWithEnrollments = acts.filter(a => a.enrolledCount > 0);
    console.log('ACTIVITIES WITH ENROLLED COUNT > 0:', actsWithEnrollments.map(a => ({ id: a._id, count: a.enrolledCount })));
  } finally {
    await client.close();
  }
}
run();
