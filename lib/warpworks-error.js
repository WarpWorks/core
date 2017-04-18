class WarpWorksError extends Error {
    constructor(message, originalError) {
        super(message);
        this.name = `WarpWorks.${this.constructor.name}`;
        this.originalError = originalError;
    }
}

module.exports = WarpWorksError;
