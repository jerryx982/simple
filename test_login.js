
const BASE_URL = 'http://localhost:3000';

async function testAuth() {
    const email = `test${Date.now()}@example.com`;
    const password = 'Password@123!';

    console.log(`Testing with ${email} / ${password}`);

    // 1. Signup
    try {
        const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test User', email, password })
        });

        console.log('Signup Status:', signupRes.status);
        const signupData = await signupRes.json();
        console.log('Signup Data:', signupData);

        if (!signupRes.ok) return;

        // 2. Login
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        console.log('Login Status:', loginRes.status);
        const loginData = await loginRes.json();
        console.log('Login Data:', loginData);

        const cookie = loginRes.headers.get('set-cookie');
        console.log('Login Set-Cookie:', cookie);

        if (!loginRes.ok) return;

        // 3. User Me
        // Need to pass cookies manually in node's fetch? Yes.
        // But fetch in Node doesn't automatically store cookies like a browser.
        // We need to parse set-cookie and send it back.

        if (cookie) {
            const meRes = await fetch(`${BASE_URL}/api/user/me`, {
                headers: {
                    'Cookie': cookie
                }
            });
            console.log('Me Status:', meRes.status);
            const meData = await meRes.json();
            console.log('Me Data:', meData);
        } else {
            console.log('No cookie received from login.');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

testAuth();
