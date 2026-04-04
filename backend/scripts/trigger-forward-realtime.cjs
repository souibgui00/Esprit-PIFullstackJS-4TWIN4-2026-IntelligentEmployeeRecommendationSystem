#!/usr/bin/env node

const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const ACTIVITY_ID = process.env.ACTIVITY_ID || '699f87e5f6396a1e2a38a8bb';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin.test@maghrebia.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminTest!2025';
const MANAGER_EMAIL = process.env.MANAGER_EMAIL || 'manager.test@maghrebia.local';
const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD || 'ManagerTest!2025';

function normalizeId(value) {
  if (!value) return '';
  if (typeof value === 'object') {
    return String(value._id || value.id || value.toString?.() || '');
  }
  return String(value);
}

async function login(email, password) {
  const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
  return data;
}

async function main() {
  const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const manager = await login(MANAGER_EMAIL, MANAGER_PASSWORD);

  const adminToken = admin.access_token;
  const managerId = normalizeId(manager.user?.id || manager.user?._id || manager.userId);

  const usersResp = await axios.get(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const allUsers = Array.isArray(usersResp.data) ? usersResp.data : usersResp.data?.data || [];
  const employees = allUsers.filter((u) => String(u.role || '').toUpperCase() === 'EMPLOYEE');

  const assignmentsResp = await axios.get(`${API_BASE}/assignments`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const allAssignments = Array.isArray(assignmentsResp.data)
    ? assignmentsResp.data
    : assignmentsResp.data?.data || [];

  const assignedSet = new Set(
    allAssignments
      .filter((a) => normalizeId(a.managerId) === managerId && normalizeId(a.activityId) === ACTIVITY_ID)
      .map((a) => normalizeId(a.userId)),
  );

  const candidate = employees.find((e) => !assignedSet.has(normalizeId(e._id || e.id)));

  if (!candidate) {
    console.log('No unassigned employee found for this manager/activity.');
    return;
  }

  const candidateId = normalizeId(candidate._id || candidate.id);

  const { data } = await axios.post(
    `${API_BASE}/assignments/forward-to-manager`,
    {
      candidateIds: [candidateId],
      activityId: ACTIVITY_ID,
      managerId,
      reason: 'Realtime gateway trigger test',
      aiScore: 0.88,
      skillGaps: ['communication'],
    },
    {
      headers: { Authorization: `Bearer ${adminToken}` },
    },
  );

  console.log('Forward response:', {
    success: data.success,
    assignmentsCreated: data.assignmentsCreated,
    notificationSent: data.notificationSent,
    managerId,
    candidateId,
  });
}

main().catch((error) => {
  console.error('Trigger script failed:', error.response?.data || error.message);
  process.exit(1);
});
