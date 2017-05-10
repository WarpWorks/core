const path = require('path');
const rc = require('@quoin/node-rc');

const packageJson = require('./../package.json');

const processCwd = process.cwd();

let warpjsFolder;

try {
    warpjsFolder = path.dirname(require.resolve('@warp-works/warpjs/package.json'));
} catch (e) {
    warpjsFolder = path.join(processCwd, '..', 'warpjs');
}

const baseConfig = {
    serverVersion: packageJson.version,
    serverStarted: (new Date()).toString(),
    port: process.env.PORT || '3000',
    mongoServer: process.env.MONGODB_HOST || 'localhost',
    cartridgePath: process.env.CARTRIDGE_PATH || warpjsFolder,
    outputPath: process.env.OUTPUT_PATH || warpjsFolder,
    projectPath: process.env.PROJECT_PATH || path.join(processCwd, "..", "w2projects")
};

const config = rc(packageJson.name, baseConfig);

module.exports = config;
