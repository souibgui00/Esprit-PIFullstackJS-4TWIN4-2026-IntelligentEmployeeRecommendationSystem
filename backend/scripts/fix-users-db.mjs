/**
 * fix-users-db.mjs
 * -----------------------------------------------------------
 * 1. Remove duplicate users that share the same name (keep the
 *    one with the lowest createdAt / _id; delete the rest).
 * 2. Distribute all remaining unassigned users (department_id is
 *    null/missing) evenly across all existing departments.
 *
 * Run:  node scripts/fix-users-db.mjs
 * -----------------------------------------------------------
 */

import { MongoClient, ObjectId } from 'mongodb';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── resolve .env manually (no dotenv dependency needed) ─────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');
const envVars = {};
try {
    readFileSync(envPath, 'utf-8')
        .split('\n')
        .forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx === -1) return;
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            envVars[key] = val;
        });
} catch {
    console.error('Could not read .env file at', envPath);
    process.exit(1);
}

const MONGO_URI = envVars['MONGODB_URI'];
if (!MONGO_URI) {
    console.error('MONGODB_URI not found in .env');
    process.exit(1);
}

// ── skip roles that should not be touched ───────────────────────────────────
const SKIP_ROLES = new Set(['admin', 'hr', 'ADMIN', 'HR']);

async function run() {
    console.log('\n🔗 Connecting to MongoDB…');
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✅ Connected.\n');

    const db = client.db(); // uses the DB name in the URI ("test")
    const users = db.collection('users');
    const departments = db.collection('departments');

    // ────────────────────────────────────────────────────────────────────────
    // STEP 1 – Remove duplicate-named users
    // Keep the document with the smallest _id (= earliest created).
    // ────────────────────────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════');
    console.log(' STEP 1 — Removing duplicate-named users');
    console.log('═══════════════════════════════════════════════');

    const dupPipeline = [
        {
            $group: {
                _id: '$name',
                count: { $sum: 1 },
                ids: { $push: '$_id' },
                firstId: { $min: '$_id' },
            },
        },
        { $match: { count: { $gt: 1 } } },
    ];

    const duplicateGroups = await users.aggregate(dupPipeline).toArray();
    console.log(`Found ${duplicateGroups.length} names with duplicates.`);

    let totalDeleted = 0;
    for (const group of duplicateGroups) {
        // Keep firstId, delete all others
        const toDelete = group.ids.filter(
            (id) => id.toString() !== group.firstId.toString(),
        );
        const result = await users.deleteMany({ _id: { $in: toDelete } });
        totalDeleted += result.deletedCount;
        console.log(
            `  • "${group._id}": kept 1, deleted ${result.deletedCount} duplicate(s).`,
        );
    }
    console.log(`\n✅ Duplicates removed: ${totalDeleted} users deleted.\n`);

    // ────────────────────────────────────────────────────────────────────────
    // STEP 2 – Distribute unassigned users across departments
    // ────────────────────────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════');
    console.log(' STEP 2 — Distributing unassigned users');
    console.log('═══════════════════════════════════════════════');

    // Fetch all departments
    const depts = await departments.find({}).toArray();
    if (depts.length === 0) {
        console.warn('⚠️  No departments found — nothing to assign.');
        await client.close();
        return;
    }
    console.log(`Found ${depts.length} department(s): ${depts.map((d) => d.name).join(', ')}`);

    // Fetch unassigned non-admin/hr users
    const unassigned = await users
        .find({
            $or: [{ department_id: null }, { department_id: { $exists: false } }],
            role: { $nin: Array.from(SKIP_ROLES) },
        })
        .project({ _id: 1, name: 1, role: 1 })
        .toArray();

    console.log(`\nUnassigned users to distribute: ${unassigned.length}`);
    if (unassigned.length === 0) {
        console.log('Nothing to distribute.');
        await client.close();
        return;
    }

    // Round-robin assignment
    let assigned = 0;
    const batchOps = [];

    for (let i = 0; i < unassigned.length; i++) {
        const dept = depts[i % depts.length];
        batchOps.push({
            updateOne: {
                filter: { _id: unassigned[i]._id },
                update: { $set: { department_id: dept._id } },
            },
        });
    }

    // Execute in chunks of 500 to avoid overloading the driver
    const CHUNK = 500;
    for (let start = 0; start < batchOps.length; start += CHUNK) {
        const chunk = batchOps.slice(start, start + CHUNK);
        const res = await users.bulkWrite(chunk, { ordered: false });
        assigned += res.modifiedCount;
        console.log(
            `  • Batch ${Math.floor(start / CHUNK) + 1}: assigned ${res.modifiedCount} users.`,
        );
    }

    // Show distribution summary
    console.log('\n📊 Final distribution:');
    for (const dept of depts) {
        const count = await users.countDocuments({ department_id: dept._id });
        console.log(`  ${dept.name}: ${count} user(s)`);
    }

    console.log(`\n✅ Total users assigned: ${assigned}`);
    await client.close();
    console.log('🔒 Connection closed. Done!\n');
}

run().catch((err) => {
    console.error('❌ Script failed:', err);
    process.exit(1);
});
