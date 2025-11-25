const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');
const manifestJsonPath = path.join(__dirname, '../public/manifest.json');

const packageJson = require(packageJsonPath);
const manifestJson = require(manifestJsonPath);

manifestJson.version = packageJson.version;

fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2) + '\n');

console.log(`Updated manifest.json version to ${packageJson.version}`);
