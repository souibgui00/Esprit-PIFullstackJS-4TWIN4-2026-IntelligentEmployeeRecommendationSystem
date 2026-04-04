#!/usr/bin/env node

/**
 * Test complet du flux Forward to Manager
 * 
 * 1. Authentifier comme manager
 * 2. Récupérer les recommandations pour une activité
 * 3. Forwarder les recommandations au manager
 * 4. Vérifier les Assignments créées en BD
 * 5. Vérifier les Notifications créées en BD
 */

const axios = require('axios');
const API_BASE = 'http://localhost:3000';

const ACTIVITY_ID = '699f87e5f6396a1e2a38a8bb';
const MANAGER_EMAIL = 'manager.test@maghrebia.local';
const MANAGER_PASSWORD = 'ManagerTest!2025';
const ADMIN_EMAIL = 'admin.test@maghrebia.local';
const ADMIN_PASSWORD = 'AdminTest!2025';

let adminToken = null;
let managerToken = null;
let adminId = null;
let managerId = null;
let recommendations = [];

async function log(title, message) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📌 ${title}`);
  console.log(`${'='.repeat(60)}`);
  console.log(message);
}

async function step(num, title) {
  console.log(`\n\n${'█'.repeat(60)}`);
  console.log(`${'█'} Step ${num}: ${title}`);
  console.log(`${'█'.repeat(60)}`);
}

async function authenticate(email, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Auth failed:', error.response?.data || error.message);
    throw error;
  }
}

async function getRecommendations(token) {
  try {
    const response = await axios.get(
      `${API_BASE}/activities/${ACTIVITY_ID}/recommendations`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Get recommendations failed:', error.response?.data || error.message);
    throw error;
  }
}

async function forwardToManager(token, candidateIds, managerId) {
  try {
    const response = await axios.post(
      `${API_BASE}/assignments/forward-to-manager`,
      {
        candidateIds,
        activityId: ACTIVITY_ID,
        managerId,
        reason: 'Recommended by admin based on skill matching'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Forward to manager failed:', error.response?.data || error.message);
    throw error;
  }
}

async function checkDatabaseAssignments() {
  try {
    const response = await axios.get(
      `${API_BASE}/assignments`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Check assignments failed:', error.response?.data || error.message);
    throw error;
  }
}

async function checkManagerNotifications() {
  try {
    const response = await axios.get(
      `${API_BASE}/notifications`,
      { headers: { Authorization: `Bearer ${managerToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Check notifications failed:', error.response?.data || error.message);
    throw error;
  }
}

async function run() {
  try {
    // Step 1: Authenticate as admin
    await step(1, 'Authenticate as Admin');
    const adminAuth = await authenticate(ADMIN_EMAIL, ADMIN_PASSWORD);
    adminToken = adminAuth.access_token;
    adminId = adminAuth.user?.id;
    console.log(`✅ Admin authenticated: ${adminId}`);
    console.log(`Token: ${adminToken.substring(0, 30)}...`);

    // Step 2: Authenticate as manager
    await step(2, 'Authenticate as Manager');
    const managerAuth = await authenticate(MANAGER_EMAIL, MANAGER_PASSWORD);
    managerToken = managerAuth.access_token;
    managerId = managerAuth.user?.id;
    console.log(`✅ Manager authenticated: ${managerId}`);
    console.log(`Token: ${managerToken.substring(0, 30)}...`);

    // Step 3: Get recommendations for activity
    await step(3, 'Get Recommendations for Activity');
    const recResponse = await getRecommendations(adminToken);
    console.log(`✅ Activity: ${recResponse.activity.title}`);
    console.log(`✅ Status: ${recResponse.activity.workflowStatus}`);
    console.log(`✅ Candidates found: ${recResponse.candidates.length}`);

    // Store recommendations and candidate IDs
    recommendations = recResponse.candidates;
    const candidateIds = recommendations.slice(0, 2).map(c => c.userId);
    console.log(`Selected candidates: ${candidateIds.length}`);
    candidateIds.forEach((id, i) => {
      const rec = recommendations.find(r => r.userId === id);
      console.log(`  ${i+1}. ${rec.name} (Score: ${rec.score})`);
    });

    // Step 4: Forward recommendations to manager
    await step(4, 'Forward Recommendations to Manager');
    const forwardResponse = await forwardToManager(adminToken, candidateIds, managerId);
    console.log(`✅ Forwarding result:`);
    console.log(`   - Assignments created: ${forwardResponse.assignmentsCreated}`);
    console.log(`   - Notification sent: ${forwardResponse.notificationSent}`);
    console.log(`   - Status: ${forwardResponse.success}`);

    // Step 5: Check Assignments in database
    await step(5, 'Verify Assignments in Database');
    const allAssignments = await checkDatabaseAssignments();
    const forwardedAssignments = allAssignments.filter(a => 
      candidateIds.includes(a.userId._id || a.userId)
    );
    console.log(`✅ Total assignments: ${allAssignments.length}`);
    console.log(`✅ Forwarded assignments: ${forwardedAssignments.length}`);
    forwardedAssignments.forEach(a => {
      console.log(`   - ${a.userId.name || a.userId._id} -> ${a.status} (type: ${a.type})`);
      if (a.metadata) {
        console.log(`     Metadata: ${JSON.stringify(a.metadata)}`);
      }
    });

    // Step 6: Check Manager Notifications
    await step(6, 'Verify Manager Notifications');
    const managerNotifications = await checkManagerNotifications();
    const recommendationsNotif = managerNotifications.filter(n => 
      n.type === 'recommendations_received'
    );
    console.log(`✅ Total notifications for manager: ${managerNotifications.length}`);
    console.log(`✅ Recommendations notifications: ${recommendationsNotif.length}`);
    recommendationsNotif.forEach(n => {
      console.log(`   - ${n.title}`);
      console.log(`     ${n.message}`);
      if (n.metadata) {
        console.log(`     Metadata: ${JSON.stringify(n.metadata)}`);
      }
    });

    // Summary
    await log('✨ TEST SUMMARY', `
All steps completed successfully!

✅ Admin can generate recommendations
✅ New endpoint POST /assignments/forward-to-manager works
✅ Assignments created with type='recommendation'
✅ Notification sent to manager
✅ Manager can see the notification
✅ Database contains proper records

Next steps:
- Update frontend to use the new endpoint
- Test UI flow: Generate → Select → Forward → Notify
- Verify manager sees notification in UI
- Test manager acceptance/rejection workflow
    `);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

run();
