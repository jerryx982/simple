// Toast Notification Logic
function showNotification(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Icon based on type
    let icon = '';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'info') icon = 'ℹ';

    toast.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.2rem; font-weight:bold;">${icon}</span>
            <span class="toast-message">${message}</span>
        </div>
        <button class="toast-close">&times;</button>
        <div class="toast-progress" style="animation-duration: 3s;"></div>
    `;

    // Close Button logic
    toast.querySelector('.toast-close').addEventListener('click', () => {
        hideToast(toast);
    });

    container.appendChild(toast);

    // Auto dismiss
    setTimeout(() => {
        hideToast(toast);
    }, 3000);
}

function hideToast(toast) {
    if (toast.classList.contains('hiding')) return;
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => {
        toast.remove();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchBalance();
    fetchHistory();
    setupEventListeners();
});

let balances = {};
const FEES = {
    'BTC': { 'BTC': 0.0005 },
    'ETH': { 'ERC20': 0.005, 'BEP20': 0.0001 },
    'USDT': { 'ERC20': 10, 'TRC20': 1, 'BEP20': 0.5 }
};
const NETWORKS = {
    'BTC': ['BTC'],
    'ETH': ['ERC20', 'BEP20'],
    'USDT': ['TRC20', 'ERC20', 'BEP20'] // TRC20 first as preferred
};
const MIN_LIMITS = { 'BTC': 0.001, 'ETH': 0.01, 'USDT': 10 };

async function fetchBalance() {
    try {
        const res = await fetch('/api/user/balance');
        if (!res.ok) throw new Error('Failed to fetch balance');
        balances = await res.json();
        updateBalanceDisplay();
    } catch (error) {
        console.error(error);
        showNotification('Error loading balances. Please login.', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
    }
}

function updateBalanceDisplay() {
    const coin = document.getElementById('coin-select').value;
    const balance = balances[coin] || 0;
    document.getElementById('available-balance').textContent = `${balance} ${coin}`;
}

function setupEventListeners() {
    const coinSelect = document.getElementById('coin-select');
    const networkSelect = document.getElementById('network-select');
    const amountInput = document.getElementById('amount-input');
    const withdrawAllBtn = document.getElementById('withdraw-all');
    const submitBtn = document.getElementById('submit-btn');
    const confirmBtn = document.getElementById('confirm-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    // Coin Change -> Update Networks & Balance
    coinSelect.addEventListener('change', () => {
        const coin = coinSelect.value;
        networkSelect.innerHTML = ''; // Clear
        NETWORKS[coin].forEach(net => {
            const opt = document.createElement('option');
            opt.value = net;
            opt.textContent = net;
            networkSelect.appendChild(opt);
        });
        updateBalanceDisplay();
        validateAndCalc();
    });

    // Network/Amount Change -> Recalc
    networkSelect.addEventListener('change', validateAndCalc);
    amountInput.addEventListener('input', validateAndCalc);

    // Withdraw All
    withdrawAllBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent button default (optional)
        const coin = coinSelect.value;
        const balance = balances[coin] || 0;
        const network = networkSelect.value;
        const fee = FEES[coin][network];

        // If we want to withdraw ALL, we set amount such that Amount + Fee = Balance
        // Logic: Input + Fee <= Balance.
        // So Input = Balance - Fee.
        let maxAmount = balance - fee;
        if (maxAmount < 0) maxAmount = 0;

        amountInput.value = maxAmount.toFixed(6); // precision
        validateAndCalc();
    });

    let twoFAEnabled = false;

    // Check 2FA Status early
    async function check2FAStatus() {
        try {
            const res = await fetch('/api/user/me'); // Assuming auth check passes
            const user = await res.json();
            if (user && user.twoFA && user.twoFA.enabled) {
                twoFAEnabled = true;
            }
        } catch (e) { console.error("Auth check fail"); }
    }
    check2FAStatus();

    // Submit -> Show Modal (Logic)
    submitBtn.addEventListener('click', () => {
        if (submitBtn.disabled) return;

        // REFINEMENT: Check 2FA here
        if (!twoFAEnabled) {
            showNotification('2FA Security Required. Redirecting...', 'error');
            setTimeout(() => window.location.href = 'security.html', 1500);
            return;
        }

        const coin = coinSelect.value;
        const amount = amountInput.value;
        const network = networkSelect.value;
        const address = document.getElementById('address-input').value;
        const fee = document.getElementById('fee-display').textContent;
        const total = document.getElementById('total-deduct').textContent;

        // Populate Modal
        document.getElementById('confirm-coin').textContent = coin;
        document.getElementById('confirm-network').textContent = network;
        document.getElementById('confirm-address').textContent = address;
        document.getElementById('confirm-amount').textContent = amount;
        document.getElementById('confirm-fee').textContent = fee;
        document.getElementById('confirm-total').textContent = total;

        document.getElementById('confirmation-modal').style.display = 'flex';
        // Focus OTP input
        setTimeout(() => document.getElementById('withdraw-otp-input').focus(), 100);
    });

    // Modal Actions
    cancelBtn.addEventListener('click', () => {
        document.getElementById('confirmation-modal').style.display = 'none';
    });

    confirmBtn.addEventListener('click', async () => {
        const coin = coinSelect.value;
        const network = networkSelect.value;
        const address = document.getElementById('address-input').value;
        const amount = amountInput.value;
        const otp = document.getElementById('withdraw-otp-input').value; // Get OTP

        if (!otp) {
            showNotification('Please enter 2FA Code', 'error');
            return;
        }

        confirmBtn.textContent = 'Processing...';
        confirmBtn.disabled = true;

        try {
            const res = await fetch('/api/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coin, network, address, amount, otp })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                showNotification('Withdrawal Submitted Successfully!', 'success');
                document.getElementById('confirmation-modal').style.display = 'none';
                fetchBalance(); // Refresh balance
                fetchHistory(); // Refresh history
                amountInput.value = ''; // Reset
                document.getElementById('withdraw-otp-input').value = ''; // Reset OTP
            } else {
                // Handle 2FA specific errors
                if (res.status === 403 && data.redirect) {
                    showNotification('2FA Security Required. Redirecting...', 'error');
                    setTimeout(() => window.location.href = data.redirect, 2000);
                    return;
                }
                showNotification(data.error || 'Withdrawal Failed', 'error');
            }
        } catch (err) {
            showNotification('Network Error', 'error');
        } finally {
            confirmBtn.textContent = 'Confirm Withdrawal';
            confirmBtn.disabled = false;
        }
    });

    // Trigger initial population
    coinSelect.dispatchEvent(new Event('change'));
}

function validateAndCalc() {
    const coin = document.getElementById('coin-select').value;
    const network = document.getElementById('network-select').value;
    const amountVal = parseFloat(document.getElementById('amount-input').value);
    const address = document.getElementById('address-input').value; // Basic check
    const errorMsg = document.getElementById('error-msg');
    const submitBtn = document.getElementById('submit-btn');

    const fee = FEES[coin][network];
    const balance = balances[coin] || 0;
    const min = MIN_LIMITS[coin];

    // Update Fee Display
    document.getElementById('fee-display').textContent = `${fee} ${coin}`;

    // Validations
    let isValid = true;
    let error = '';

    if (!amountVal || isNaN(amountVal)) {
        isValid = false;
        // Don't show error immediately on empty
    } else if (amountVal < min) {
        isValid = false;
        error = `Minimum withdrawal amount is ${min} ${coin}`;
    } else if ((amountVal + fee) > balance) {
        isValid = false;
        error = `Insufficient balance. You need ${amountVal + fee} ${coin}`;
    }

    if (!address || address.length < 10) {
        isValid = false;
        // error = 'Invalid address'; // Maybe too aggressive to show while typing
    }

    // Update Net/Total
    if (!isNaN(amountVal)) {
        document.getElementById('total-deduct').textContent = `${(amountVal + fee).toFixed(6)} ${coin}`; // DEBUG: Showing what leaves balance
    } else {
        document.getElementById('total-deduct').textContent = `-`;
    }

    if (error) {
        errorMsg.textContent = error;
        errorMsg.style.display = 'block';
    } else {
        errorMsg.style.display = 'none';
    }

    submitBtn.disabled = !isValid;
    if (!isValid) submitBtn.classList.add('disabled'); // fallback styling
}

async function fetchHistory() {
    try {
        const res = await fetch('/api/withdraw/history');
        const history = await res.json();
        const container = document.getElementById('history-list');
        container.innerHTML = '';

        if (history.length === 0) {
            container.innerHTML = '<div style="padding:1rem; text-align:center; color:#666;">No withdrawals found</div>';
            return;
        }

        history.forEach(tx => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-header">
                    <span style="font-weight:bold;">${tx.coin} (${tx.network})</span>
                    <span class="status ${tx.status}">${tx.status}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:0.25rem; font-size:0.8rem; color:#888;">
                    <span>${new Date(tx.createdAt).toLocaleString()}</span>
                    <span>${tx.amount} ${tx.coin}</span>
                </div>
                <div style="font-size:0.75rem; color:#666; margin-top:0.25rem;">
                    Addr: ${tx.address.substring(0, 6)}...${tx.address.substring(tx.address.length - 4)}
                </div>
            `;
            container.appendChild(div);
        });
    } catch (err) {
        console.error("History Error", err);
    }
}
