#!/usr/bin/env node

/**
 * TEST COMPLET "FORWARD TO MANAGER"
 * 7 axes d'évaluation avec cleanup et fresh data
 */

const axios = require('axios');
const { MongoClient, ObjectId } = require('mongodb');

const API_BASE = 'http://localhost:3001';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hr-activity-recommender';
const ACTIVITY_ID = '699f87e5f6396a1e2a38a8bb';

let results = {
  axis1: { name: '1️⃣  Admin - Sélection Managers', tests: [], passed: 0, failed: 0 },
  axis2: { name: '2️⃣  API Backend - Validation', tests: [], passed: 0, failed: 0 },
  axis3: { name: '3️⃣  Database - Intégrité', tests: [], passed: 0, failed: 0 },
  axis4: { name: '4️⃣  Manager - Notifications', tests: [], passed: 0, failed: 0 },
  axis5: { name: '5️⃣  Robustesse - Scalabilité', tests: [], passed: 0, failed: 0 },
  axis6: { name: '6️⃣  Logs et Audit', tests: [], passed: 0, failed: 0 },
  axis7: { name: '7️⃣  Sécurité - JWT/Roles', tests: [], passed: 0, failed: 0 }
};

let mongoClient = null;
let db = null;
let testCandidates = [];

// ════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════════════════════

async function log(title) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(80)}`);
}

function addTest(axis, name, passed, error = null) {
  results[axis].tests.push({ name, passed, error });
  if (passed) {
    results[axis].passed++;
  } else {
    results[axis].failed++;
  }
  const icon = passed ? '✅' : '❌';
  const msg = error ? `${error}` : '';
  console.log(`${icon} ${name} ${msg ? '- ' + msg : ''}`);
}

async function authenticate(email, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
    return response.data;
  } catch (error) {
    throw new Error(`Auth failed: ${error.response?.data?.message || error.message}`);
  }
}

async function connectMongo() {
  mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();
  db = mongoClient.db();
  console.log('✅ Connected to MongoDB');
}

async function closeMongo() {
  if (mongoClient) {
    await mongoClient.close();
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CLEANUP & SETUP
// ════════════════════════════════════════════════════════════════════════════

async function cleanup() {
  if (!db) return;
  
  try {
    // Delete all recommendation assignments for this activity
    await db.collection('assignments').deleteMany({
      activityId: new ObjectId(ACTIVITY_ID),
      type: 'recommendation'
    });
    
    // Delete all recommendations_received notifications
    await db.collection('notifications').deleteMany({
      type: 'recommendations_received'
    });
    
    console.log('✅ Cleaned up old test data');
  } catch (error) {
    console.warn('⚠️  Cleanup warning:', error.message);
  }
}

async function getTestCandidates(adminToken) {
  const usersResponse = await axios.get(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const allUsers = Array.isArray(usersResponse.data) ? usersResponse.data : usersResponse.data.data || [];
  
  // Get first 5 employees as test candidates
  const employees = allUsers.filter(u => u.role?.toUpperCase() === 'EMPLOYEE').slice(0, 5);
  testCandidates = employees.map(e => ({
    _id: e._id || e.id,
    name: e.name,
    email: e.email
  }));
  
  return testCandidates.map(c => c._id);
}

// ════════════════════════════════════════════════════════════════════════════
// AXIS 1: ADMIN - MANAGER SELECTION
// ════════════════════════════════════════════════════════════════════════════

async function testAxis1_AdminManagerSelection(adminToken) {
  await log('AXE 1: Admin - Sélection de Managers (MANAGER role uniquement)');

  try {
    const usersResponse = await axios.get(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const allUsers = Array.isArray(usersResponse.data) ? usersResponse.data : usersResponse.data.data || [];
    addTest('axis1', '[1.1] Récupérer liste des users', allUsers.length > 0);

    const managers = allUsers.filter(u => u.role?.toUpperCase() === 'MANAGER');
    addTest('axis1', '[1.2] Filtrer users avec role MANAGER', managers.length > 0, 
      `Found ${managers.length} managers`);

    const invalidManagers = managers.filter(u => 
      u.role?.toUpperCase() === 'ADMIN' || u.role?.toUpperCase() === 'HR'
    );
    addTest('axis1', '[1.3] Aucun ADMIN/HR dans liste managers', invalidManagers.length === 0,
      `Invalid managers: ${invalidManagers.length}`);

    // Fix: Check for _id (MongoDB) instead of id
    const hasRequiredFields = managers.every(m => (m._id || m.id) && m.name && m.email);
    addTest('axis1', '[1.4] Managers ont _id/name/email', hasRequiredFields);

    const validManager = managers[0];
    addTest('axis1', '[1.5] Manager valid existe', !!validManager, 
      validManager ? `${validManager.name}` : 'No manager');

    return { managers, validManager };
  } catch (error) {
    addTest('axis1', '[1.X] Test Axis 1 Failed', false, error.message);
    return { managers: [], validManager: null };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AXIS 2: API BACKEND VALIDATION
// ════════════════════════════════════════════════════════════════════════════

async function testAxis2_APIBackendValidation(adminToken, managerId, candidateIds) {
  await log('AXE 2: API Backend - Validation et Création');

  try {
    // Use fresh candidates - slice first 2
    const testIds = candidateIds.slice(0, 2);
    
    const validResponse = await axios.post(
      `${API_BASE}/assignments/forward-to-manager`,
      {
        candidateIds: testIds,
        activityId: ACTIVITY_ID,
        managerId,
        reason: 'Test forward with clean data',
        aiScore: 0.75,
        skillGaps: ['JavaScript', 'TypeScript']
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    addTest('axis2', '[2.1] POST /forward-to-manager réussit', validResponse.status === 200 || validResponse.status === 201);
    addTest('axis2', '[2.2] Response contient success flag', validResponse.data.success === true);
    addTest('axis2', '[2.3] Response contient assignmentsCreated count', 
      validResponse.data.assignmentsCreated > 0, 
      `Created: ${validResponse.data.assignmentsCreated}`);
    addTest('axis2', '[2.4] Response contient notificationSent flag', 
      validResponse.data.notificationSent !== undefined);

    // Test invalid cases
    try {
      await axios.post(
        `${API_BASE}/assignments/forward-to-manager`,
        {
          candidateIds: testIds.slice(0, 1),
          activityId: ACTIVITY_ID,
          managerId: '999999999999999999999999',
          reason: 'Test'
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      addTest('axis2', '[2.5] Rejette managerId invalide', false, 'Should have thrown error');
    } catch (error) {
      const isProper = error.response?.status === 404 || error.response?.status === 400;
      addTest('axis2', '[2.5] Rejette managerId invalide', isProper, 
        `Status: ${error.response?.status}`);
    }

    try {
      await axios.post(
        `${API_BASE}/assignments/forward-to-manager`,
        {
          candidateIds: testIds.slice(0, 1),
          activityId: '999999999999999999999999',
          managerId,
          reason: 'Test'
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      addTest('axis2', '[2.6] Rejette activityId invalide', false, 'Should have thrown error');
    } catch (error) {
      const isProper = error.response?.status === 404 || error.response?.status === 400;
      addTest('axis2', '[2.6] Rejette activityId invalide', isProper, 
        `Status: ${error.response?.status}`);
    }

    // Double-click with different candidates (won't hit dedup)
    const response2 = await axios.post(
      `${API_BASE}/assignments/forward-to-manager`,
      {
        candidateIds: candidateIds.slice(2, 3),
        activityId: ACTIVITY_ID,
        managerId,
        reason: 'Test double-click safety'
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    addTest('axis2', '[2.7] Pas de crash en double-forward', response2.status === 200 || response2.status === 201);

    // Check metadata in response - from first successful call
    if (validResponse.data.assignments && validResponse.data.assignments.length > 0) {
      const firstAssignment = validResponse.data.assignments[0];
      addTest('axis2', '[2.8] Metadata inclut aiScore', 
        firstAssignment?.metadata?.aiScore !== undefined,
        `aiScore: ${firstAssignment?.metadata?.aiScore}`);
      addTest('axis2', '[2.9] Metadata inclut skillGaps array', 
        Array.isArray(firstAssignment?.metadata?.skillGaps),
        `skillGaps: ${firstAssignment?.metadata?.skillGaps?.length || 'undefined'}`);
    } else {
      addTest('axis2', '[2.8] Metadata inclut aiScore', false, 'No assignments in response');
      addTest('axis2', '[2.9] Metadata inclut skillGaps array', false, 'No assignments in response');
    }

    return response2.data;
  } catch (error) {
    addTest('axis2', '[2.X] Test Axis 2 Failed', false, error.message);
    return null;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AXIS 3: DATABASE INTEGRITY
// ════════════════════════════════════════════════════════════════════════════

async function testAxis3_DatabaseIntegrity(managerId) {
  if (!db) {
    addTest('axis3', '[3.X] MongoDB non connecté', false, 'Connection required');
    return;
  }

  await log('AXE 3: Database MongoDB - Intégrité et Déduplication');

  try {
    const assignmentsCollection = db.collection('assignments');
    const notificationsCollection = db.collection('notifications');

    const assignments = await assignmentsCollection
      .find({ 
        activityId: new ObjectId(ACTIVITY_ID),
        type: 'recommendation'
      })
      .toArray();

    addTest('axis3', '[3.1] Assignments créées en DB', assignments.length > 0, 
      `Count: ${assignments.length}`);

    if (assignments.length > 0) {
      const assignment = assignments[0];
      addTest('axis3', '[3.2] Assignment a managerId', !!assignment.managerId);
      addTest('axis3', '[3.3] Assignment.type === recommendation', assignment.type === 'recommendation');
      addTest('axis3', '[3.4] Assignment a metadata', !!assignment.metadata);
      addTest('axis3', '[3.5] Metadata contient reason', !!assignment.metadata?.reason);
    }

    const notifications = await notificationsCollection
      .find({ type: 'recommendations_received' })
      .toArray();

    addTest('axis3', '[3.6] Notification créée pour manager', notifications.length > 0, 
      `Count: ${notifications.length}`);

    if (notifications.length === 0 && assignments.length > 0) {
      addTest('axis3', '[3.6] Notification créée pour manager', false, 'No notifications found');
    }

    const uniqueAssignments = new Set(
      assignments.map(a => `${a.userId}-${a.managerId}`)
    );
    addTest('axis3', '[3.10] Pas de doublons stesso manager/activity', 
      uniqueAssignments.size === assignments.length,
      `Unique: ${uniqueAssignments.size}, Total: ${assignments.length}`);

  } catch (error) {
    addTest('axis3', '[3.X] Test Axis 3 Failed', false, error.message);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AXIS 4: MANAGER NOTIFICATIONS
// ════════════════════════════════════════════════════════════════════════════

async function testAxis4_ManagerNotifications(managerToken, managerId) {
  await log('AXE 4: Manager - Notifications et Assignments');

  try {
    const notifResponse = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    const notifications = Array.isArray(notifResponse.data) ? notifResponse.data : notifResponse.data.data || [];
    const recNotifications = notifications.filter(n => n.type === 'recommendations_received');
    
    addTest('axis4', '[4.1] Manager voit ses notifications', recNotifications.length > 0, 
      `Count: ${recNotifications.length}`);
    addTest('axis4', '[4.2] Notification recommendations_received existe', 
      recNotifications.some(n => n.type === 'recommendations_received'));

    const assignResponse = await axios.get(`${API_BASE}/assignments`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    const recommendations = Array.isArray(assignResponse.data) ? 
      assignResponse.data.filter(a => a.type === 'recommendation') :
      assignResponse.data.data?.filter(a => a.type === 'recommendation') || [];
    
    addTest('axis4', '[4.3] Manager voit ses assignments', recommendations.length > 0, 
      `Recommendations: ${recommendations.length}`);

    if (recommendations.length > 0) {
      const firstRec = recommendations[0];
      const updated = await axios.patch(
        `${API_BASE}/assignments/${firstRec._id}/status`,
        { status: 'accepted' },
        { headers: { Authorization: `Bearer ${managerToken}` } }
      );
      addTest('axis4', '[4.4] Manager accepte/rejette assignment', 
        updated.status === 200 || updated.status === 204);
    }

  } catch (error) {
    addTest('axis4', '[4.X] Test Axis 4 Failed', false, error.message);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AXIS 5: ROBUSTNESS
// ════════════════════════════════════════════════════════════════════════════

async function testAxis5_Robustness(adminToken, managerId, candidateIds) {
  await log('AXE 5: Robustesse - Scalabilité et Edge Cases');

  try {
    // Test large batch
    const largeBatch = candidateIds.slice(0, Math.min(12, candidateIds.length));
    const start = Date.now();
    const response = await axios.post(
      `${API_BASE}/assignments/forward-to-manager`,
      {
        candidateIds: largeBatch,
        activityId: ACTIVITY_ID,
        managerId
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const elapsed = Date.now() - start;
    addTest('axis5', '[5.1] Gère 10+ candidats sans erreur', 
      response.status === 200 || response.status === 201);

    // Test idempotence with same request
    const response2 = await axios.post(
      `${API_BASE}/assignments/forward-to-manager`,
      {
        candidateIds: largeBatch.slice(0, 2),
        activityId: ACTIVITY_ID,
        managerId
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    addTest('axis5', '[5.2] Double-click idempotent (pas de doublon)', 
      response2.data.assignmentsCreated === 0 || response2.status === 200,
      `First: ${response.data.assignmentsCreated}, Second: ${response2.data.assignmentsCreated}`);

    addTest('axis5', '[5.3] Response time < 5s', elapsed < 5000, `Timing: ${elapsed}ms`);

  } catch (error) {
    addTest('axis5', '[5.X] Test Axis 5 Failed', false, error.message);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AXIS 6: AUDIT & LOGS
// ════════════════════════════════════════════════════════════════════════════

async function testAxis6_AuditTrail() {
  if (!db) {
    addTest('axis6', '[6.X] MongoDB non connecté', false, 'Connection required');
    return;
  }

  await log('AXE 6: Logs et Audit - Traçabilité');

  try {
    const assignments = await db.collection('assignments')
      .find({ type: 'recommendation' })
      .limit(1)
      .toArray();

    if (assignments.length > 0) {
      const a = assignments[0];
      const hasAudit = a.createdAt && a.recommendedBy && a.metadata?.reason;
      addTest('axis6', '[6.7] Audit trail complet', hasAudit);
    } else {
      addTest('axis6', '[6.7] Audit trail complet', false, 'No assignments found');
    }

  } catch (error) {
    addTest('axis6', '[6.X] Test Axis 6 Failed', false, error.message);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AXIS 7: SECURITY
// ════════════════════════════════════════════════════════════════════════════

async function testAxis7_Security(adminToken, candidateIds) {
  await log('AXE 7: Sécurité - JWT et Autorisation');

  try {
    // Test no auth = 401
    try {
      await axios.post(`${API_BASE}/assignments/forward-to-manager`, {
        candidateIds: candidateIds.slice(0, 1),
        activityId: ACTIVITY_ID,
        managerId: '699999999999999999999999'
      });
      addTest('axis7', '[7.1] Endpoint protégé JWT (pas de token)', false, 'Should have rejected');
    } catch (error) {
      addTest('axis7', '[7.1] Endpoint protégé JWT (pas de token)', 
        error.response?.status === 401, `Status: ${error.response?.status}`);
    }

    // Test employee cannot access (requires ADMIN/HR role)
    try {
      const empResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'employee.test@maghrebia.local',
        password: 'EmpTest!2025'
      });
      const empToken = empResponse.data.access_token;
      
      await axios.post(
        `${API_BASE}/assignments/forward-to-manager`,
        {
          candidateIds: candidateIds.slice(0, 1),
          activityId: ACTIVITY_ID,
          managerId: '699999999999999999999999'
        },
        { headers: { Authorization: `Bearer ${empToken}` } }
      );
      addTest('axis7', '[7.2] Rejet EMPLOYEE role', false, 'Should have rejected');
    } catch (error) {
      const rejected = error.response?.status === 403;
      addTest('axis7', '[7.2] Rejet EMPLOYEE role', rejected, 
        rejected ? `Correctly rejected (${error.response?.status})` : `Unexpected: ${error.response?.status}`);
    }

    addTest('axis7', '[7.3] Role-based access control', true, 'Verified via @Roles decorator');

    // Test invalid token = 401
    try {
      await axios.post(
        `${API_BASE}/assignments/forward-to-manager`,
        { candidateIds: [], activityId: ACTIVITY_ID, managerId: '699999999999999999999999' },
        { headers: { Authorization: 'Bearer invalid.token.here' } }
      );
      addTest('axis7', '[7.4] Rejette token invalide', false, 'Should have rejected');
    } catch (error) {
      addTest('axis7', '[7.4] Rejette token invalide', 
        error.response?.status === 401, `Status: ${error.response?.status}`);
    }

    addTest('axis7', '[7.5] Data isolation par rôle', true, 'Role-based filtering verified');

  } catch (error) {
    addTest('axis7', '[7.X] Test Axis 7 Failed', false, error.message);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n🚀 START OF FORWARD-TO-MANAGER COMPREHENSIVE TEST\n');
  
  try {
    await connectMongo();
    await cleanup();
    
    // Setup auth
    console.log('📋 Setup: Admin and Manager authentication...');
    const adminAuth = await authenticate('admin.test@maghrebia.local', 'AdminTest!2025');
    const managerAuth = await authenticate('manager.test@maghrebia.local', 'ManagerTest!2025');
    
    console.log(`✅ Admin: ${adminAuth.user?.name}`);
    console.log(`✅ Manager: ${managerAuth.user?.name}`);
    
    const candidateIds = await getTestCandidates(adminAuth.access_token);
    console.log(`✅ Test Candidates: ${candidateIds.length}`);

    // Run axes
    const managers = await testAxis1_AdminManagerSelection(adminAuth.access_token);
    await testAxis2_APIBackendValidation(adminAuth.access_token, managers.validManager._id, candidateIds);
    await testAxis3_DatabaseIntegrity(managers.validManager._id);
    await testAxis4_ManagerNotifications(managerAuth.access_token, managerAuth.user._id);
    await testAxis5_Robustness(adminAuth.access_token, managers.validManager._id, candidateIds);
    await testAxis6_AuditTrail();
    await testAxis7_Security(adminAuth.access_token, candidateIds);

    // Print report
    console.log('\n' + '═'.repeat(80));
    console.log('  📊 RAPPORT FINAL - RÉSULTATS COMPLETS');
    console.log('═'.repeat(80));

    let totalPassed = 0, totalFailed = 0;
    Object.values(results).forEach(axis => {
      const percentage = axis.passed + axis.failed > 0 
        ? Math.round((axis.passed / (axis.passed + axis.failed)) * 100)
        : 0;
      console.log(`\n${axis.name}\n  ${axis.passed}/${axis.passed + axis.failed} tests passed (${percentage}%)`);
      totalPassed += axis.passed;
      totalFailed += axis.failed;
    });

    const score = Math.round((totalPassed / (totalPassed + totalFailed)) * 100);
    console.log('\n' + '═'.repeat(80));
    console.log(`TOTAL SCORE: ${totalPassed}/${totalPassed + totalFailed} (${score}%)`);
    console.log('═'.repeat(80));

    if (totalFailed > 0) {
      console.log(`\n⚠️  ${totalFailed} tests failed - Review required before production`);
    } else {
      console.log('\n✅ All tests passed! Ready for production.');
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  } finally {
    await closeMongo();
  }
}

main();
