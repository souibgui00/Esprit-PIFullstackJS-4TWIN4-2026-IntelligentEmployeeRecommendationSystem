const mongoose = require('mongoose');
const { Types } = mongoose;
(async () => {
  await mongoose.connect('mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/?appName=PI');
  const db = mongoose.connection.db;
  
  const allUsers = await db.collection('users').find().toArray();
  console.log("All Users IDs:", allUsers.map(u => ({ id: u._id.toString(), email: u.email, role: u.role })));

  const parts = await db.collection('participations').find({ status: 'awaiting_manager' }).toArray();
  console.log("Awaiting Manager Participations:", JSON.stringify(parts, null, 2));

  process.exit(0);
})();
