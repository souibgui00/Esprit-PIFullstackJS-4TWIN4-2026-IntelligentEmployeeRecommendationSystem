/**
 * redistribute-users.mjs
 * -----------------------------------------------------------
 * Force-reassign ALL employee users (role=EMPLOYEE) evenly
 * across the real departments that exist in the database.
 * Managers/HR/Admins are left untouched.
 *
 * Run:  node scripts/redistribute-users.mjs
 * -----------------------------------------------------------
 */

import { MongoClient, ObjectId } from 'mongodb';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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
            envVars[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
        });
} catch {
    console.error('Could not read .env at', envPath);
    process.exit(1);
}

const MONGO_URI = envVars['MONGODB_URI'];
if (!MONGO_URI) { console.error('MONGODB_URI not in .env'); process.exit(1); }

// Roles that should NOT be touched
const SKIP_ROLES = ['ADMIN', 'HR', 'MANAGER', 'admin', 'hr', 'manager'];

async function run() {
    console.log('\n🔗 Connecting to MongoDB…');
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✅ Connected.\n');

    const db = client.db();
    const users = db.collection('users');
    const departments = db.collection('departments');

    // ── 1. Load real departments ─────────────────────────────────────────────
    const depts = await departments.find({}).toArray();
    if (depts.length === 0) {
        console.error('❌ No departments found in DB. Create departments first.');
        await client.close();
        return;
    }

    console.log(`Found ${depts.length} departments:`);
    depts.forEach((d, i) => console.log(`  [${i}] ${d.name}  (${d._id})`));

    // ── 2. Count all employees to reassign ──────────────────────────────────
    const total = await users.countDocuments({ role: { $nin: SKIP_ROLES } });
    console.log(`\nTotal employees to redistribute: ${total}`);

    if (total === 0) {
        console.log('No employees to reassign.');
        await client.close();
        return;
    }

    // ── 3. Fetch all employee IDs ────────────────────────────────────────────
    const allEmployees = await users
        .find({ role: { $nin: SKIP_ROLES } })
        .project({ _id: 1 })
        .toArray();

    // ── 4. Round-robin assignment ────────────────────────────────────────────
    console.log('\n⚙️  Building batch updates (round-robin)…');
    const batchOps = allEmployees.map((emp, i) => {
        const dept = depts[i % depts.length];
        return {
            updateOne: {
                filter: { _id: emp._id },
                update: { $set: { department_id: dept._id } },
            },
        };
    });

    // ── 5. Execute in chunks of 500 ──────────────────────────────────────────
    const CHUNK = 500;
    let totalModified = 0;
    for (let start = 0; start < batchOps.length; start += CHUNK) {
        const chunk = batchOps.slice(start, start + CHUNK);
        const res = await users.bulkWrite(chunk, { ordered: false });
        totalModified += res.modifiedCount;
        const batch = Math.floor(start / CHUNK) + 1;
        const total = Math.ceil(batchOps.length / CHUNK);
        process.stdout.write(`  Batch ${batch}/${total}: ${res.modifiedCount} updated\n`);
    }

    // ── 6. Print final distribution ──────────────────────────────────────────
    console.log('\n📊 Final distribution:');
    let grandTotal = 0;
    for (const dept of depts) {
        const count = await users.countDocuments({
            department_id: dept._id,
            role: { $nin: SKIP_ROLES },
        });
        grandTotal += count;
        const bar = '█'.repeat(Math.round(count / total * 40));
        console.log(`  ${dept.name.padEnd(30)} ${String(count).padStart(5)} members  ${bar}`);
    }
    console.log(`\n  Total: ${grandTotal} employees distributed across ${depts.length} departments.`);
    console.log(`  ✅ Done — ${totalModified} records updated.\n`);

    await client.close();
    console.log('🔒 Connection closed.\n');
}

run().catch((err) => {
    console.error('❌ Script failed:', err);
    process.exit(1);
});
