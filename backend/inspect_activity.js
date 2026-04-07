const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/?appName=PI');
  console.log('Connected to DB');

  const db = mongoose.connection.db;

  const activity = await db.collection('activities').findOne({ title: /Time Management/i });
  console.log('Activity ID:', activity?._id);
  console.log('Organizer ID:', activity?.organizerId);

  const participations = await db.collection('participations').find({ activityId: activity._id }).toArray();
  console.log('Participations Count:', participations.length);
  for (const p of participations) {
    console.log(`- Participation ${p._id}: UserId ${p.userId}, Status: ${p.status}`);
    const user = await db.collection('users').findOne({ _id: p.userId });
    if (user) {
       console.log(`  User: ${user.name}, DepartmentID: ${user.department_id}, ManagerID: ${user.manager_id}`);
       const dept = await db.collection('departments').findOne({ _id: user.department_id });
       console.log(`  Department Name: ${dept?.name}, Dept Manager: ${dept?.manager_id}`);
    }
  }

  process.exit(0);
}

run().catch(console.error);
