// Landing Page Logic
document.addEventListener('DOMContentLoaded', async () => {

    // 1. Check Auth & Update UI
    const user = await checkAuth();
    if (user) {
        // Update Nav to Show Dashboard
        const nav = document.querySelector('nav');
        if (nav) {
            nav.innerHTML = `
                <a href="dashboard.html">Dashboard</a>
                <a href="#" id="logout-btn" class="btn">Logout</a>
            `;
            document.getElementById('logout-btn').addEventListener('click', async (e) => {
                e.preventDefault();
                await API.post('/api/auth/logout', {});
                if (window.showLoadingAndRedirect) {
                    window.showLoadingAndRedirect('index.html', 'Logging Out...');
                } else {
                    window.location.href = 'index.html';
                }
            });
        }
    }

    // 2. Load Plans
    try {
        const plans = await API.get('/api/plans');
        const container = document.getElementById('plans-container');
        if (container && Array.isArray(plans)) {
            container.innerHTML = '';
            // USDT Logo SVG
            // USDT Logo Image
            const usdtLogo = `<img src="https://assets.coingecko.com/coins/images/325/large/Tether-logo.png" alt="USDT" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 6px;">`;

            plans.forEach((plan, index) => {
                const el = document.createElement('div');
                el.className = `card reveal reveal-delay-${(index % 3) + 1}`;

                let actionHtml = '';
                if (plan.id === 'free-starter') {
                    actionHtml = `<button onclick="activateFreePlan()" class="btn btn-block btn-animated">Activate Free Trial</button>`;
                } else {
                    // Update to invest.html (or deposit.html? user has invest.html open)
                    // The invest link was `deposit.html?plan=${plan.id}` in original code.
                    // But I saw `invest.html` file open. Let's check if `deposit.html` exists. Yes it does.
                    // I'll stick to `invest.html` if that's what the user implies, but `deposit.html` might be the correct flow.
                    // Actually, `invest.html` seems to be "Confirm Investment".
                    // `deposit.html` might be "Select Payment Method"?
                    // File rendering `invest.html` showed "Confirm Investment".
                    // I will use `invest.html` directly as it seems to be the checkout.
                    // Redirect to general deposit page as requested
                    const investLink = user ? `deposit.html` : 'signup.html';
                    actionHtml = `<a href="${investLink}" class="btn btn-block btn-animated">Invest Now</a>`;
                }

                let cardContent = '';

                if (plan.type === 'free') {
                    cardContent = `
                        <h3>${plan.title}</h3>
                        <div class="roi" style="margin-bottom: 0.5rem; font-size: 1.2rem;">Try for Free</div>
                        <p style="margin-bottom: 1rem; color: var(--text-secondary);">Experience the platform with $2000 virtual funds for 1 hour.</p>
                        <div style="font-weight: 700; font-size: 1.4rem; color: var(--success); margin-bottom: 1.5rem;">
                            Profit: $${plan.returnAmount}
                        </div>
                    `;
                } else {
                    cardContent = `
                        <h3 style="font-size: 1.4rem; margin-bottom: 0.5rem;">${plan.title}</h3>
                        <div style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.2rem;">Price</div>
                            <div style="font-size: 1.8rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
                                ${usdtLogo} ${plan.price} <span style="font-size: 1rem; font-weight: 400; color: var(--text-secondary);">USDT</span>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 2rem;">
                            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.2rem;">Returns</div>
                            <div style="font-size: 2.2rem; font-weight: 800; color: var(--success); text-shadow: 0 0 20px rgba(42, 255, 143, 0.3);">
                                $${plan.returnAmount}
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">Guaranteed Payout</div>
                        </div>
                    `;
                }

                el.innerHTML = `
                    ${cardContent}
                    ${actionHtml}
                `;
                container.appendChild(el);
            });

            // Refresh observer for new elements
            setTimeout(() => {
                const newReveals = document.querySelectorAll('.reveal');
                newReveals.forEach(el => observer.observe(el));
            }, 100);
        }
    } catch (e) {
        console.error('Failed to load plans:', e);
    }

    // 3. Init Hero Animations
    initHeroAnimations();

});

// --- Global Functions & Logic ---

// Free Plan Activation
async function activateFreePlan() {
    const user = await checkAuth();
    if (!user) {
        window.location.href = 'signin.html';
        return;
    }
    if (confirm("Activate $2000 Free Plan for 1 Hour?")) {
        try {
            const res = await API.post('/api/invest/activate-free', {});
            if (res.ok) {
                if (window.showToast) await window.showToast("Free Plan Activated! Profit adds in 1 hour.", "success", "Success");
                window.location.href = 'dashboard.html';
            } else {
                if (window.showToast) await window.showToast(res.error || "Failed to activate", "error", "Error");
            }
        } catch (e) {
            if (window.showToast) await window.showToast("Error activating plan", "error", "Error");
        }
    }
}

// Scroll Reveal Observer
const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
        else entry.target.classList.remove('active');
    });
}, observerOptions);

setTimeout(() => {
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}, 100);

// Hero Animations
function initHeroAnimations() {
    const portfolioValForAnim = document.getElementById('hero-portfolio-val');
    const bars = document.querySelectorAll('.chart-bar');

    if (portfolioValForAnim) {
        let startVal = 1200000;
        const endVal = 1240592;
        const duration = 2000;
        const startTime = performance.now();

        function updateCount(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 4);
            const current = startVal + (endVal - startVal) * ease;

            portfolioValForAnim.textContent = '$' + Math.floor(current).toLocaleString();

            if (progress < 1) requestAnimationFrame(updateCount);
        }
        requestAnimationFrame(updateCount);

        // Live Flux
        setInterval(() => {
            const flux = (Math.random() - 0.4) * 200;
            const currentText = portfolioValForAnim.textContent.replace(/[^0-9]/g, '');
            let val = parseInt(currentText) + flux;
            portfolioValForAnim.textContent = '$' + Math.floor(val).toLocaleString();
        }, 3000);
    }

    // Charts Random Anim
    if (bars.length > 0) {
        setInterval(() => {
            const bar = bars[Math.floor(Math.random() * bars.length)];
            const newHeight = Math.floor(Math.random() * 80) + 20;
            bar.style.height = `${newHeight}%`;
        }, 800);
    }

    // --- NEW: Asset Allocation Cycler ---
    const assetNameEl = document.getElementById('hero-asset-name');
    const assetPctEl = document.getElementById('hero-asset-pct');
    const assetBarEl = document.getElementById('hero-asset-bar');

    if (assetNameEl && assetBarEl) {
        const assets = [
            { name: 'Bitcoin', pct: 63, color: '#F7931A' },
            { name: 'Ethereum', pct: 24, color: '#627EEA' },
            { name: 'Solana', pct: 8, color: '#14F195' },
            { name: 'USDT', pct: 5, color: '#26A17B' }
        ];
        let assetIdx = 0;

        setInterval(() => {
            assetIdx = (assetIdx + 1) % assets.length;
            const asset = assets[assetIdx];

            // Fade Out Text
            assetNameEl.style.opacity = 0;
            assetPctEl.style.opacity = 0;

            setTimeout(() => {
                // Update Data with Live Flux
                const flux = (Math.random() - 0.5) * 5; // Variation of +/- 2.5%
                const livePct = Math.max(1, Math.min(99, asset.pct + flux)).toFixed(1); // 1 decimal place

                assetNameEl.textContent = asset.name;
                assetPctEl.textContent = livePct + '%';
                assetBarEl.style.width = livePct + '%';
                assetBarEl.style.backgroundColor = asset.color;

                // Fade In Text
                assetNameEl.style.opacity = 1;
                assetPctEl.style.opacity = 1;
            }, 300); // Wait for fade out
        }, 3000); // Cycle every 3s
    }

    // --- NEW: Yield Flux Logic ---
    const yieldEl = document.getElementById('hero-yield-val');
    if (yieldEl) {
        let baseYield = 5.24;
        setInterval(() => {
            // Random flux between -0.05 and +0.05
            const change = (Math.random() - 0.5) * 0.1;
            baseYield = Math.max(4.5, Math.min(6.5, baseYield + change)); // Keep within realistic bounds

            yieldEl.textContent = '+ ' + baseYield.toFixed(2) + '%';

            // Visual Pulse
            yieldEl.style.textShadow = '0 0 10px rgba(42, 255, 143, 0.8)';
            setTimeout(() => {
                yieldEl.style.textShadow = 'none';
            }, 500);
        }, 2000);
    }
}

// --- MODERN LIVE FEATURES (Real-Time) ---

// 1. 3D Tilt Effect
document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.glass-card-mockup, .card');
    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        } else {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        }
    });
});

// 2. Real-Time Market Data (Backend Proxy)
const marketMap = {
    'bitcoin': 'card-btc-price',
    'ethereum': 'card-eth-price',
    'solana': 'card-sol-price'
};

async function fetchLivePrices() {
    try {
        // Fetch from OUR Backend (Proxies CoinGecko)
        const res = await fetch('/api/price?coins=bitcoin,ethereum,solana');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();

        // Data format from CoinGecko Simple Price: { bitcoin: { usd: 43000 }, ethereum: { usd: 2300 } ... }
        Object.keys(marketMap).forEach(coinId => {
            const elId = marketMap[coinId];
            if (data[coinId] && data[coinId].usd) {
                updateCard(elId, coinId, data[coinId].usd);
            }
        });

    } catch (err) {
        console.warn('Price Update Fail (using cached UI or previous values):', err);
    }
}

function updateCard(elementId, coinId, currentPrice) {
    const priceEl = document.getElementById(elementId);
    if (!priceEl) return;

    // Update Price Text
    priceEl.textContent = '$' + currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Simulate "Live Pulse" visual effect
    priceEl.style.transition = 'color 0.3s ease';
    priceEl.style.color = '#fff'; // Flash White

    // Update ticker change text to "Live" since we don't have 24h change from simple endpoint
    const changeEl = priceEl.nextElementSibling;
    if (changeEl) {
        changeEl.textContent = "● Live Market Price";
        changeEl.className = "ticker-change up";
        changeEl.style.color = "var(--accent-color)";
    }

    setTimeout(() => {
        priceEl.style.color = ''; // Revert
    }, 500);
}

// Init Data Loop
fetchLivePrices();
setInterval(fetchLivePrices, 10000); // Poll Backend every 10s

