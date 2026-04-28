const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/test?family=4')
  .then(async () => {
    const db = mongoose.connection.db;

    const act = await db.collection('activities').findOne({ title: /TypeScript/i });
    console.log('=== ACTIVITY requiredSkills ===');
    console.log(JSON.stringify(act.requiredSkills, null, 2));

    const user = await db.collection('users').findOne({ name: 'Emily Garcia' });
    const skillIds = user.skills.map(s => s.skillId.toString());
    console.log('\n=== Emily skillIds ===');
    console.log(skillIds);

    const required = act.requiredSkills.map(r => r.skillId.toString());
    console.log('\n=== Required skillIds ===');
    console.log(required);

    const missing = required.filter(r => !skillIds.includes(r));
    console.log('\n=== MISSING (should not be empty) ===');
    console.log(missing);

    console.log('\n=== TYPE CHECK ===');
    console.log('First required skillId type:', typeof act.requiredSkills[0].skillId);
    console.log('First user skillId type:', typeof user.skills[0].skillId);
    console.log('First required skillId constructor:', act.requiredSkills[0].skillId?.constructor?.name);
    console.log('First user skillId constructor:', user.skills[0].skillId?.constructor?.name);

    process.exit();
  })
  .catch(err => { console.error(err); process.exit(1); });