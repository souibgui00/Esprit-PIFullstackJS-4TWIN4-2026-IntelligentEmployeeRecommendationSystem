require('dotenv').config();
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
console.log('Testing connection to:', uri.replace(/:[^:]*@/, ':****@')); // Hide password
async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('SUCCESS! MongoDB connected.');
    const db = client.db('test');
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
  } catch (err) {
    console.error('FAIL:', err);
  } finally {
    await client.close();
  }
}
run();
