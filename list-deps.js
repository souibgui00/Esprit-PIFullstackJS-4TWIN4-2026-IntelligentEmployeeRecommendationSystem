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
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('--- COLLECTIONS ---');
        collections.forEach(c => console.log(`- ${c.name}`));

        if (collections.find(c => c.name === 'departments')) {
            const deps = await mongoose.connection.db.collection('departments').find().toArray();
            console.log('--- DEPARTMENTS ---');
            deps.forEach(d => console.log(`- ID: ${d._id} | Name: ${d.name}`));
        } else {
            console.log('No departments collection found.');
        }
    } catch (e) {
        console.log('ERROR:', e.message);
    } finally {
        await mongoose.disconnect();
    }
}
run();

