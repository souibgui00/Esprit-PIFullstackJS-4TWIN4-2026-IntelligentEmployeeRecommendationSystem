const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/test?family=4')
  .then(async () => {
    const db = mongoose.connection.db;

    // Check activity requiredSkills
    const act = await db.collection('activities').findOne({ title: /TypeScript/i });
    console.log('=== ACTIVITY ===');
    console.log('Title:', act?.title);
    console.log('requiredSkills:', JSON.stringify(act?.requiredSkills?.slice(0, 3), null, 2));
    console.log('skillsCovered:', JSON.stringify(act?.skillsCovered?.slice(0, 3), null, 2));

    // Check user skills
    const user = await db.collection('users').findOne({ name: 'Emily Garcia' });
    console.log('\n=== USER: Emily Garcia ===');
    console.log('skills sample:', JSON.stringify(user?.skills?.slice(0, 3), null, 2));

    // Check skills collection
    const skill = await db.collection('skills').findOne({ name: /TypeScript/i });
    console.log('\n=== SKILL: TypeScript ===');
    console.log(JSON.stringify(skill, null, 2));

    process.exit();
  })
  .catch(err => { console.error(err); process.exit(1); });