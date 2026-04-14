const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/?appName=PI';
async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const dbTest = client.db('test');
    
    // Check activities
    const acts = await dbTest.collection('activities').find().toArray();
    console.log('ALL ACTIVITIES:');
    acts.forEach(a => {
        console.log(`Activity [${a._id.toString()}] ${a.title} - enrolledCount: ${a.enrolledCount}`);
    });
    
    // Check participations
    const parts = await dbTest.collection('participations').find().toArray();
    console.log('\nALL PARTICIPATIONS:');
    parts.forEach(p => {
        console.log(`Participation [${p._id.toString()}] - User: ${p.userId?.toString()} - Activity: ${p.activityId?.toString()}`);
    });
  } finally {
    await client.close();
  }
}
run();
