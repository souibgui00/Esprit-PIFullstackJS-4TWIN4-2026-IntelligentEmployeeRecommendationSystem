const mongoose = require('mongoose');
const { Types } = mongoose;
(async () => {
  await mongoose.connect('mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/?appName=PI');
  const db = mongoose.connection.db;
  const currentUserId = "69cfa92c15aaf";
  
  const user = await db.collection('users').findOne({ _id: new Types.ObjectId(currentUserId) });
  if(!user) {
    const user2 = await db.collection('users').findOne({ _id: currentUserId });
    console.log("User by string:", JSON.stringify(user2, null, 2));
  } else {
    console.log("User by ObjectId:", JSON.stringify(user, null, 2));
  }

  const reports = await db.collection('users').find({ manager_id: new Types.ObjectId(currentUserId) }).toArray();
  console.log("Reports for this manager:", reports.length);

  process.exit(0);
})();
