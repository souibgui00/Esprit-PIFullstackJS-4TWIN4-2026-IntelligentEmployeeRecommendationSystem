const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb://admin:2n7jqWHfqZKFzFfC@cluster0.a5tff.mongodb.net/hr-activity?retryWrites=true&w=majority';

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection;
  
  console.log('=== Checking for admin/HR users ===');
  const admins = await db.collection('users').find({ role: { $in: ['ADMIN', 'HR', 'admin', 'hr'] } }).toArray();
  
  if (admins.length === 0) {
    console.log('❌ NO ADMIN/HR USERS FOUND!');
  } else {
    console.log(`✓ Found ${admins.length} admin/HR users:`);
    admins.forEach(u => {
      console.log(`  - Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
    });
  }

  console.log('\n=== All users (for reference) ===');
  const allUsers = await db.collection('users').find({}).toArray();
  console.log(`Total users in database: ${allUsers.length}`);
  allUsers.forEach(u => {
    console.log(`  - Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
  });

  process.exit(0);
}).catch(e => {
  console.error('Connection error:', e.message);
  process.exit(1);
});
