const axios = require('axios');

async function testAuth() {
    const baseUrl = 'http://localhost:3003';
    const email = 'test_' + Date.now() + '@example.com';
    const password = 'password123';

    console.log('--- TESTING REGISTER+LOGIN ---');
    try {
        console.log(`Registering ${email}...`);
        const reg = await axios.post(`${baseUrl}/auth/register`, {
            name: 'Test Bot',
            email: email,
            password: password,
            role: 'HR'
        });
        console.log('✅ Register Success:', reg.data.user.email);

        console.log('Logging in...');
        const login = await axios.post(`${baseUrl}/auth/login`, {
            email: email,
            password: password
        });
        console.log('✅ Login Success. Token received.');
    } catch (e) {
        console.error('❌ FAILED:', e.response?.data || e.message);
    }
}

testAuth();
