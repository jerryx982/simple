require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const DB_PATH = path.join(__dirname, '../db.json');

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) return; // Already connected
    try {
        await mongoose.connect(process.env.DBUrl);
        console.log("Database connected successfully!");
    } catch (error) {
        console.error("MongoDB Connection Error:", error.message);
        // Do not exit process if running as module
        if (require.main === module) process.exit(1);
    }
};

const syncUsers = async () => {
    await connectDB();

    try {
        let localUsers = [];
        let remoteUsers = [];

        // 1. Read Local db.json
        if (fs.existsSync(DB_PATH)) {
            const localData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
            localUsers = localData.users || [];
            console.log(`[Local] Found ${localUsers.length} users.`);
        } else {
            console.warn("[Local] db.json not found.");
        }

        // 2. Fetch Remote db.json from GitHub
        // Repo: jerryx982/simple
        const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/jerryx982/simple/main/server/db.json';
        console.log(`[Remote] Fetching from ${GITHUB_RAW_URL}...`);

        try {
            const res = await fetch(GITHUB_RAW_URL);
            if (res.ok) {
                const remoteData = await res.json();
                remoteUsers = remoteData.users || [];
                console.log(`[Remote] Found ${remoteUsers.length} users.`);
            } else {
                console.error(`[Remote] Failed to fetch: ${res.status} ${res.statusText}`);
            }
        } catch (fetchErr) {
            console.error("[Remote] Network error fetching from GitHub:", fetchErr.message);
        }

        // 3. Merge Users
        // Create a Map by ID to ensure uniqueness and merge properties
        const userMap = new Map();

        // Add local users first
        localUsers.forEach(u => userMap.set(u.id, u));

        // Add remote users (overwriting logic: remote wins? or just missing ones? 
        // "let user information authomatically stored from github" suggests GitHub is source of truth for new accounts.
        // We'll merge: if exists, keep local (updates might be local), if user only on GitHub, add them.
        remoteUsers.forEach(u => {
            if (!userMap.has(u.id)) {
                userMap.set(u.id, u);
            } else {
                // If ID matches, we might want to ensure critical fields are set?
                // For now, let's trust uniqueness of ID.
            }
        });

        const allUsers = Array.from(userMap.values());
        console.log(`[Sync] Merged total: ${allUsers.length} users.`);

        // 4. Update MongoDB
        for (const user of allUsers) {
            // Check if user exists in Mongo by ID or Email
            const existingUser = await User.findOne({ $or: [{ id: user.id }, { email: user.email }] });

            if (existingUser) {
                // Update existing
                Object.assign(existingUser, user);
                await existingUser.save();
            } else {
                // Create new
                const newUser = new User(user);
                await newUser.save();
                console.log(`[Sync] Created new MongoDB user: ${user.email}`);
            }
        }

        // 5. Write back to unique local db.json (Two-way sync)
        if (fs.existsSync(DB_PATH)) {
            const currentDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
            currentDb.users = allUsers; // Update users list
            fs.writeFileSync(DB_PATH, JSON.stringify(currentDb, null, 2));
            console.log(`[Sync] Updated local db.json with ${allUsers.length} users.`);
        }

        console.log("[Sync] Cycle Complete.");
    } catch (error) {
        console.error("Sync Error:", error.message);
    } finally {
        // Only close if standalone? No, if we keep reusing connection in server, don't close!
        // If imported, we rely on server's connection.
        // We should check mongoose.connection.readyState
        if (require.main === module) {
            mongoose.connection.close();
        }
    }
};

// Standalone check
if (require.main === module) {
    (async () => {
        await connectDB();
        await syncUsers();
        process.exit(0);
    })();
}

module.exports = { syncUsers };
