# 🚀 CHAIN VEST - Premium Crypto Investment Platform

A high-performance, realistic cryptocurrency investment dashboard built with **Node.js**, **Express**, and a sleek **Vanilla JavaScript/CSS** frontend.

## ✨ Core Features

- **💎 Premium Dashboard**: Real-time asset tracking with live charts and dynamic market allocation.
- **📈 Live Market Data**: Synchronized price feeds for BTC, ETH, SOL, BNB, and USDT using robust API proxies.
- **🛡️ Secure Authentication**: JWT-based session management with encrypted password storage.
- **🔗 Web3 Integration**: MetaMask-ready investment flow with simulated blockchain verification.
- **📱 Mobile Ready**: Fully responsive design with optimized GPU-accelerated animations for a smooth experience on all devices.
- **🔄 Automatic Sync**: Built-in GitHub synchronization to ensure production (Render) stays up-to-date with database changes.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3 (Custom Glassmorphism), Vanilla JavaScript
- **Charts**: Chart.js
- **Database**: File-based JSON Database (with Mongoose-like structure)
- **Deployment**: Optimized for Render with Node 18+ support.

## 🚀 Getting Started

1. **Clone & Install**

    ```bash
    npm install
    ```

2. **Environment Setup**
    Create a `.env` file in the root directory:

    ```env
    PORT=3000
    DBUrl=YOUR_MONGODB_URI_HERE
    ```

3. **Run Development Server**

    ```bash
    npm run dev
    ```

4. **Production Mode**

    ```bash
    npm start
    ```

## 📂 Project Structure

- `server/`: API logic, authentication, and database helper.
- `frontend/`: Responsive UI components, styles, and dashboard logic.
- `scripts/`: Utility scripts for system synchronization and automation.

---
*Built with passion for the crypto community.*
