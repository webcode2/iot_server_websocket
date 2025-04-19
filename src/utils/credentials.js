const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

class CredentialsLoader {
  constructor() {
    this.credentials = {
      dbName: null,
      app_secret: null,
      dbPassword: null,
      superuser_email: null,
      superuser_password: null,
      dbHost: process.env.DB_HOST || 'localhost',
      dbPort: process.env.DB_PORT || '5432',
      node_env: process.env.NODE_ENV || 'development',
      dbUser: "postgres",
    };
  }

  loadSecrets() {
    const secretMappings = [
      { secretPath: '/run/secrets/db_user', envVar: 'DB_USER', target: 'dbUser' },
      { secretPath: '/run/secrets/db_password', envVar: 'DB_PASSWORD', target: 'dbPassword' },
      { secretPath: '/run/secrets/db_name', envVar: 'DB_NAME', target: 'dbName' },
      { secretPath: '/run/secrets/app_secret', envVar: 'SECRET', target: 'app_secret' },
      { secretPath: '/run/secrets/superuser_password', envVar: 'SUPERUSER_PASSWORD', target: 'superuser_password' },
      { secretPath: '/run/secrets/superuser_email', envVar: 'SUPERUSER_EMAIL', target: 'superuser_email' }
    ];

    secretMappings.forEach(({ secretPath, envVar, target }) => {
      try {
        // Try to read from Docker secret first
        if (fs.existsSync(secretPath)) {
          this.credentials[target] = fs.readFileSync(secretPath, 'utf8').trim().toString();
        } else {
          throw new Error(`Secret file not found at ${secretPath}`);
        }
      } catch (secretError) {
        // Fallback to environment variable
        if (process.env[envVar]) {
          this.credentials[target] = process.env[envVar];
          console.warn(`Using environment variable for ${target} (could not read secret)`);
        } else {
          console.error(`Neither secret nor environment variable available for ${target}`);
          // You might want to throw an error here if the credential is essential
        }
      }
    });
  }

  validate() {
    // Add any validation logic here
    const requiredCredentials = ['dbUser', 'dbPassword', 'dbName'];
    const missing = requiredCredentials.filter(field => !this.credentials[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required credentials: ${missing.join(', ')}`);
    }
  }

  getCredentials() {
    this.loadSecrets();
    this.validate();
    console.log('====================================');
    console.log(this.credentials);
    console.log('====================================');
    return this.credentials;
  }
}

// Singleton instance
const credentialsLoader = new CredentialsLoader();
module.exports = credentialsLoader.getCredentials();