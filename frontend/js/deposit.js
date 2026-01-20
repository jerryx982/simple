// Deposit Page Logic (Gate.io Style)
document.addEventListener('DOMContentLoaded', async () => {
    const user = await requireAuth();
    updateUserHeader(user);

    /* --- State & Elements --- */
    let depositOptions = []; // Will hold data from API
    let selectedCoin = null;
    let selectedNetwork = null;

    // Elements
    const coinSelect = document.getElementById('coin-select');
    const coinOptionsContainer = document.getElementById('coin-options');
    const networkSelect = document.getElementById('network-select');
    const networkOptionsContainer = document.getElementById('network-options');

    // UI Panels
    const depositDetailsPanel = document.getElementById('deposit-details-panel');
    const networkNotice = document.getElementById('network-notice');

    // Data elements
    const qrImg = document.getElementById('qr-img');
    const addressInput = document.getElementById('address-input');
    const copyBtn = document.getElementById('copy-btn');
    const warningCoin = document.getElementById('warning-coin');
    const minDepAmount = document.getElementById('min-dep-amount');
    const depCoinTicker = document.getElementById('dep-coin-ticker');

    /* --- Initialization --- */
    try {
        depositOptions = await API.get('/api/deposit/options');
        initCoinDropdown();
    } catch (err) {
        console.error("Failed to load deposit options", err);
        showAlert("Failed to load deposit options. Please refresh.");
    }

    /* --- Dropdown Logic --- */

    // 1. Coin Dropdown
    function initCoinDropdown() {
        // Populate options
        coinOptionsContainer.innerHTML = depositOptions.map(opt => `
            <div class="custom-option" data-code="${opt.code}">
                <img src="${getCoinLogo(opt.code)}" class="coin-icon" alt="${opt.code}">
                <div>
                    <div style="font-weight: 600;">${opt.code}</div>
                    <div style="font-size: 0.8rem; color: var(--gate-subtext);">${opt.name}</div>
                </div>
            </div>
        `).join('');

        // Toggle
        setupCustomSelect(coinSelect);

        // Selection
        coinOptionsContainer.querySelectorAll('.custom-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                const code = opt.getAttribute('data-code');
                selectCoin(code);
            });
        });
    }

    function selectCoin(code) {
        selectedCoin = depositOptions.find(o => o.code === code);
        selectedNetwork = null; // Reset network

        // Update Trigger Text
        const triggerSpan = coinSelect.querySelector('.custom-select-trigger span');
        triggerSpan.innerHTML = `<img src="${getCoinLogo(code)}" class="coin-icon" alt="${code}"> ${selectedCoin.code} (${selectedCoin.name})`;

        // Close Select
        coinSelect.classList.remove('open');

        // Reset & Populate Network Dropdown
        resetNetworkUI();
        initNetworkDropdown(selectedCoin.networks);

        // Update UI Notices (Partial)
        warningCoin.textContent = code;
        depCoinTicker.textContent = code;
    }

    // 2. Network Dropdown
    function initNetworkDropdown(networks) {
        if (!networks || networks.length === 0) return;

        networkOptionsContainer.innerHTML = networks.map(net => `
            <div class="custom-option" data-net="${net}">
                <span>${net}</span>
            </div>
        `).join('');

        // Enable select
        networkSelect.style.opacity = '1';
        networkSelect.style.pointerEvents = 'auto';

        // Toggle interaction (listener already added via setupCustomSelect if generic, but here we can re-ensure)
        // Actually setupCustomSelect adds listener to the DOM element, so it persists.

        // Selection
        networkOptionsContainer.querySelectorAll('.custom-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const net = opt.getAttribute('data-net');
                selectNetwork(net);
            });
        });

        // If only 1 network, auto-select it? Gate.io usually forces manual, but for UX ease:
        if (networks.length === 1) {
            selectNetwork(networks[0]);
        }
    }

    function selectNetwork(net) {
        selectedNetwork = net;

        // Update Trigger
        const triggerSpan = networkSelect.querySelector('.custom-select-trigger span');
        triggerSpan.textContent = net;

        networkSelect.classList.remove('open');

        // Fetch Address
        fetchDepositAddress(selectedCoin.code, selectedNetwork);
    }

    /* --- Core Actions --- */

    async function fetchDepositAddress(coin, network) {
        // Show Loading
        depositDetailsPanel.style.opacity = '0.5';
        addressInput.value = "Generating address...";
        qrImg.src = "assets/loading_bg.png"; // or spinner placeholder

        try {
            const data = await API.post('/api/deposit/address', { coin, network });

            // Update UI
            depositDetailsPanel.style.opacity = '1';
            depositDetailsPanel.style.pointerEvents = 'auto';

            addressInput.value = data.address;
            qrImg.src = data.qrCode;

            // Show notices
            networkNotice.style.display = 'block';

            // Simulate Min deposit amount variance logic if needed, else static
            minDepAmount.textContent = coin === 'USDT' ? '10' : '0.001';

        } catch (err) {
            console.error(err);
            showAlert(err.error || "Failed to generate address");
            addressInput.value = "Error";
        }
    }

    /* --- Utilities --- */

    function setupCustomSelect(el) {
        el.addEventListener('click', (e) => {
            // Close others
            [coinSelect, networkSelect].forEach(s => {
                if (s !== el) s.classList.remove('open');
            });
            el.classList.toggle('open');
            e.stopPropagation();
        });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        if (!coinSelect.contains(e.target)) coinSelect.classList.remove('open');
        if (!networkSelect.contains(e.target)) networkSelect.classList.remove('open');
    });

    function resetNetworkUI() {
        selectedNetwork = null;
        networkSelect.querySelector('.custom-select-trigger span').textContent = "Select Network";
        networkOptionsContainer.innerHTML = '';
        networkSelect.classList.remove('open');

        // Disable details panel until ready
        depositDetailsPanel.style.opacity = '0.5';
        depositDetailsPanel.style.pointerEvents = 'none';
        addressInput.value = "Select coin & network first";
        qrImg.src = "assets/loading_bg.png";
        networkNotice.style.display = 'none';
    }

    function getCoinLogo(code) {
        const logos = {
            'BTC': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
            'ETH': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
            'USDT': 'https://assets.coingecko.com/coins/images/325/large/Tether-logo.png',
            'BNB': 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
            'SOL': 'https://assets.coingecko.com/coins/images/4128/large/solana.png'
        };
        return logos[code] || 'assets/logo-icon.png';
    }

    /* --- Interaction Buttons --- */

    copyBtn.addEventListener('click', () => {
        if (!addressInput.value || addressInput.value.includes(' ')) return; // Basic validation
        navigator.clipboard.writeText(addressInput.value).then(() => {
            // Use showToast directly, ensure single modern notification
            if (window.showToast) {
                window.showToast("Address copied to clipboard", "success");
            }
        }).catch(() => {
            if (window.showToast) window.showToast("Failed to copy", "error");
        });
    });

    // Handle "I have paid"
    document.getElementById('i-have-paid').addEventListener('click', async (e) => {
        if (e) e.preventDefault();
        if (!selectedCoin || !selectedNetwork) {
            if (window.showToast) window.showToast("Please select a coin and network first", "error");
            return;
        }

        const btn = document.getElementById('i-have-paid');
        // Do not disable permanently, or maybe user wants to click again? 
        // User said "show modern notification", "not redirect".
        // I will keep disable to prevent double-spam but NO redirect.
        btn.disabled = true;
        btn.textContent = 'Verifying...';

        // 1. Show Modern Notification ONLY
        if (window.showToast) {
            window.showToast("Your Account will be credited once the System verified your deposit", "success", "Payment Submitted");
        }

        // 2. Call Backend (Log intent silently)
        try {
            await API.post('/api/payment/verify', {
                planId: 'general_deposit',
                amount: 0,
                txHash: 'MANUAL_' + Date.now(),
                coin: selectedCoin.code,
                network: selectedNetwork
            });
        } catch (err) {
            console.error("Backend log failed", err);
        }

        // REMOVED REDIRECT logic (setTimeout)
        // Reset button after delay? Or keep as "Verifying..."?
        // User didn't specify, but usually good UX to reset or leave as is.
        // I'll leave it as is to indicate state, or maybe reset after 5s.
        setTimeout(() => {
            btn.textContent = 'Payment Sent';
            btn.disabled = false; // Allow re-click if needed? Or keep disabled.
            // keeping it simple as per request: "not redirect user"
        }, 2000);
    });

});
