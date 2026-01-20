document.addEventListener('DOMContentLoaded', async () => {
    await redirectIfAuth();

    const form = document.getElementById('signup-form');
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('strength-bar');
    const errorMsg = document.getElementById('error-msg');

    // Password strength meter
    passwordInput.addEventListener('input', () => {
        const val = passwordInput.value;
        const strengthText = document.getElementById('strength-text');
        let strength = 0;

        if (val.length === 0) {
            strengthBar.style.width = '0%';
            strengthText.textContent = 'Min 5 chars, uppercase, lowercase, number, symbol';
            strengthText.style.color = 'var(--text-secondary)';
            return;
        }

        if (val.length >= 5) strength++;
        if (/[A-Z]/.test(val)) strength++;
        if (/[a-z]/.test(val)) strength++;
        if (/[0-9]/.test(val)) strength++;
        if (/[^A-Za-z0-9]/.test(val)) strength++;

        const width = (strength / 5) * 100;
        strengthBar.style.width = width + '%';

        if (strength < 3) {
            strengthBar.style.backgroundColor = 'var(--error)';
            strengthText.textContent = 'Strength: Weak';
            strengthText.style.color = 'var(--error)';
        } else if (strength < 5) {
            strengthBar.style.backgroundColor = 'orange';
            strengthText.textContent = 'Strength: Fair';
            strengthText.style.color = 'orange';
        } else {
            strengthBar.style.backgroundColor = 'var(--success)';
            strengthText.textContent = 'Strength: Strong';
            strengthText.style.color = 'var(--success)';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.style.display = 'none';

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = passwordInput.value;
        const confirm = document.getElementById('confirm-password').value;

        if (password !== confirm) {
            showError('Passwords do not match');
            return;
        }

        // Strict validation
        const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{5,})");
        if (!strongRegex.test(password)) {
            showError('Password must be at least 5 characters and include uppercase, lowercase, number, and symbol');
            return;
        }

        const res = await API.post('/api/auth/signup', { name, email, password });
        if (res.ok) {
            // Updated to use the animated loading screen
            window.showLoadingAndRedirect('dashboard.html');
        } else {
            showError(res.error || 'Signup failed');
        }
    });

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
    }
});
