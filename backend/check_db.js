const mongoose = require('mongoose');
const fs = require('fs');

async function checkSkills() {
    try {
        await mongoose.connect('mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/?appName=PI');
        
        const User = mongoose.connection.collection('users');
        const user = await User.findOne({ email: 'mohamedamine.souibgui@esprit.tn' });
        
        const skillsObj = user.skills || [];
        // Show the last 10 skills added to the array
        const lastSkills = skillsObj.slice(Math.max(skillsObj.length - 10, 0));
        
        fs.writeFileSync('db_check.json', JSON.stringify(lastSkills, null, 2), 'utf-8');
        console.log("Check complete.");
    } catch(err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkSkills();
