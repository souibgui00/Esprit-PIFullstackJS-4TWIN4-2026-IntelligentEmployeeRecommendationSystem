const mongoose = require('mongoose');
const fs = require('fs');

async function checkAndFixSkills() {
    try {
        await mongoose.connect('mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/?appName=PI');
        
        const User = mongoose.connection.collection('users');
        const users = await User.find({}).toArray();

        let fixedCount = 0;
        let mohamedSkills = [];

        for (const user of users) {
             let changed = false;
             const updatedSkills = (user.skills || []).map(skill => {
                 if (typeof skill.skillId === 'string' && skill.skillId.length === 24) {
                     changed = true;
                     return { ...skill, skillId: new mongoose.Types.ObjectId(skill.skillId) };
                 }
                 return skill;
             });

             if (changed) {
                 await User.updateOne({ _id: user._id }, { $set: { skills: updatedSkills } });
                 fixedCount++;
             }

             if (user.email === 'mohamedamine.souibgui@esprit.tn') {
                 mohamedSkills = updatedSkills;
             }
        }
        
        fs.writeFileSync('fix_output.json', JSON.stringify({ fixedCount, mohamedSkills }, null, 2), 'utf-8');
    } catch(err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkAndFixSkills();
