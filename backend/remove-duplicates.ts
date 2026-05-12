import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { User, UserSchema } from './src/users/schema/user.schema';

dotenv.config();

const uri = process.env.MONGODB_URI;

async function run() {
  if (!uri) {
    console.error('No MONGODB_URI found in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to DB');

  // Register dummy schemas so the post('findOneAndDelete') hook doesn't crash
  const DummySchema = new mongoose.Schema({}, { strict: false });
  mongoose.model('Participation', DummySchema);
  mongoose.model('Assignment', DummySchema);
  mongoose.model('Evaluation', DummySchema);
  mongoose.model('Notification', DummySchema);
  mongoose.model('Department', DummySchema);
  mongoose.model('Skill', DummySchema);

  const UserModel = mongoose.model('User', UserSchema);

  const allUsers = await UserModel.find({}).exec();
  
  const nameMap = new Map<string, any[]>();
  for (const user of allUsers) {
    // Normalize name for comparison
    const name = user.name.trim().toLowerCase();
    if (!nameMap.has(name)) {
      nameMap.set(name, []);
    }
    nameMap.get(name)!.push(user);
  }

  let deletedCount = 0;
  for (const [name, users] of nameMap.entries()) {
    if (users.length > 1) {
      console.log(`Found ${users.length} users with name "${name}". Keeping the first one.`);
      
      // Sort by createdAt so we keep the oldest one
      users.sort((a: any, b: any) => {
        const d1 = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const d2 = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return d1 - d2;
      });

      const keep = users[0];
      const duplicates = users.slice(1);

      for (const dup of duplicates) {
        await UserModel.findOneAndDelete({ _id: dup._id });
        deletedCount++;
        console.log(`  Deleted duplicate: ${dup._id} (${dup.email || 'no-email'})`);
      }
    }
  }

  console.log(`Finished. Deleted ${deletedCount} duplicate users.`);
  await mongoose.disconnect();
}

run().catch(console.error);
