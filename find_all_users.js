const mongoose = require('mongoose');
async function run() {
    const uri = 'mongodb+srv://montahaguedhami:monta@montaha.thpvndq.mongodb.net/?retryWrites=true&w=majority&authSource=admin';
    try {
        const client = await mongoose.connect(uri);
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();

        let output = '';
        for (const dbInfo of dbs.databases) {
            const dbName = dbInfo.name;
            if (['admin', 'local', 'config'].includes(dbName)) continue;

            const db = mongoose.connection.useDb(dbName);
            const collections = await db.db.listCollections().toArray();
            output += `--- Database: ${dbName} ---\n`;

            for (const col of collections) {
                if (col.name === 'users') {
                    const users = await db.db.collection('users').find().toArray();
                    users.forEach(u => {
                        output += `  [users] Email: ${u.email}\n`;
                    });
                }
            }
        }

        const fs = require('fs');
        fs.writeFileSync('all_users_found.txt', output);
        console.log('Done writing users to all_users_found.txt');
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
