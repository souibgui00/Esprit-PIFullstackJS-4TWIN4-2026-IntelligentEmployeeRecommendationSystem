const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/?appName=PI');
  
  const db = mongoose.connection.db;

  const users = await db.collection('users').find({ name: /Mohamed Amine Souibgui/i }).toArray();
  console.log('--- USERS ---');
  for (const u of users) {
    console.log(`ID: ${u._id}, Name: ${u.name}, Role: ${u.role}, Email: ${u.email}, Dept: ${u.department_id}`);
  }

  const activity = await db.collection('activities').findOne({ title: /Time Management/i });
  console.log('--- ACTIVITY ---');
  console.log(`ID: ${activity._id}, Title: ${activity.title}, Status: ${activity.status}, WF: ${activity.workflowStatus}`);
  console.log(`Organizer: ${activity.organizerId}`);
  console.log(`CreatedBy: ${activity.createdBy}`);

  const depts = await db.collection('departments').find().toArray();
  console.log('--- DEPARTMENTS ---');
  for (const d of depts) {
    console.log(`ID: ${d._id}, Name: ${d.name}, Manager: ${d.manager_id}`);
  }

  process.exit(0);
}

run().catch(console.error);
