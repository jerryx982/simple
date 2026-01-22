document.addEventListener('DOMContentLoaded', async () => {
    const user = await requireAuth();

    // Get Plan ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('plan');

    if (!planId) {
        window.location.href = 'index.html';
        return;
    }

    let plan = null;
    try {
        const plans = await API.get('/api/plans');
        plan = plans.find(p => p.id === planId);
    } catch (e) { console.error(e); }

    if (!plan) {
        await showAlert('Invalid plan');
        window.location.href = 'index.html';
        return;
    }

    // Render Plan Details
    const detailsDiv = document.getElementById('plan-details');
    // Determine return display
    const returnInfo = plan.returnAmount ? `$${plan.returnAmount}` : `${plan.roiPercent}%`;

    detailsDiv.innerHTML = `
        <h3>${plan.title}</h3>
        <p>${plan.description}</p>
        <div style="margin-top: 1rem; display: grid; grid-template-columns: 1fr; gap: 1rem;">
            <div>Returns: <strong style="color: var(--success); font-size: 1.2rem;">${returnInfo}</strong></div>
        </div>
    `;

    const amountInput = document.getElementById('amount');
    const minDepositSpan = document.getElementById('min-deposit');

    // Fixed Price Logic
    const basePrice = plan.price || plan.minDeposit || 0;
    let currentPrice = basePrice;

    amountInput.value = currentPrice;
    amountInput.setAttribute('disabled', 'true');

    // Live Price Update for Investment Page
    async function updateLivePrice() {
        try {
            // Mapping plan to relevant coin for "Live" feel
            const coinMap = { 'starter': 'bitcoin', 'growth': 'ethereum', 'premium': 'solana', 'longterm': 'binancecoin', 'titanium': 'bitcoin' };
            const coinId = coinMap[plan.id] || 'bitcoin';
            const priceData = await API.get(`/api/price?coins=${coinId}`);

            if (priceData && (priceData[coinId] || priceData[coinId.toUpperCase()])) {
                const livePrice = (priceData[coinId] || priceData[coinId.toUpperCase()]).usd;
                // Add a small "Premium" or "Volatility" fluctuation to the base price for "Live" feel
                const fluctuation = (Math.random() - 0.5) * (livePrice * 0.0001);
                currentPrice = basePrice + fluctuation;
                amountInput.value = currentPrice.toFixed(4);
                if (payBtn.style.display !== 'none') {
                    payBtn.textContent = `Pay ${currentPrice.toFixed(2)} USDT`;
                }
            }
        } catch (e) {
            console.warn("Live price update failed:", e);
        }
    }

    // Poll every 15s to match dashboard
    setInterval(updateLivePrice, 15000);
    updateLivePrice(); // Run once immediately

    if (minDepositSpan) {
        minDepositSpan.parentElement.style.display = 'none'; // Hide min deposit hint
    }

    // Wallet Logic
    const connectBtn = document.getElementById('connect-wallet');
    const payBtn = document.getElementById('pay-btn');
    const fallbackDiv = document.getElementById('fallback-payment');
    const fallbackAmount = document.getElementById('fallback-amount');
    const errorMsg = document.getElementById('error-msg');

    let userAddress = null;

    connectBtn.addEventListener('click', async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                userAddress = accounts[0];
                connectBtn.style.display = 'none';
                payBtn.style.display = 'block';
                payBtn.textContent = `Pay ${price} USDT`;
            } catch (error) {
                showError('User denied wallet connection');
            }
        } else {
            showFallback();
        }
    });

    // Removed input event listener since input is disabled

    payBtn.addEventListener('click', async () => {
        const amount = amountInput.value;
        // No min deposit check needed for fixed price

        payBtn.disabled = true;
        payBtn.textContent = 'Processing...';

        try {
            // Simulate USDT Transfer by sending 0 ETH to the demo address
            // In a real app, this would be a contract interaction (ERC20 transfer)
            const weiValue = '0x0';

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [
                    {
                        from: userAddress,
                        to: '0x0000000000000000000000000000000000000000', // Burn address for demo
                        value: weiValue,
                        gas: '0x5208', // 21000 GWEI
                    },
                ],
            });

            // If success, verify on backend
            await verifyPayment(txHash, amount);

        } catch (error) {
            console.error(error);
            showError('Transaction failed: ' + error.message);
            showFallback(); // Show fallback to allow manual retry or instruction
            payBtn.disabled = false;
            payBtn.textContent = `Pay ${amount} USDT`;
        }
    });

    async function verifyPayment(txHash, amount) {
        const res = await API.post('/api/payment/verify', {
            planId: plan.id,
            amount,
            txHash
        });

        if (res.ok) {
            window.location.href = 'dashboard.html';
        } else {
            showError('Payment verification failed: ' + res.error);
        }
    }

    function showFallback() {
        fallbackDiv.style.display = 'block';
        fallbackAmount.textContent = amountInput.value;
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
    }

    // Manual Verify Button (Mock)
    document.getElementById('verify-manual').addEventListener('click', async (e) => {
        if (e) e.preventDefault(); // Prevent accidental form submit

        const amount = amountInput.value;
        const btn = document.getElementById('verify-manual');

        // Disable to prevent double click
        btn.disabled = true;
        btn.textContent = 'Verifying...';

        console.log("Manual Verify Clicked"); // Debug

        // 1. Show Modern Notification (Success Mock)
        // message: "Your Account will be credited once the System verified your deposit"
        // 1. Show Modern Notification (Success Mock)
        if (window.showToast) {
            window.showToast("Your Account will be credited once the System verified your deposit", "success", "Payment Submitted");
        }

        // 2. Call Backend (to record the intent)
        try {
            await API.post('/api/payment/verify', {
                planId: plan.id,
                amount,
                txHash: 'MANUAL_' + Date.now()
            });
        } catch (err) {
            console.error("Backend log failed", err);
        }

        // REMOVED REDIRECT to match deposit.js behavior
        setTimeout(() => {
            btn.textContent = 'Payment Sent';
            btn.disabled = false;
        }, 2000);
    });

    // Handle network switching if needed (optional)
});
