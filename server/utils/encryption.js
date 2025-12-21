const crypto = require('crypto');

// Use a fixed key/iv for demo simplicity, or env variables in prod
// In a real app, ENCRYPTION_KEY must be 32 bytes (hex encoded or raw)
const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_KEY ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex') : crypto.randomBytes(32);
const ivLength = 16;

// To avoid losing data on restart if we use randomBytes, we should likely fix it or store it.
// For this MVP on local file system, let's use a hardcoded fallback if ENV is missing
// WARNING: NOT FOR PRODUCTION
const MVP_KEY = Buffer.from('12345678901234567890123456789012'); // 32 chars
const activeKey = process.env.ENCRYPTION_KEY ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex') : MVP_KEY;

function encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, activeKey, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    if (!text) return null;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(algorithm, activeKey, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        console.error("Decryption failed:", e);
        return null;
    }
}

module.exports = { encrypt, decrypt };
