function removeAllDataFromDB(db) {
    db.collections((err, collections) => {
        if (err) {
            console.log(`Error retrieving collection names:`, err);
        } else {
            console.log("*** Collection:");
            collections.forEach((collection) => {
                console.log(`Dropping collection: ${collection.collectionName}`);
                collection.drop((dropError, dropResult) => {
                    if (dropError) {
                        console.log(`Error dropping collection:`, dropError);
                    }
                });
            });
        }
    });
}

module.exports = {
    removeAllDataFromDB
};
