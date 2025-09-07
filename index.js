/**
 * @name SecureCM
 * @description Manages application configurations with built-in encryption and decryption.
 * @author MAMEDUL ISLAM <http://mamedul.github.io>
 * @version 2025.9.8
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const yaml = require('js-yaml');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

class SecureCM {
    /**
     * @param {object} options - Configuration options.
     * @param {string} options.env - The environment (e.g., 'development', 'production').
     * @param {string} options.configDir - The directory where config files are stored.
     * @param {string} options.secretKey - A 32-character secret key for encryption/decryption.
     */
    constructor(options = {}) {
        if (!options.secretKey || options.secretKey.length !== 32) {
            throw new Error('A 32-character secretKey is required for encryption and decryption.');
        }
        this.env = options.env || 'development';
        this.configDir = options.configDir || './config';
        this.secretKey = options.secretKey;
        this.config = {};
        this.sensitiveKeys = [];
    }

    /**
     * Encrypts a string.
     * @param {string} text - The text to encrypt.
     * @returns {string} - The encrypted string.
     */
    encrypt(text) {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(this.secretKey), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

    /**
     * Decrypts a string.
     * @param {string} text - The text to decrypt.
     * @returns {string} - The decrypted string.
     */
    decrypt(text) {
        // If the text doesn't contain a colon, it's likely not encrypted. Return it as is.
        if (!text || typeof text !== 'string' || !text.includes(':')) {
            return text;
        }

        try {
            const textParts = text.split(':');
            const iv = Buffer.from(textParts.shift(), 'hex');
            const encryptedText = Buffer.from(textParts.join(':'), 'hex');
            const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(this.secretKey), iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        } catch (error) {
            console.error("Decryption failed. Check your secret key or the encrypted value format.");
            return null;
        }
    }

    /**
     * Loads configuration from a file (.env, .json, or .yaml).
     * @param {string[]} sensitiveKeys - An array of keys that should be encrypted/decrypted.
     */
    load(sensitiveKeys = []) {
        this.sensitiveKeys = sensitiveKeys;
        const extensions = ['.json', '.yaml', '.yml', '.env'];
        let configLoaded = false;

        for (const ext of extensions) {
            const filePath = path.join(this.configDir, `${this.env}${ext}`);
            if (fs.existsSync(filePath)) {
                this._loadFile(filePath);
                configLoaded = true;
                break;
            }
        }
        
        if (!configLoaded) {
            console.warn(`No configuration file found for environment: ${this.env}`);
        }

        return this;
    }
    
    /**
     * Loads a specific file based on its extension.
     * @param {string} filePath - The path to the configuration file.
     * @private
     */
    _loadFile(filePath) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const ext = path.extname(filePath);

        switch (ext) {
            case '.json':
                this.config = JSON.parse(fileContent);
                break;
            case '.yaml':
            case '.yml':
                this.config = yaml.load(fileContent);
                break;
            case '.env':
                this.config = dotenv.parse(fileContent);
                break;
        }
        
        this._processSensitiveKeys(false); // Decrypt on load
    }
    
    /**
     * Encrypts all sensitive keys and saves the configuration to a file.
     * @param {string} format - The format to save ('json', 'yaml', 'env').
     */
    save(format = 'json') {
        this._processSensitiveKeys(true); // Encrypt on save

        const ext = format === 'env' ? '.env' : `.${format}`;
        const filePath = path.join(this.configDir, `${this.env}${ext}`);
        let output = '';

        switch (format) {
            case 'json':
                output = JSON.stringify(this.config, null, 2);
                break;
            case 'yaml':
                output = yaml.dump(this.config);
                break;
            case 'env':
                output = Object.entries(this.config).map(([key, value]) => `${key}=${value}`).join('\n');
                break;
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
        
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, output);
        console.log(`Configuration saved to ${filePath}`);

        this._processSensitiveKeys(false); // Decrypt back for runtime use
    }


    /**
     * Processes sensitive keys for encryption or decryption.
     * @param {boolean} encryptAction - True to encrypt, false to decrypt.
     * @private
     */
    _processSensitiveKeys(encryptAction) {
        if (this.sensitiveKeys.length === 0) return;

        for (const key of this.sensitiveKeys) {
            if (this.config[key]) {
                this.config[key] = encryptAction ? this.encrypt(this.config[key]) : this.decrypt(this.config[key]);
            }
        }
    }

    /**
     * Get a configuration value.
     * @param {string} key - The configuration key.
     * @returns {*} - The value associated with the key.
     */
    get(key) {
        return this.config[key];
    }
    
    /**
     * Set a configuration value.
     * @param {string} key - The configuration key.
     * @param {*} value - The value to set.
     */
    set(key, value) {
        this.config[key] = value;
    }
}

module.exports = SecureCM;
