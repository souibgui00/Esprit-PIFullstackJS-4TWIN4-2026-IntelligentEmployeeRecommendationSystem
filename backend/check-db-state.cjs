const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/project28';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Check all recommendation assignments
    const assignments = await db.collection('assignments')
      .find({ type: 'recommendation' })
      .toArray();
    
    console.log('\n📊 Recommendation assignments count:', assignments.length);
    
    if (assignments.length > 0) {
      console.log('\n📋 Sample assignment:');
      const sample = assignments[0];
      console.log('  - userId:', sample.userId);
      console.log('  - activityId:', sample.activityId);
      console.log('  - managerId:', sample.managerId);
      console.log('  - metadata:', sample.metadata);
      console.log('  - recommendedBy:', sample.recommendedBy);
    }
    
    // Check notifications for recommendations_received
    const notifs = await db.collection('notifications')
      .find({ type: 'recommendations_received' })
      .toArray();
    
    console.log('\n📬 Recommendations_received notifications:', notifs.length);
    if (notifs.length > 0) {
      console.log('  Sample:', { title: notifs[0].title, candidateCount: notifs[0].metadata?.candidateIds?.length });
    }
    
  } finally {
    await client.close();
  }
}

main().catch(console.error);
