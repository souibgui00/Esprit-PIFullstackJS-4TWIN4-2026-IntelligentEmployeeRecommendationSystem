const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Parse .env file
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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://montahaguedhami:monta@montaha.thpvndq.mongodb.net/test?retryWrites=true&w=majority&authSource=admin';

async function resetAdminPassword() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Hash the new password
        const plainPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        console.log(`📝 Hashing password: ${plainPassword}`);
        console.log(`🔐 Hashed: ${hashedPassword}`);

        // Update the admin user
        const result = await usersCollection.updateOne(
            { email: 'admin@test.com' },
            { $set: { password: hashedPassword } }
        );

        if (result.matchedCount === 0) {
            console.log('❌ Admin user not found!');
        } else {
            console.log(`✅ Admin password reset successfully!`);
            console.log(`💡 Login with: email="admin@test.com", password="admin123"`);
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

resetAdminPassword();
