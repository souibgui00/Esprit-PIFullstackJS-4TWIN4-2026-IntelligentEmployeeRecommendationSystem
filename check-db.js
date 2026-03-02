const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Basic env parser since we might be running from different cwd
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
    const uri = process.env.MONGODB_URI || 'mongodb+srv://montahaguedhami:montahaguedhmi@montaha.thpvndq.mongodb.net/test?retryWrites=true&w=majority&authSource=admin';
    console.log('--- DB CHECK ---');
    console.log('URI:', uri);
    try {
        await mongoose.connect(uri);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name).join(', '));

        const count = await mongoose.connection.db.collection('users').countDocuments();
        console.log('User Count:', count);

        const last = await mongoose.connection.db.collection('users').find().sort({ _id: -1 }).limit(1).toArray();
        if (last.length) {
            console.log('Last User:', last[0].email, '(', last[0].name, ')');
        }
    } catch (e) {
        console.log('ERROR:', e.message);
    } finally {
        await mongoose.disconnect();
    }
}
run();

