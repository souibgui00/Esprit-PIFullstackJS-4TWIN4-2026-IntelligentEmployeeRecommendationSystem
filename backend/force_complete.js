const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/?appName=PI');
  console.log('Connected to DB');

  const db = mongoose.connection.db;

  const now = new Date();
  
  // Find activities that are approved but date has passed
  const activities = await db.collection('activities').find({
    workflowStatus: 'approved',
    date: { $exists: true, $ne: null }
  }).toArray();

  let updatedCount = 0;
  let updatedParts = 0;

  for (const activity of activities) {
    const actDate = new Date(activity.date);
    if (!isNaN(actDate.getTime())) {
      // Assuming 1 day duration for the sake of the quick fix
      const durationStr = activity.duration || '1 day';
      let days = 1;
      if (durationStr.includes('week')) days *= 7;
      
      const endDate = new Date(actDate.getTime() + days * 24 * 60 * 60 * 1000);
      
      if (endDate <= now) {
        console.log(`Setting activity ${activity.title} to completed...`);
        await db.collection('activities').updateOne(
          { _id: activity._id },
          { $set: { workflowStatus: 'completed', status: 'completed' } }
        );
        updatedCount++;
        
        const parts = await db.collection('participations').updateMany(
            { activityId: activity._id, status: { $in: ['accepted', 'in_progress'] } },
            { $set: { status: 'awaiting_organizer', awaitingOrganizerSince: now, lastUpdated: now } }
        );
        updatedParts += parts.modifiedCount;
      }
    }
  }

  console.log(`Finished! Updated ${updatedCount} activities and transitioned ${updatedParts} participations to awaiting_organizer.`);
  process.exit(0);
}

run().catch(console.error);
