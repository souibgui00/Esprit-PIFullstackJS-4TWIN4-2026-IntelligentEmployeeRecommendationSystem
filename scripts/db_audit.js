const mongoose = require('mongoose');

async function audit() {
  try {
    // Connect to your MongoDB (using standard local port or environment variable if I had it)
    // Assuming standard local mongo for now, or I can try to find the URI in the codebase
    const uri = 'mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/test?appName=PI';
    console.log("Attempting to connect to MongoDB Atlas...");
    await mongoose.connect(uri); 
    
    const User = mongoose.model('User', new mongoose.Schema({ 
      name: String, 
      role: String, 
      department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' } 
    }, { strict: false }), 'users');

    const Department = mongoose.model('Department', new mongoose.Schema({ 
      name: String, 
      manager_id: mongoose.Schema.Types.ObjectId 
    }, { strict: false }), 'departments');

    console.log("\n--- AUDIT: USERS MISSING DEPARTMENTS ---");
    const usersNoDept = await User.find({ 
      role: 'EMPLOYEE',
      $or: [
        { department_id: { $exists: false } },
        { department_id: null }
      ]
    });
    usersNoDept.forEach(u => console.log(`[!] User: ${u.name} (Role: ${u.role}) is missing a department_id`));

    console.log("\n--- AUDIT: DEPARTMENTS MISSING MANAGERS ---");
    const deptsNoManager = await Department.find({
      $or: [
        { manager_id: { $exists: false } },
        { manager_id: null }
      ]
    });
    deptsNoManager.forEach(d => console.log(`[!] Department: ${d.name} has NO manager_id assigned`));

    console.log("\n--- AUDIT: USERS IN DEPARTMENTS WITH NO MANAGER ---");
    for (const d of deptsNoManager) {
        const usersInDept = await User.find({ department_id: d._id });
        if (usersInDept.length > 0) {
            console.log(`[!] Found ${usersInDept.length} users in department "${d.name}" which HAS NO MANAGER.`);
            usersInDept.slice(0, 3).forEach(u => console.log(`    - Example: ${u.name}`));
        }
    }

    process.exit(0);
  } catch (err) {
    console.error("Audit failed:", err.message);
    process.exit(1);
  }
}

audit();
