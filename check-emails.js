const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    env.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) process.env[key.trim()] = value.trim();
    });
}

async function run() {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://montahaguedhami:montahaguedhmi@montaha.thpvndq.mongodb.net/test?retryWrites=true&w=majority&authSource=admin';
    try {
        await mongoose.connect(uri);
        const users = await mongoose.connection.db.collection('users').find().sort({ _id: -1 }).limit(10).toArray();
        console.log('--- RECENT USERS ---');
        users.forEach(u => console.log(`- ID: ${u._id} | Email: "${u.email}" | Name: ${u.name}`));
    } catch (e) {
        console.log('ERROR:', e.message);
    } finally {
        await mongoose.disconnect();
    }
}
run();

