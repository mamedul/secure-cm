const SecureCM = require('./index.js');
const fs = require('fs');
const path = require('path');

console.log('--- Running Secure-CM Tests ---');

const CONFIG_DIR = './test-config';
const SECRET_KEY = 'a-very-secure-32-char-secret-key'; // 32 characters

// Cleanup and setup function
function setup() {
    if (fs.existsSync(CONFIG_DIR)) {
        fs.rmSync(CONFIG_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    
    const testConfigJson = {
        DB_HOST: 'test.db.local',
        API_KEY: 'super-secret-api-key',
        PORT: 8080
    };
    fs.writeFileSync(path.join(CONFIG_DIR, 'test.json'), JSON.stringify(testConfigJson, null, 2));
}

function runTest(description, testFn) {
    try {
        setup(); // Reset environment for each test
        testFn();
        console.log(`✅ PASSED: ${description}`);
    } catch (error) {
        console.error(`❌ FAILED: ${description}`);
        console.error(error);
        process.exit(1); // Exit with error code
    }
}

// --- Test Suite ---

runTest('should initialize without errors', () => {
    new SecureCM({
        secretKey: SECRET_KEY,
        env: 'test',
        configDir: CONFIG_DIR
    });
});

runTest('should throw error if secret key is missing or invalid', () => {
    let hasThrown = false;
    try {
        new SecureCM({ env: 'test', configDir: CONFIG_DIR });
    } catch (e) {
        hasThrown = true;
        if (!e.message.includes('32-character secretKey')) {
            throw new Error('Incorrect error message for missing secret key');
        }
    }
    if (!hasThrown) throw new Error('Did not throw for missing secret key');
});


runTest('should load a plain-text JSON config file correctly', () => {
    const config = new SecureCM({
        secretKey: SECRET_KEY,
        env: 'test',
        configDir: CONFIG_DIR
    });
    // Load the file where API_KEY is initially not encrypted
    config.load(['API_KEY']); 

    const expectedApiKey = 'super-secret-api-key';
    const actualApiKey = config.get('API_KEY');
    
    if (config.get('DB_HOST') !== 'test.db.local') throw new Error('Failed to get plain text value');
    if (actualApiKey !== expectedApiKey) {
        throw new Error(`Failed to get sensitive value. Expected "${expectedApiKey}", but got "${actualApiKey}"`);
    }
});

runTest('should encrypt, save, and then correctly load/decrypt the config', () => {
    const configManager = new SecureCM({
        secretKey: SECRET_KEY,
        env: 'test',
        configDir: CONFIG_DIR
    });
    configManager.load(['API_KEY']);
    
    // Save an encrypted version
    configManager.save('json');
    
    const savedContent = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, 'test.json'), 'utf-8'));
    
    if (savedContent.API_KEY === 'super-secret-api-key') {
        throw new Error('API_KEY was not encrypted on save');
    }
    if (!savedContent.API_KEY.includes(':')) {
        throw new Error('Encrypted key format is incorrect');
    }

    // Now, load the newly saved (encrypted) file and check decryption
    const newConfigManager = new SecureCM({
        secretKey: SECRET_KEY,
        env: 'test',
        configDir: CONFIG_DIR
    });
    newConfigManager.load(['API_KEY']);
    
    const decryptedKey = newConfigManager.get('API_KEY');
    if (decryptedKey !== 'super-secret-api-key') {
        throw new Error(`Decryption failed. Expected "super-secret-api-key" but got "${decryptedKey}"`);
    }
});


runTest('should set a value and retrieve it', () => {
    const config = new SecureCM({ secretKey: SECRET_KEY, env: 'test', configDir: CONFIG_DIR });
    config.load();
    config.set('NEW_KEY', 'new_value');
    if (config.get('NEW_KEY') !== 'new_value') throw new Error('Set/Get functionality failed');
});


// Final cleanup
if (fs.existsSync(CONFIG_DIR)) {
    fs.rmSync(CONFIG_DIR, { recursive: true, force: true });
}

console.log('--- All Tests Completed Successfully ---');
