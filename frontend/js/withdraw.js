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
        <div class="toast-progress" style="animation-duration: 4s;"></div>
    `;

    // Close Button logic
    toast.querySelector('.toast-close').addEventListener('click', () => {
        hideToast(toast);
    });

    container.appendChild(toast);

    // Auto dismiss
    setTimeout(() => {
        hideToast(toast);
    }, 4000);
}

function hideToast(toast) {
    if (toast.classList.contains('hiding')) return;
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => {
        toast.remove();
    });
}

// Config
const COINS = {
    'USDT': { name: 'Tether', network: ['TRC20', 'ERC20', 'BEP20'], img: 'https://assets.coingecko.com/coins/images/325/large/Tether-logo.png' },
    'BTC': { name: 'Bitcoin', network: ['BTC'], img: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
    'ETH': { name: 'Ethereum', network: ['ERC20', 'BEP20'], img: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
    'SOL': { name: 'Solana', network: ['Solana'], img: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
    'BNB': { name: 'BNB', network: ['BEP20 (BSC)'], img: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' }
};
const FEES = {
    'USDT': { 'TRC20': 1, 'ERC20': 10, 'BEP20': 0.5 },
    'BTC': { 'BTC': 0.0005 },
    'ETH': { 'ERC20': 0.005, 'BEP20': 0.0001 },
    'SOL': { 'Solana': 0.01 },
    'BNB': { 'BEP20 (BSC)': 0.0005 }
};
const MIN_LIMITS = { 'BTC': 0.001, 'ETH': 0.01, 'USDT': 10, 'SOL': 0.1, 'BNB': 0.01 };

let balances = {};

document.addEventListener('DOMContentLoaded', () => {
    initCustomDropdown(); // Setup new UI
    fetchBalance();

    // Auth Check
    requireAuth().then(user => {
        if (window.updateUserHeader) updateUserHeader(user);
    });

    setupEventListeners();
});

// --- 1. Custom Dropdown Logic ---
function initCustomDropdown() {
    const wrapper = document.querySelector('.custom-select-wrapper');
    const trigger = document.querySelector('.custom-select-trigger');
    const optionsContainer = document.querySelector('.custom-options');
    const hiddenInput = document.getElementById('coin-select-value');

    // Populate Options
    Object.keys(COINS).forEach(symbol => {
        const coin = COINS[symbol];
        const option = document.createElement('div');
        option.className = 'custom-option';
        option.dataset.value = symbol;
        option.innerHTML = `
            <img src="${coin.img}" style="width:24px; height:24px; border-radius:50%;">
            <span>${symbol}</span>
            <span style="color:#666; font-size:0.8rem; margin-left:auto;">${coin.name}</span>
        `;

        option.addEventListener('click', () => {
            // Update UI
            document.getElementById('selected-coin-display').innerHTML = `
                <img src="${coin.img}" style="width:24px; height:24px; border-radius:50%;">
                <span>${symbol}</span>
            `;
            hiddenInput.value = symbol;
            trigger.classList.remove('open');
            wrapper.classList.remove('open');

            // Trigger Change Logic
            onCoinChange(symbol);
        });

        optionsContainer.appendChild(option);
    });

    trigger.addEventListener('click', () => {
        wrapper.classList.toggle('open');
    });

    // Outside click close
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            wrapper.classList.remove('open');
        }
    });

    // Default Select first
    const firstCoin = 'USDT';
    const firstOpt = optionsContainer.querySelector(`[data-value="${firstCoin}"]`);
    if (firstOpt) firstOpt.click();
}

function onCoinChange(symbol) {
    const networkSelect = document.getElementById('network-select');
    networkSelect.innerHTML = ''; // Clear

    // Populate Networks
    const networks = COINS[symbol].network;
    networks.forEach(net => {
        const opt = document.createElement('option');
        opt.value = net;
        opt.textContent = net;
        networkSelect.appendChild(opt);
    });

    updateBalanceDisplay(symbol);
    validateAndCalc();
}

// --- 2. Input & Logic ---

async function fetchBalance() {
    try {
        const res = await fetch('/api/user/balance');
        if (!res.ok) throw new Error('Failed to fetch balance');
        balances = await res.json();
        const currentCoin = document.getElementById('coin-select-value').value;
        if (currentCoin) updateBalanceDisplay(currentCoin);
    } catch (error) {
        console.error(error);
    }
}

function updateBalanceDisplay(coin) {
    const balance = balances[coin] || 0;
    const availEl = document.getElementById('available-balance');
    availEl.textContent = `${balance} ${coin}`;
}

function setupEventListeners() {
    const networkSelect = document.getElementById('network-select');
    const amountInput = document.getElementById('amount-input');
    const withdrawAllBtn = document.getElementById('withdraw-all');
    const submitBtn = document.getElementById('submit-btn');

    networkSelect.addEventListener('change', validateAndCalc);
    amountInput.addEventListener('input', validateAndCalc);

    // MAX Button
    withdrawAllBtn.addEventListener('click', () => {
        const coin = document.getElementById('coin-select-value').value;
        if (!coin) return;
        const balance = balances[coin] || 0;
        const network = networkSelect.value;
        const fee = (FEES[coin] && FEES[coin][network]) ? FEES[coin][network] : 0;

        let max = balance - fee;
        if (max < 0) max = 0;

        amountInput.value = max.toFixed(6);
        validateAndCalc();
    });

    // SUBMIT -> GATED LOGIC
    submitBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Stop form

        if (submitBtn.classList.contains('disabled') || submitBtn.disabled) return;

        // Perform final soft check
        const amount = parseFloat(amountInput.value);
        if (!amount || amount <= 0) {
            showNotification("Please enter a valid amount", "error");
            return;
        }

        // --- THE NEW LOGIC: BLOCK TRANSACTION ---
        showBuyPinModal();
    });
}

function validateAndCalc() {
    const coin = document.getElementById('coin-select-value').value;
    const network = document.getElementById('network-select').value;
    const amountVal = parseFloat(document.getElementById('amount-input').value);
    const submitBtn = document.getElementById('submit-btn');

    if (!coin || !network) return;

    const fee = (FEES[coin] && FEES[coin][network]) ? FEES[coin][network] : 0;
    const balance = balances[coin] || 0;
    const min = MIN_LIMITS[coin] || 0;

    // Update Fee Display
    document.getElementById('fee-display').textContent = `${fee} ${coin}`;

    let isValid = true;
    let error = '';

    if (!amountVal || isNaN(amountVal)) {
        isValid = false;
    } else if (amountVal < min) {
        isValid = false;
        error = `Minimum withdrawal is ${min} ${coin}`;
    } else if ((amountVal + fee) > balance) {
        isValid = false;
        error = `Insufficient funds. Needed: ${(amountVal + fee).toFixed(6)}`;
    }

    // Update Total Deduct
    if (!isNaN(amountVal)) {
        document.getElementById('total-deduct').textContent = `${(amountVal + fee).toFixed(6)} ${coin}`;
    } else {
        document.getElementById('total-deduct').textContent = `0.00`;
    }

    // Since we removed the explicit error msg div in the new HTML structure 
    // we just toggle the button state or show a tooltip if needed.
    // For now, simpler disable logic.

    submitBtn.disabled = !isValid;
    if (!isValid) {
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
    } else {
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    }
}

// --- 3. Buy PIN Modal/Notification Logic ---
function showBuyPinModal() {
    // Create a custom modern modal on the fly or use sweetalert logic if available.
    // Here we inject a high-z-index modal directly into body.

    const existing = document.getElementById('pin-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'pin-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(5px);
    `;

    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1e1e2d 0%, #2a2a40 100%); 
                    padding: 2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); 
                    text-align: center; max-width: 400px; width: 90%; 
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5); relative;">
            
            <div style="margin-bottom: 1.5rem; color: #f7a600;">
                <svg viewBox="0 0 24 24" style="width:60px; height:60px; fill:currentColor;">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
            </div>
            
            <h2 style="color: white; margin: 0 0 0.5rem 0;">Withdrawal Locked</h2>
            <p style="color: #aaa; margin-bottom: 2rem; line-height: 1.5;">
                A generic withdrawal restriction is active on this account. <br>
                <strong>You must purchase a Withdrawal PIN to proceed.</strong>
            </p>

            <button id="close-pin-modal" style="
                background: linear-gradient(90deg, #f7a600, #ff8c00);
                border: none; padding: 0.8rem 2rem; border-radius: 2rem;
                color: #000; font-weight: bold; cursor: pointer;
                transition: transform 0.2s;
            ">Buy Withdrawal PIN</button>

            <button id="close-pin-secondary" style="
                display: block; margin: 1rem auto 0; background: none; border: none;
                color: #666; font-size: 0.9rem; cursor: pointer; text-decoration: underline;
            ">Cancel</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Event Listeners for the modal
    const close = () => modal.remove();
    const buyAction = () => {
        // Here you would redirect to a support chat or payment page
        window.location.href = "mailto:support@chainvest.com?subject=Buy Withdrawal PIN";
        close();
    };

    modal.querySelector('#close-pin-secondary').addEventListener('click', close);
    modal.querySelector('#close-pin-modal').addEventListener('click', buyAction);
}
