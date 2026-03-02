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
        const col = mongoose.connection.db.collection('users');
        const indexes = await col.listIndexes().toArray();
        console.log('--- INDEXES ---');
        console.log(JSON.stringify(indexes, null, 2));

        for (let idx of indexes) {
            if (idx.name === 'matricule_1' || idx.key.matricule) {
                console.log('Dropping matricule index:', idx.name);
                await col.dropIndex(idx.name);
                console.log('Dropped!');
            }
        }
    } catch (e) {
        console.log('ERROR:', e.message);
    } finally {
        await mongoose.disconnect();
    }
}
run();

