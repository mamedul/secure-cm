# Secure-CM

**A simple and powerful package to manage your application secrets safely.**

Secure-CM loads configurations from `.env`, `.yaml`, or `.json` files, automatically encrypts sensitive keys before saving, and decrypts them on load. It is designed for modern development workflows, especially for SaaS products and multi-environment deployments that require a clear separation of configuration and secrets.

![Secure-CM](https://raw.githubusercontent.com/mamedul/secure-cm/main/secure-cm-banner.jpg)


## Features

*   **Multi-Format Support**: Load configurations from `.env`, `.yaml`, or `.json` files.
    
*   **Automatic Encryption**: Sensitive values are automatically encrypted using AES-256-CBC.
    
*   **Environment-Specific Configs**: Manage separate configurations for `development`, `production`, `staging`, etc.
    
*   **Easy to Use**: Simple, intuitive API for loading, getting, setting, and saving configurations.
    
*   **Version Control Friendly**: Store encrypted configuration files safely in your version control system.
    

## Use Cases

*   **SaaS Products**: Manage different database credentials, API keys, and feature flags for multiple tenants or environments.
    
*   **Multi-Environment Deployments**: Keep your `production`, `staging`, and `development` configurations separate and secure.
    
*   **Open Source Projects**: Allow contributors to use a template configuration without exposing sensitive project keys.
    

## Installation

```bash
npm install secure-cm
```

## Quick Start

1.  **Create a configuration file.**
    
    Create a `config` directory in your project root. Inside, create a file for your environment, e.g., `development.json`.
    
    **./config/development.json**
    
    ```json
    {
      "DB_HOST": "localhost",
      "DB_USER": "root",
      "DB_PASS": "my-secret-password",
      "API_KEY": "another-secret-key"
    }
    ```
    
2.  **Initialize the manager and load your config.**
    
    You'll need a 32-character secret key for encryption. You can store this in a secure place like your hosting environment's secret manager or an environment variable.
    
    ```js
    const SecureCM = require('secure-cm');
    
    // WARNING: Do not hardcode your secret key in production. 
    // Use an environment variable or a secret management service.
    const secretKey = process.env.CONFIG_SECRET_KEY || 'a-secure-32-character-secret-key';
    
    const configManager = new SecureCM({
        env: 'development',
        secretKey: secretKey,
        configDir: './config' // Optional, defaults to ./config
    });
    
    // Specify which keys are sensitive and should be encrypted
    configManager.load(['DB_PASS', 'API_KEY']);
    
    // Access your configuration
    console.log('DB Host:', configManager.get('DB_HOST')); // 'localhost'
    console.log('DB Password:', configManager.get('DB_PASS')); // 'my-secret-password' (decrypted)
    ```
    
3.  **Save an encrypted version of your config.**
    
    Run this once to create an encrypted version of your config file. You can then safely commit this file to version control.
    
    ```
    // This will encrypt 'DB_PASS' and 'API_KEY' and save a new file.
    configManager.save('json'); 
    ```
    
    Your `development.json` will now look like this:
    
    **./config/development.json**
    
    ```json
    {
      "DB_HOST": "localhost",
      "DB_USER": "root",
      "DB_PASS": "iv_hex:encrypted_password_hex",
      "API_KEY": "iv_hex:encrypted_key_hex"
    }
    ```
    
    Now, you can safely commit this file. The original plain-text values are never exposed.
    

## API Reference

### `new SecureCM(options)`

Creates a new instance.

*   `options` `<Object>`
    
    *   `env` `<string>` The current environment (e.g., `'production'`). **Default:** `'development'`.
        
    *   `configDir` `<string>` The directory where config files are located. **Default:** `'./config'`.
        
    *   `secretKey` `<string>` **Required**. A 32-character string used for encryption and decryption.
        

### `.load(sensitiveKeys)`

Loads the configuration file for the specified environment.

*   `sensitiveKeys` `<string[]>` An array of keys within the configuration that should be treated as sensitive and decrypted upon loading.
    

### `.get(key)`

Retrieves a configuration value.

*   `key` `<string>` The key of the value to retrieve.
    

### `.set(key, value)`

Sets a configuration value in memory.

*   `key` `<string>` The key of the value to set.
    
*   `value` `<any>` The value to set.
    

### `.save(format)`

Encrypts sensitive keys and saves the entire configuration to a new file.

*   `format` `<string>` The format to save the file in (`'json'`, `'yaml'`, or `'env'`). **Default:** `'json'`.
    

## Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md "null") for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE "null") file for details.

## Author

This packages codes was created by [**Mamedul Islam**](https://mamedul.github.io/ "null") and open for contribute.

_As a passionate **web developer** with experience in creating interactive and user-friendly web components. Currently *available for freelance projects* or full-time opportunities._

_Helping businesses grow their online presence with custom web solutions. Specializing in **WordPress**, **WooCommerce**, **NodeJS**, and **Shopify**. Building modern, responsive, and high-performance scalable websites with custom made plugins, codes, customizations._


## Changelog

Please see the [CHANGELOG.md](CHANGELOG.md "null") file.