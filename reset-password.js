const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    env.split('\n').forEach(line => {
        const index = line.indexOf('=');
        if (index > -1) {
            const key = line.substring(0, index).trim();
            const value = line.substring(index + 1).trim();
            if (key) process.env[key] = value;
        }
    });
}

async function run() {
    const uri = process.env.MONGODB_URI;
    const targetEmail = 'hr@example.comdddddddd';
    const newPassword = 'password123';

    try {
        console.log(`Connecting to DB...`);
        await mongoose.connect(uri);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const result = await mongoose.connection.db.collection('users').updateOne(
            { email: targetEmail },
            { $set: { password: hashedPassword } }
        );

        if (result.matchedCount > 0) {
            console.log(`✅ Success! Password for ${targetEmail} has been reset to: ${newPassword}`);
        } else {
            console.log(`❌ User with email ${targetEmail} not found.`);
        }
    } catch (e) {
        console.log('ERROR:', e.message);
    } finally {
        await mongoose.disconnect();
    }
}
run();
