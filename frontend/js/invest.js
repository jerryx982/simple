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
    detailsDiv.innerHTML = `
        <h3>${plan.title} Plan</h3>
        <p>${plan.description}</p>
        <div style="margin-top: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>ROI: <strong style="color: var(--success);">${plan.roiPercent}%</strong></div>
            <div>Term: <strong>${plan.termDays} Days</strong></div>
        </div>
    `;

    const amountInput = document.getElementById('amount');
    const minDepositSpan = document.getElementById('min-deposit');
    amountInput.value = plan.minDeposit;
    amountInput.setAttribute('min', plan.minDeposit);
    minDepositSpan.textContent = plan.minDeposit;

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
                payBtn.textContent = `Pay ${amountInput.value} ETH`;
            } catch (error) {
                showError('User denied wallet connection');
            }
        } else {
            showFallback();
        }
    });

    amountInput.addEventListener('input', () => {
        if (payBtn.style.display === 'block') {
            payBtn.textContent = `Pay ${amountInput.value} ETH`;
        }
    });

    payBtn.addEventListener('click', async () => {
        const amount = amountInput.value;
        if (amount < plan.minDeposit) {
            showError(`Minimum deposit is ${plan.minDeposit} ETH`);
            return;
        }

        payBtn.disabled = true;
        payBtn.textContent = 'Processing...';

        try {
            // Convert to Wei (Hex) - simplified. 
            // In prod use ethers.js or web3.js for precise conversion.
            // 1 ETH = 10^18 Wei. 0.01 ETH = 10^16 Wei.
            const weiValue = '0x' + (parseFloat(amount) * 1e18).toString(16);

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [
                    {
                        from: userAddress,
                        to: '0x0000000000000000000000000000000000000000', // Burn address for demo / internal wallet
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
            payBtn.textContent = `Pay ${amount} ETH`;
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
    document.getElementById('verify-manual').addEventListener('click', async () => {
        const amount = amountInput.value;
        // Simulate a txHash for manual flow
        await verifyPayment('0xMANUAL_' + Date.now(), amount);
    });

    // Handle network switching if needed (optional)
});
