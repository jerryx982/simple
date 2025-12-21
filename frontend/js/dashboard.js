document.addEventListener('DOMContentLoaded', async () => {
    const user = await requireAuth();

    updateUserHeader(user);
    document.getElementById('balance-display').textContent = `$${user.balance.toFixed(2)}`;

    // User Menu Toggle handled by app.js

    // Logout handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await API.post('/api/auth/logout', {});
            window.location.href = 'signin.html';
        });
    }

    // Render investments
    const list = document.getElementById('investments-list');
    if (user.investments.length === 0) {
        list.innerHTML = '<p style="color: var(--text-secondary);">No active investments yet.</p>';
        return;
    }

    list.innerHTML = '';
    user.investments.forEach(inv => {
        const startDate = new Date(inv.startDate);
        const endDate = new Date(inv.endDate);
        const now = new Date();

        const totalDuration = endDate - startDate;
        const elapsed = now - startDate;
        let progress = (elapsed / totalDuration) * 100;
        if (progress > 100) progress = 100;
        if (progress < 0) progress = 0;

        const el = document.createElement('div');
        el.className = 'card';
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
        el.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h3 style="margin:0;">${inv.planTitle || 'Investment'}</h3>
                <span style="color: ${inv.status === 'active' ? 'var(--success)' : 'var(--text-secondary)'}" 
                      style="font-weight: bold; text-transform: uppercase; font-size: 0.8rem;">
                    ${inv.status}
                </span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                <span>Invested: ${inv.amount} ETH</span>
                <span>ROI: ${inv.roiPercent}%</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${progress}%"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem;">
                <span>Start: ${startDate.toLocaleDateString()}</span>
                <span>End: ${endDate.toLocaleDateString()}</span>
            </div>
        `;
        list.appendChild(el);
    });
});


// Charts and Ticker Logic
const users = [
    "Michael A.",
    "Sarah K.",
    "David O.",
    "Blessing T.",
    "John P.",
    "Daniel M."
];

const amounts = [
    "$120",
    "$250",
    "$500",
    "$1,000",
    "$2,300"
];

function randomWithdrawal() {
    const user = users[Math.floor(Math.random() * users.length)];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];
    return `${user} just withdrew ${amount}`;
}

const withdrawalItem = document.getElementById("withdrawal-item");

function updateWithdrawal() {
    if (!withdrawalItem) return;
    withdrawalItem.textContent = randomWithdrawal();
    withdrawalItem.style.animation = "none";
    withdrawalItem.offsetHeight; // reset animation
    withdrawalItem.style.animation = "slideUpDown 4s ease-in-out";
}

function initChart() {
    const canvas = document.getElementById('portfolioChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;

    // Handle resizing
    const resizeCanvas = () => {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    // Initial size
    setTimeout(resizeCanvas, 0);

    // Fake Data Generators
    const generateData = (points, startVal) => {
        let data = [];
        let val = startVal;
        for (let i = 0; i < points; i++) {
            val = val + (Math.random() - 0.5) * 5;
            if (val < 10) val = 10;
            data.push(val);
        }
        return data;
    };

    let data = generateData(40, 100); // Initial data

    // Live Update Loop
    let lastTime = 0;
    const animate = (timestamp) => {
        if (timestamp - lastTime > 1000) { // Update every 1 second
            // Shift data
            const lastVal = data[data.length - 1];
            let newVal = lastVal + (Math.random() - 0.5) * 5;
            if (newVal < 10) newVal = 10;

            data.shift();
            data.push(newVal);
            lastTime = timestamp;
        }

        drawChart();
        animationFrameId = requestAnimationFrame(animate);
    };

    // Start animation
    requestAnimationFrame(animate);

    // Tooltip Element
    const tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    canvas.parentElement.appendChild(tooltip);

    // Click Interaction
    canvas.addEventListener('click', (e) => {
        console.log('Chart clicked');
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;

        const w = canvas.width;
        const h = canvas.height;
        const padding = { top: 20, right: 30, bottom: 30, left: 40 };

        // 1. Recalculate Scale based on CURRENT data
        if (data.length < 2) return;
        const maxVal = Math.max(...data) + 5;
        const minVal = Math.min(...data) - 5;
        const range = maxVal - minVal;
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        // Define Local getY for accuracy
        const getLocalY = (v) => padding.top + chartH - ((v - minVal) / range) * chartH;

        // 2. Find Index
        // i = ((x - padding.left) / chartW) * (len-1)
        let i = Math.round(((x - padding.left) / chartW) * (data.length - 1));

        // Bounds check
        if (i < 0) i = 0;
        if (i >= data.length) i = data.length - 1;

        const val = data[i];
        const prev = i > 0 ? data[i - 1] : val;
        const change = prev !== 0 ? ((val - prev) / prev) * 100 : 0;
        const isUp = change >= 0;

        // 3. Position Tooltip
        const pointX = padding.left + (i / (data.length - 1)) * chartW;
        const pointY = getLocalY(val);

        console.log(`Point: ${pointX}, ${pointY} | Val: ${val}`);

        tooltip.style.left = `${pointX}px`;
        tooltip.style.top = `${pointY - 45}px`; // Moved up a bit more to clear finger/cursor
        tooltip.style.opacity = '1';

        tooltip.innerHTML = `
            <div style="font-weight:bold;">$${val.toFixed(2)}</div>
            <div style="color:${isUp ? 'var(--success)' : 'var(--error)'}; font-size: 0.8rem;">
                ${isUp ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%
            </div>
            <div style="color: var(--text-secondary); font-size: 0.7rem; margin-top:2px;">
                ${i === data.length - 1 ? 'Now' : `-${data.length - i}s ago`}
            </div>
        `;

        if (tooltip.timeout) clearTimeout(tooltip.timeout);
        tooltip.timeout = setTimeout(() => {
            tooltip.style.opacity = '0';
        }, 3000);
    });

    function drawChart() {
        const w = canvas.width;
        const h = canvas.height;
        const padding = { top: 20, right: 30, bottom: 30, left: 40 };

        ctx.clearRect(0, 0, w, h);

        if (data.length < 2) return;

        const maxVal = Math.max(...data) + 5;
        const minVal = Math.min(...data) - 5;
        const range = maxVal - minVal;

        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        const getX = (i) => padding.left + (i / (data.length - 1)) * chartW;
        const getY = (val) => padding.top + chartH - ((val - minVal) / range) * chartH;

        // Draw Y Axis Labels & Grid
        ctx.fillStyle = '#8b949e';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.strokeStyle = '#30363d';
        ctx.lineWidth = 0.5;

        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const val = minVal + (range / ySteps) * i;
            const y = getY(val);

            // Grid line
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(w - padding.right, y);
            ctx.stroke();

            // Label
            ctx.fillText('$' + Math.floor(val), padding.left - 5, y + 3);
        }

        // Draw X Axis Labels (just numbers/time proxy)
        ctx.textAlign = 'center';
        const xSteps = 5;
        for (let i = 0; i <= xSteps; i++) {
            const index = Math.floor((data.length - 1) * (i / xSteps));
            const x = getX(index);

            // Label (simulated time labels or just 1..N)
            // Let's use simple index relative to now
            const label = i === xSteps ? 'Now' : `-${data.length - index}s`;
            ctx.fillText(label, x, h - 5);
        }

        // Draw Main Line
        ctx.beginPath();
        ctx.strokeStyle = '#58a6ff';
        ctx.lineWidth = 2;
        ctx.moveTo(getX(0), getY(data[0]));

        for (let i = 1; i < data.length; i++) {
            // Smooth bezier could be nice, but linear for now
            ctx.lineTo(getX(i), getY(data[i]));
        }
        ctx.stroke();

        // Gradient Fill
        const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
        gradient.addColorStop(0, 'rgba(88, 166, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(88, 166, 255, 0)');

        ctx.lineTo(getX(data.length - 1), h - padding.bottom);
        ctx.lineTo(padding.left, h - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Blinking Dot
        const lastX = getX(data.length - 1);
        const lastY = getY(data[data.length - 1]);

        ctx.beginPath();
        ctx.fillStyle = '#58a6ff';
        ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Start everything
updateWithdrawal();
setInterval(updateWithdrawal, 4500);
initChart();