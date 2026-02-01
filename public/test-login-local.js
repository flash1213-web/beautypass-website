const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';

async function testLogin() {
    console.log('🧪 Testing Registration Flow...');

    const email = `test${Date.now()}@example.com`;
    const password = 'Password123!';
    
    try {
        // 1. Register
        console.log(`\n1. Registering user: ${email}`);
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                name: 'Test User',
                phone: '555123456'
            })
        });
        
        const regData = await regRes.json();
        console.log('Response:', regData);

        if (!regData.success) {
            console.error('❌ Registration failed');
            return;
        }

        console.log('✅ Registration successful!');
        console.log('⚠️ CHECK SERVER CONSOLE FOR OTP CODE ⚠️');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testLogin();
