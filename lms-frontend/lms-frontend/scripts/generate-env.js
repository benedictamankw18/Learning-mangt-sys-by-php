/**
 * generate-env.js
 * Reads lms-frontend/.env and writes lms-frontend/assets/js/env.js.
 *
 * Usage (from repo root):
 *   node lms-frontend/scripts/generate-env.js
 *
 * Run this script whenever .env changes, or wire it into your CI/CD pipeline.
 */

const fs   = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '..');
const envFile     = path.join(frontendDir, '.env');
const outFile     = path.join(frontendDir, 'assets', 'js', 'env.js');

if (!fs.existsSync(envFile)) {
    console.error(`ERROR: ${envFile} not found. Copy .env.example → .env and fill in values.`);
    process.exit(1);
}

const vars = {};
fs.readFileSync(envFile, 'utf8')
    .split('\n')
    .forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        const eq = line.indexOf('=');
        if (eq === -1) return;
        const key = line.slice(0, eq).trim();
        const val = line.slice(eq + 1).trim();
        vars[key] = val;
    });

const required = ['APP_ENV', 'API_BASE_URL'];
const missing  = required.filter(k => !vars[k]);
if (missing.length) {
    console.error(`ERROR: Missing required variables in .env: ${missing.join(', ')}`);
    process.exit(1);
}

const content = `// AUTO-GENERATED — do not edit manually.
// Run: node lms-frontend/scripts/generate-env.js
window.ENV_CONFIG = {
    APP_ENV:      '${vars.APP_ENV}',
    API_BASE_URL: '${vars.API_BASE_URL}',
};
`;

fs.writeFileSync(outFile, content, 'utf8');
console.log(`✓ env.js written → ${outFile}`);
console.log(`  APP_ENV:     ${vars.APP_ENV}`);
console.log(`  API_BASE_URL: ${vars.API_BASE_URL}`);
