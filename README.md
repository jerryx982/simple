# SimpleCrypto

A simple, realistic crypto-investment site built with Node.js, Express, and Vanilla JS/CSS.

## Features
- **Investment Plans**: View and subscribe to various investment tiers.
- **Crypto Payments**: Simulate Ethereum payments via MetaMask.
- **Authentication**: Secure Signup/Signin with bcrypt hashing and JWT cookies.
- **Dashboard**: Track your balance and active investments.

## Setup & Run

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Start Server**
    ```bash
    node server/server.js
    ```

3.  **Access Frontend**
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## File Structure
- `server/`: Backend logic, auth, API, and database (JSON).
- `frontend/`: HTML, CSS, JS for the user interface.

## Notes
- Database is stored in `server/db.json`.
- Transactions are simulated (validated against backend mock).
- Rate limiting is active on auth endpoints.
