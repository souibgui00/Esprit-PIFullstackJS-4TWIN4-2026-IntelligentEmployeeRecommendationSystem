const mongoose = require('mongoose');
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
    try {
        await mongoose.connect(uri);
        const users = await mongoose.connection.db.collection('users').find().toArray();
        console.log('--- ALL USERS ---');
        users.forEach(u => {
            console.log(`Email: ${u.email}, Name: ${u.name}, Role: ${u.role}`);
        });
    } catch (e) {
        console.log('ERROR:', e.message);
    } finally {
        await mongoose.disconnect();
    }
}
run();
