module.exports = {
    xlSheet: './data/sample.xlsx', //will read this sheet and insert data in mongodb
    mongoServerHost: "localhost", // mongo server host
    mongoServerPort: "27017", //mongo server port
    mongoDataBaseName: "data", //Name of the Database
    mongoCollectionName: "sheettoJSON" // Name of the collection
}