const mongoose = require('mongoose');
(async () => {
  await mongoose.connect('mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/?appName=PI');
  const db = mongoose.connection.db;
  const parts = await db.collection('participations').find({ 
    status: { $in: ['accepted','in_progress','awaiting_manager'] } 
  }).limit(10).toArray();
  
  console.log('Participations found:', parts.length);
  parts.forEach(p => {
    console.log(JSON.stringify({ _id: p._id, userId: p.userId, activityId: p.activityId, status: p.status }));
  });
  await mongoose.disconnect();
})();
