document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth & Data Load
    const user = await requireAuth();
    updateUserHeader(user);
    loadProfile(user);

    // 2. Setup Event Listeners
    setupProfileListeners();
});

// Load Profile Data into UI
function loadProfile(user) {
    // Text Data
    document.getElementById('display-fullname').textContent = user.fullName || user.name || 'User';
    document.getElementById('display-email').textContent = user.email;
    document.getElementById('fullname-input').value = user.fullName || '';
    document.getElementById('email-input').value = user.email;
    document.getElementById('phone-input').value = user.phone || '';

    // KYC
    const kycBadge = document.getElementById('kyc-status');
    kycBadge.textContent = user.kycStatus || 'Not Verified';
    if (user.kycStatus === 'Verified') kycBadge.classList.add('verified');
    else kycBadge.classList.remove('verified');

    // Avatar
    updateAvatarUI(user.avatar); // Ensure 'avatar' field matches backend response
}

function updateAvatarUI(avatarPath) {
    const img = document.getElementById('profile-image');
    const placeholder = document.getElementById('profile-placeholder');

    if (avatarPath) {
        img.src = avatarPath + '?t=' + new Date().getTime(); // Bust cache
        img.style.display = 'block';
        placeholder.style.display = 'none';

        // Update header icon too if possible (optional)
        // const headerIcon = document.querySelector('.profile-icon');
        // if(headerIcon) headerIcon.innerHTML = `<img src="${avatarPath}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    } else {
        img.style.display = 'none';
        placeholder.style.display = 'flex';
    }
}

function setupProfileListeners() {
    // --- File Upload ---
    const fileInput = document.getElementById('profile-upload-input');

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation (Frontend)
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showToast('Invalid file type. Use JPG, PNG, or WEBP.', 'error');
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB
            showToast('File too large (Max 2MB).', 'error');
            return;
        }

        // Upload
        const spinner = document.getElementById('upload-spinner');
        spinner.style.display = 'block';

        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            // Use raw fetch for FormData handling
            const res = await fetch('/api/user/profile/upload', {
                method: 'POST',
                body: formData
                // Note: Content-Type is auto-set by browser for FormData
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showToast('Profile picture updated successfully!', 'success');
                updateAvatarUI(data.avatar);
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (err) {
            console.error(err);
            showToast(err.message, 'error');
        } finally {
            spinner.style.display = 'none';
            fileInput.value = ''; // Reset
        }
    });

    // --- Edit Text Profile (Simplified) ---
    const editBtn = document.getElementById('edit-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const saveBtn = document.getElementById('save-profile-btn');
    const viewActions = document.getElementById('view-mode-actions');
    const editActions = document.getElementById('edit-mode-actions');
    const inputs = ['fullname-input', 'phone-input'];

    let originalData = {};

    editBtn.addEventListener('click', () => {
        inputs.forEach(id => {
            const el = document.getElementById(id);
            originalData[id] = el.value;
            el.removeAttribute('readonly');
            el.classList.remove('readonly-input');
        });
        viewActions.style.display = 'none';
        editActions.style.display = 'flex';
    });

    cancelBtn.addEventListener('click', () => {
        inputs.forEach(id => {
            const el = document.getElementById(id);
            el.value = originalData[id] || '';
            el.setAttribute('readonly', 'true');
            el.classList.add('readonly-input');
        });
        viewActions.style.display = 'block';
        editActions.style.display = 'none';
    });

    document.getElementById('profile-text-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        saveBtn.textContent = 'Saving...';

        const fullName = document.getElementById('fullname-input').value;
        const phone = document.getElementById('phone-input').value;

        try {
            const res = await API.put('/api/user/profile', { fullName, phone });
            if (res.ok) {
                showToast('Profile details updated.', 'success');
                // Lock inputs
                inputs.forEach(id => {
                    const el = document.getElementById(id);
                    el.setAttribute('readonly', 'true');
                    el.classList.add('readonly-input');
                });
                viewActions.style.display = 'block';
                editActions.style.display = 'none';

                // Update Badge
                document.getElementById('display-fullname').textContent = fullName || 'User';
            } else {
                throw new Error(res.error || 'Update failed');
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            saveBtn.textContent = 'Save Changes';
        }
    });
}

// Modern Toast Notification
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <span style="font-size:1.2rem; cursor:pointer;" onclick="this.parentElement.remove()">&times;</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
