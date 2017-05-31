const path = require('path');

const WarpWorksError = require('./../error');

module.exports = (config, name, file) => {
    const FOLDERS = {
        smnDemos: path.join(config.projectPath, 'smnDemos'),
        templates: path.join(config.cartridgePath, 'templates'),
        domains: path.join(config.projectPath, 'domains'),
        output: config.outputPath
    };

    const folder = FOLDERS[name];

    if (folder) {
        return file ? path.join(folder, file) : folder;
    }

    throw new WarpWorksError(`Invalid directory: '${name}'`);
};
