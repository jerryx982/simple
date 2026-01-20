require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
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

const pushToGitHub = async () => {
    try {
        console.log("[Git] Configuring local identity...");
        execSync('git config user.email "autosync@chainvest.com"', { cwd: path.join(__dirname, '../../') });
        execSync('git config user.name "AutoSync"', { cwd: path.join(__dirname, '../../') });

        console.log("[Git] Staging all changes...");
        execSync('git add .', { cwd: path.join(__dirname, '../../') });

        // Check if there are actual changes to commit
        const status = execSync('git status --porcelain', { cwd: path.join(__dirname, '../../') }).toString();
        if (!status) {
            console.log("[Git] No changes detected. Skipping push.");
            return;
        }

        console.log("[Git] Committing changes...");
        execSync('git commit -m "Auto-sync update: project files" --author="AutoSync <autosync@chainvest.com>"', { cwd: path.join(__dirname, '../../') });

        console.log("[Git] Pushing to GitHub...");
        execSync('git push', { cwd: path.join(__dirname, '../../') });
        console.log("[Git] Push successful!");
    } catch (err) {
        console.error("[Git] Auto-push failed:", err.message);
        // We don't throw here to avoid stopping the sync loop
    }
};

const syncUsers = async () => {
    await connectDB();

    try {
        let localUsers = [];
        let remoteUsers = [];

        // 1. Read Local db.json
        if (fs.existsSync(DB_PATH)) {
            try {
                const localData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
                localUsers = localData.users || [];
                console.log(`[Local] Found ${localUsers.length} users.`);
            } catch (err) {
                console.error("[Local] db.json is corrupted or invalid. Resetting to empty state.");
                localUsers = [];
            }
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
                // If 404, the file might not be pushed yet. This is expected initially.
                console.log(`[Remote] Skip: GitHub file not found or inaccessible (Status: ${res.status}). Continuing with Local & Mongo. `);
            }
        } catch (fetchErr) {
            console.error("[Remote] Network error fetching from GitHub. Continuing with Local & Mongo.");
        }

        // 3. Merge Users
        // Create a Map by ID to ensure uniqueness and merge properties
        const userMap = new Map();

        // A. Add Remote GitHub users (Base Layer)
        console.log("   [Merge] Applying GitHub users (Base)...");
        remoteUsers.forEach(u => {
            if (u.id) userMap.set(u.id, u);
        });

        // B. Add MongoDB users (Render/Hosted Data - Middle Layer)
        // This pulls new accounts created on the live site
        try {
            const mongoUsers = await User.find({}).lean();
            console.log(`   [Merge] Applying ${mongoUsers.length} MongoDB users (Middle)...`);

            mongoUsers.forEach(u => {
                const { _id, __v, ...cleanUser } = u;
                if (u.id) {
                    // Overwrite GitHub data, or add new
                    userMap.set(u.id, cleanUser);
                }
            });
        } catch (mongoErr) {
            console.error("[Mongo] Error fetching users:", mongoErr.message);
        }

        // C. Add Local users (Top Layer - Priority)
        // Local edits override EVERYTHING.
        console.log("   [Merge] Applying Local users (Priority)...");
        localUsers.forEach(u => {
            if (u.id) userMap.set(u.id, u);
        });

        const allUsers = Array.from(userMap.values());
        console.log(`[Sync] Merged total result: ${allUsers.length} users.`);

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

            // Auto-push changes to GitHub
            await pushToGitHub();
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
