const mongoose = require('mongoose');
const fs = require('fs');
(async () => {
  await mongoose.connect('mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/?appName=PI');
  const db = mongoose.connection.db;

  const results = {};

  // Part
  results.participation = await db.collection('participations').findOne({ _id: new mongoose.Types.ObjectId('69d3b54cd559ea45325d9a43') });

  // Employee
  if (results.participation) {
    results.employee = await db.collection('users').findOne({ _id: results.participation.userId });
  }

  // Dept
  if (results.employee && results.employee.department_id) {
    results.department = await db.collection('departments').findOne({ _id: results.employee.department_id });
  }

  // Managers
  results.allManagers = await db.collection('users').find({ role: /manager/i }).project({ _id: 1, name: 1, email: 1, role: 1 }).toArray();

  // All Depts
  results.allDepartments = await db.collection('departments').find({}).project({ _id: 1, name: 1, manager_id: 1 }).toArray();

  fs.writeFileSync('diag_results.json', JSON.stringify(results, null, 2));
  console.log('Results written to diag_results.json');
  await mongoose.disconnect();
})();
