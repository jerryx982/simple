document.addEventListener('DOMContentLoaded', async () => {
    await redirectIfAuth();

    const form = document.getElementById('signin-form');
    const errorMsg = document.getElementById('error-msg');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.style.display = 'none';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        // Remember me logic is often handled by cookie persistence config on server
        // or passing a flag. Server implementation just does strict cookies for now.

        const res = await API.post('/api/auth/login', { email, password });
        if (res.ok) {
            window.showModernAlert('You have successfully logged in.', 'Login Successful', 'success'); // Non-blocking
            // window.showToastAfterRedirect('Sign in successful!', 'success');
            // Using new loading animation instead of toast+redirect
            window.showLoadingAndRedirect('dashboard.html');
        } else {
            errorMsg.textContent = res.error || 'Login failed';
            errorMsg.style.display = 'block';
        }
    });
});
