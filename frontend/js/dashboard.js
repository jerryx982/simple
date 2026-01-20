// Dashboard 2.0 Logic - Granular Wallet & Premium Box
document.addEventListener('DOMContentLoaded', async () => {
    // Auth & Init
    const user = await requireAuth();
    if (window.updateUserHeader) updateUserHeader(user);

    // References
    const portfolioTotalEl = document.getElementById('portfolio-total');
    const portfolioChangeEl = document.getElementById('portfolio-change');
    const holdingsListEl = document.getElementById('holdings-list');
    const marketsListEl = document.getElementById('markets-list');
    const premiumBoxContainer = document.getElementById('premium-box-container');
    const pbPlanName = document.getElementById('pb-plan-name');
    const pbTimer = document.getElementById('pb-timer');
    const pbProfit = document.getElementById('pb-profit');

    // Chart Instances
    let portfolioChart = null;
    let allocationChart = null;

    // Initial Fallback Prices (to prevent "Loading" hang)
    let prices = {
        'BTC': 90000,
        'ETH': 3000,
        'SOL': 120,
        'BNB': 900,
        'USDT': 1
    }; // Live prices cache

    // Coin Config
    const COINS = {
        'USDT': { id: 'tether', name: 'Tether', color: '#26A17B', img: 'https://assets.coingecko.com/coins/images/325/large/Tether-logo.png' },
        'BTC': { id: 'bitcoin', name: 'Bitcoin', color: '#F7931A', img: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
        'ETH': { id: 'ethereum', name: 'Ethereum', color: '#627EEA', img: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
        'SOL': { id: 'solana', name: 'Solana', color: '#14F195', img: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
        'BNB': { id: 'binancecoin', name: 'BNB', color: '#F3BA2F', img: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' }
    };

    // --- 1. Initialization ---
    initCharts();

    // Immediate Initial Render with fallback prices (avoids "Loading..." hang)
    renderHoldings(Object.keys(COINS).map(symbol => ({
        symbol, amount: 0, price: prices[symbol], value: 0, ...COINS[symbol]
    })));

    // Run real update
    updateDashboard();

    // Fast poll for Prices & DB Updates (simulating live feel)
    // Reduced frequency to 30s to avoid rate limits and lag
    setInterval(updateDashboard, 30000);

    // Live Chart Animation (Lively feel without hitting API)
    // Moves chart every 5s using simulated micro-fluctuations
    setInterval(() => {
        if (prices['BTC']) updatePortfolioChart(prices['BTC']);
    }, 5000);

    // --- 3. Core Logic ---
    async function updateDashboard() {
        try {
            // A. Fetch User Data (Wallet & Box State)
            const userData = await API.get('/api/user/me');
            const wallet = userData.wallet || {};
            const invBox = userData.investmentBox || {};

            // B. Fetch Prices (if needed/stale)
            // Note: In real app, maybe cache better. Here we call proxy.
            try {
                const priceData = await API.get('/api/price?coins=bitcoin,ethereum,solana,binancecoin,tether');
                if (priceData) {
                    // Update cache
                    Object.keys(COINS).forEach(symbol => {
                        const id = COINS[symbol].id;
                        if (priceData[id]) prices[symbol] = priceData[id].usd;
                    });
                }
            } catch (e) { console.warn("Price fetch failed, using cached", e); }

            // Ensure we have some prices for calculation (fallback if all else fails)
            if (!prices['USDT']) prices['USDT'] = 1;

            // C. Calculate Total Balance
            let totalBalance = 0;
            let holdings = [];

            Object.keys(COINS).forEach(symbol => {
                const amount = wallet[symbol] || 0;
                const price = prices[symbol] || 0;
                const value = amount * price;
                totalBalance += value;

                holdings.push({ symbol, amount, price, value, ...COINS[symbol] });
            });

            // Update Header Display
            portfolioTotalEl.textContent = `$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            // Simulate lively ticker
            portfolioChangeEl.innerHTML = `+${(12.5 + Math.random() * 0.5).toFixed(2)}%`;

            // D. Render Assets List
            renderHoldings(holdings);

            // E. Render Markets List
            renderMarkets();

            // F. Update Charts
            // Use live price for "Trading Chart" visual
            updateAllocationChart(holdings, totalBalance);
            updatePortfolioChart(prices['BTC'] || 0);

            // G. Update Premium 3D Box
            updatePremiumBox(invBox);

        } catch (err) {
            console.error("Dashboard Sync Error:", err);
        }
    }

    function renderHoldings(holdings) {
        // Sort by value desc
        holdings.sort((a, b) => b.value - a.value);

        holdingsListEl.innerHTML = holdings.map(h => `
            <div class="holding-item">
                <div class="coin-info">
                    <img src="${h.img}" class="coin-icon">
                    <div>
                        <span class="coin-name">${h.symbol}</span>
                        <span class="coin-sub">${h.name}</span>
                    </div>
                </div>
                <div class="coin-balance">
                    <span class="coin-val">${h.amount.toLocaleString()} ${h.symbol}</span>
                    <span class="coin-sub">$${h.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div class="coin-change ${Math.random() > 0.3 ? 'positive' : 'negative'}">
                    ${Math.random() > 0.3 ? '+' : ''}${(Math.random() * 5).toFixed(2)}%
                </div>
            </div>
        `).join('');
    }

    function renderMarkets() {
        // Just render the supported coins with current prices
        marketsListEl.innerHTML = Object.keys(COINS).map(sym => {
            const coin = COINS[sym];
            const price = prices[sym] || 0;
            return `
                <div class="market-row">
                    <div class="coin-info">
                        <img src="${coin.img}" style="width:28px; height:28px; border-radius:50%">
                        <div>
                            <div style="font-weight:600">${sym}</div>
                            <div style="font-size:0.75rem; color: #8b949e">${coin.name}</div>
                        </div>
                    </div>
                    <div style="font-weight:600">$${price.toLocaleString()}</div>
                    <div class="positive">+${(Math.random() * 2 + 1).toFixed(2)}%</div>
                </div>
            `;
        }).join('');
    }

    function updatePremiumBox(boxState) {
        if (!boxState) {
            premiumBoxContainer.style.display = 'none';
            return;
        }

        premiumBoxContainer.style.display = 'flex';
        pbPlanName.textContent = boxState.planName || 'Active Plan';

        // Status Logic: Check string status directly
        // 'Activated' vs 'Ended' (or anything else)
        const status = boxState.status || 'Ended';
        const isActive = status.toLowerCase() === 'activated';

        pbTimer.textContent = status.toUpperCase();
        pbTimer.style.color = isActive ? '#2aff8f' : '#ff4d4d'; // Green or Red
        pbTimer.style.borderColor = isActive ? 'rgba(42, 255, 143, 0.3)' : 'rgba(255, 77, 77, 0.3)';

        const profitVal = boxState.profit || 0;
        pbProfit.textContent = `+$${profitVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }

    /* --- Chart Logic --- */
    function initCharts() {
        // Allocation Chart (Donut)
        const ctxAlloc = document.getElementById('allocationChart').getContext('2d');
        allocationChart = new Chart(ctxAlloc, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.label + ': $' + context.raw.toLocaleString();
                            }
                        }
                    }
                },
                animation: { duration: 500 }
            }
        });

        // Portfolio Chart (Trading View Style)
        const ctxPort = document.getElementById('portfolioChart').getContext('2d');

        // Technical Gradient
        const gradient = ctxPort.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(0, 229, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');

        portfolioChart = new Chart(ctxPort, {
            type: 'line',
            data: {
                labels: Array(20).fill(''), // Placeholder time slots
                datasets: [{
                    label: 'BTC Price',
                    data: Array(20).fill(null), // Start empty/null to show "zero" or waiting
                    borderColor: '#00E5FF',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4, // Smooth curve
                    pointRadius: 0, // Hide points for smoother look
                    pointBackgroundColor: '#1e1e2d',
                    pointBorderColor: '#00E5FF',
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#00E5FF',
                    pointHoverBorderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false, // Show tooltip on hover anywhere near the x-axis index
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(20, 30, 48, 0.9)',
                        titleColor: '#8b949e',
                        bodyColor: '#00E5FF',
                        bodyFont: { weight: 'bold', size: 14 },
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            title: () => 'Price Action', // Static title as requested or dynamic
                            label: (context) => {
                                const val = context.raw || 0;
                                return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true, // Show X-axis for "chart" feel
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        },
                        ticks: { display: false } // Hide labels if no real time data
                    },
                    y: {
                        display: true, // Show Y-axis
                        position: 'right', // typical for trading apps
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            borderDash: [5, 5],
                            drawBorder: false
                        },
                        ticks: {
                            color: '#555',
                            font: { size: 10 },
                            callback: function (value) {
                                return '$' + (value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value);
                            }
                        }
                    }
                },
                animation: { duration: 0 } // Instant updates for "live" feel
            }
        });
    }

    function updateAllocationChart(holdings, total) {
        if (!allocationChart) return;

        // Pass 0 if total is 0 to clear chart or show empty state
        if (total === 0) {
            // Default Market Cap Distribution (Approx) for "Live" feel
            const defaultLabels = ['BTC', 'ETH', 'BNB', 'SOL', 'USDT'];
            const defaultData = [50, 25, 10, 10, 5];
            const defaultColors = ['#F7931A', '#627EEA', '#F3BA2F', '#14F195', '#26A17B'];

            allocationChart.data.labels = defaultLabels;
            allocationChart.data.datasets[0].data = defaultData;
            allocationChart.data.datasets[0].backgroundColor = defaultColors;
            allocationChart.update();

            document.getElementById('allocation-legend').innerHTML = `
                <div style="text-align:center; font-size:0.8rem; color:#888; margin-bottom:0.5rem">(Market Distribution)</div>
                ${defaultLabels.map((lbl, i) => `
                <div style="display:flex; justify-content:space-between; margin-bottom:6px; color:#ccc;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="width:10px; height:10px; border-radius:50%; background:${defaultColors[i]}"></span>
                        <span style="font-weight:600">${lbl}</span>
                    </div>
                    <div style="font-weight:600">${defaultData[i]}%</div>
                </div>
                `).join('')}
            `;
            return;
        }

        // Filter small dust
        const significant = holdings.filter(h => h.value > 0);

        const labels = significant.map(h => h.symbol);
        const data = significant.map(h => h.value);
        const colors = significant.map(h => h.color);

        allocationChart.data.labels = labels;
        allocationChart.data.datasets[0].data = data;
        allocationChart.data.datasets[0].backgroundColor = colors;
        allocationChart.update();

        // Legend Update
        const legendContainer = document.getElementById('allocation-legend');
        legendContainer.innerHTML = significant.map(h => {
            const pct = ((h.value / total) * 100).toFixed(1);
            return `
                <div style="display:flex; justify-content:space-between; margin-bottom:6px; color:#ccc;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="width:10px; height:10px; border-radius:50%; background:${h.color}"></span>
                        <span style="font-weight:600">${h.symbol}</span>
                    </div>
                    <div style="font-weight:600">${pct}%</div>
                </div>
            `;
        }).join('');
    }

    // Persist last value for smoothing
    let lastChartValue = null;

    function updatePortfolioChart(targetVal) {
        if (!portfolioChart) return;

        // Initialize if first run
        if (lastChartValue === null) lastChartValue = targetVal;

        // Smoothing Logic: Move 5% towards target per tick + small Micro-movement
        const step = (targetVal - lastChartValue) * 0.05;

        // Add tiny consistent noise for "living" feel
        const noise = (Math.random() - 0.5) * (targetVal * 0.001);

        let nextVal = lastChartValue + step + noise;
        lastChartValue = nextVal;

        const data = portfolioChart.data.datasets[0].data;
        data.shift();
        data.push(nextVal);

        portfolioChart.update('none');
    }
});
