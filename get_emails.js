const mongoose = require('mongoose');
async function run() {
    try {
        await mongoose.connect('mongodb+srv://montahaguedhami:monta@montaha.thpvndq.mongodb.net/test?retryWrites=true&w=majority&authSource=admin');
        const users = await mongoose.connection.db.collection('users').find().toArray();
        const emails = users.map(u => u.email);
        const fs = require('fs');
        fs.writeFileSync('emails_found.txt', emails.join('\n'));
        console.log('Done writing emails to emails_found.txt');
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
