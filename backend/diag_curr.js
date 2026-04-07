const mongoose = require('mongoose');
const { Types } = mongoose;
(async () => {
  await mongoose.connect('mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/?appName=PI');
  const db = mongoose.connection.db;
  const activityId = "69d1358ee78b2781b1104421";
  
  const parts = await db.collection('participations').find({ activityId: new Types.ObjectId(activityId) }).toArray();
  console.log("Participations for activity:", JSON.stringify(parts, null, 2));

  for(const p of parts) {
    const user = await db.collection('users').findOne({ _id: p.userId });
    console.log(`User ${p.userId}: manager_id=${user?.manager_id}, dept_id=${user?.department_id}`);
  }
  
  const depts = await db.collection('departments').find().toArray();
  console.log("All Departments:", JSON.stringify(depts, null, 2));

  process.exit(0);
})();
