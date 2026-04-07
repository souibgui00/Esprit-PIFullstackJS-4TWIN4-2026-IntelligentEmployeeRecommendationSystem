const mongoose = require('mongoose');
const { Types } = mongoose;
(async () => {
  await mongoose.connect('mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/?appName=PI');
  const db = mongoose.connection.db;
  const activityId = "69d1358ee78b2781b1104421";
  
  const activity = await db.collection('activities').findOne({ _id: new Types.ObjectId(activityId) });
  if(!activity) {
    const activity2 = await db.collection('activities').findOne({ _id: activityId });
    console.log("Activity by string:", JSON.stringify(activity2, null, 2));
  } else {
    console.log("Activity by ObjectId:", JSON.stringify(activity, null, 2));
  }
  
  const allActs = await db.collection('activities').find({ status: 'completed' }).toArray();
  console.log("Completed Activities:", allActs.map(a => ({ id: a._id.toString(), title: a.title })));

  process.exit(0);
})();
