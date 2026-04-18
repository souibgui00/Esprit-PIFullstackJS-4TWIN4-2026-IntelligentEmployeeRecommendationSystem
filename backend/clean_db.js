const mongoose = require('mongoose');

async function cleanEmptySkills() {
    try {
        await mongoose.connect('mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/?appName=PI');
        
        const User = mongoose.connection.collection('users');
        const users = await User.find({}).toArray();

        let cleanedCount = 0;

        for (const user of users) {
             let changed = false;
             
             // Remove any skill object that has no skillId or undefined skillId
             const initialLength = (user.skills || []).length;
             const cleanedSkills = (user.skills || []).filter(skill => skill.skillId && skill.skillId !== null);
             
             if (initialLength !== cleanedSkills.length) {
                 changed = true;
             }

             if (changed) {
                 await User.updateOne({ _id: user._id }, { $set: { skills: cleanedSkills } });
                 cleanedCount += (initialLength - cleanedSkills.length);
             }
        }
        
        console.log(`Clean complete. Removed ${cleanedCount} corrupt skill records from users.`);
    } catch(err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

cleanEmptySkills();
