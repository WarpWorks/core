module.exports = (config, dbName) => `mongodb://${config.mongoServer}/${dbName}`;
