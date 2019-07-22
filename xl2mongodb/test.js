const chai = require('chai');
const fs = require('fs');
const XLSX = require('xlsx');
const constants = require('./constants.js');
const MongoClient = require('mongodb').MongoClient;
const url = `mongodb://${constants.mongoServerHost}:${constants.mongoServerPort}/${constants.mongoDataBaseName}`; //ConnectionURL
const assert = chai.assert;
const Joi = require('joi');

const schema = Joi.object().keys({
    Name: Joi.string(),
    Phone: Joi.string().regex(/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[789]\d{9}$/),
    Address: Joi.string(),
    email: Joi.string().email({ minDomainAtoms: 2 })
}).with('Name', ['Phone', 'Address', "email"]);

describe('excel to db', function() {
    it('should read the sheet', function(done) {
        try {
            this.timeout(50000);
            if (fs.existsSync(constants.xlSheet) == false) {
                throw new Error("please check if sheet exists at the path given in constants.");
                process.exit(1);
            }
            const defaultHeaders = ['Name', 'Address', 'Phone', 'email'];
            const workbook = XLSX.readFile(`${constants.xlSheet}`, { sheetStubs: true });
            const sheet_name_list = workbook.SheetNames;
            const sheetContent = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], { "defVal": " " });
            if (sheetContent.length > 0) {
                let headersOfSheet = Object.keys(sheetContent[0])
                let found = headersOfSheet.some(r => defaultHeaders.indexOf(r) >= 0)
                if (found) {
                    console.log(`Headers includes atleast one of the defaultHeaders. File read successfull.`);
                } else {
                    console.log(`Headers does not include any of the defaultHeaders.`);
                }
            } else {
                console.log("Check if your file has some content.");
            }
            done();
        } catch (error1) {
            console.log(`error caught in should read the sheet ${error1}`)
        }
    })
    it('should check if mongo server is running or not.', function(done) {
        this.timeout(50000);
        try {
            MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
                if (err) {
                    console.log("error connecting to mongo server...", err);
                    console.log("Check whether mongo server is up and running???");
                    process.exit(1);
                }
                if (client) {
                    console.log(`${new Date().getTime()} - client connected to mongo server.`);
                    client.close();
                    done()
                }
            });
        } catch (error2) {
            console.log(`error caught in check if mongo server running or not. ${error2}`);
        }
    })
    it('should validate and insert a valid data', function(done) {
        try {
            MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
                const db = client.db(constants.mongoDataBaseName);
                const collection = db.collection(constants.mongoCollectionName);
                const checkEmailPhoneExists = (email, Phone) => {
                    return collection.findOne({
                        "$or": [{
                            "email": email
                        }, {
                            "Phone": Phone
                        }]
                    }).then(function(result) {
                        return result !== null;
                    });
                }
                let element = { "Name": "Random valid name 1", "Address": "Random valid 1 address", "Phone": "7712345600", "email": "randomvalid1@random.com" };
                Joi.validate(element, schema, function(err, value) {
                    if (err) {
                        console.log(`${new Date().getTime()} - validation error for`, err);
                        console.log(`${new Date().getTime()} - your current data has invalid format. Make sure you have complete data filled in excel sheet.`);
                        client.close();
                    }
                    if (!err && value) {
                        checkEmailPhoneExists(element.email, element.Phone).then(function(valid) {
                            if (valid) {
                                console.log(`${new Date().getTime()} - Email or phone already in database for so removing it first.`);
                                collection.deleteMany({
                                    "$or": [{
                                        "email": element.email
                                    }, {
                                        "Phone": element.Phone
                                    }]
                                }, function(err, result) {
                                    assert.equal(err, null);
                                    console.log(`Removed the document. Inserting again.`);
                                    collection.insertOne(element, (err, result) => {
                                        if (err) {
                                            console.log(`${new Date().getTime()} - mongo insertOne error ${err}`);
                                        }
                                        console.log(`${new Date().getTime()} - data for ${result.ops[0].Name} with contact ${result.ops[0].Phone} and email ${result.ops[0].email} has been inserted with id ${result.insertedId} and result is ${JSON.stringify(result.result)}`)
                                        client.close();
                                        done();
                                    })
                                });
                            } else {
                                console.log(`${new Date().getTime()} - Email/phone is valid inserting value in db`);
                                collection.insertOne(element, (err, result) => {
                                    if (err) {
                                        console.log(`${new Date().getTime()} - mongo insertOne error ${err}`);
                                        client.close();
                                        process.exit(1);
                                    }
                                    console.log(`${new Date().getTime()} - data for ${result.ops[0].Name} with contact ${result.ops[0].Phone} and email ${result.ops[0].email} has been inserted with id ${result.insertedId} and result is ${JSON.stringify(result.result)}`)
                                    client.close();
                                    done();
                                })
                            }
                        });
                    }
                })
            })
        } catch (error3) {
            console.log(`error caught in should validate and insert a valid data ${error3}`);
        }
    })
    it('should invalidate invalid data if any field is missing', function(done) {
        try {
            MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
                const db = client.db(constants.mongoDataBaseName);
                const collection = db.collection(constants.mongoCollectionName);
                const checkEmailPhoneExists = (email, Phone) => {
                    return collection.findOne({
                        "$or": [{
                            "email": email
                        }, {
                            "Phone": Phone
                        }]
                    }).then(function(result) {
                        return result !== null;
                    });
                }

                let element = { "Name": "Random valid name 1", "Address": "Random valid 1 address", "email": "randomvalid1@random.com" };
                //Phone is missing in above object.
                Joi.validate(element, schema, function(err, value) {
                    if (err) {
                        console.log(`${new Date().getTime()} - validation error `);
                        console.log(`${new Date().getTime()} - your current data has invalid format.`);
                        assert.equal(err.name, 'ValidationError');
                        console.log('message is -->', err.details[0].message);
                        client.close();
                        done();
                    }
                    if (!err && value) {
                        checkEmailPhoneExists(element.email, element.Phone).then(function(valid) {
                            if (valid) {
                                console.log(`${new Date().getTime()} - Email or phone already in database for so removing it first.`);
                                collection.deleteMany({
                                    "$or": [{
                                        "email": element.email
                                    }, {
                                        "Phone": element.Phone
                                    }]
                                }, function(err, result) {
                                    assert.equal(err, null);
                                    console.log(`Removed the document. Inserting again.`);
                                    collection.insertOne({ "Name": "Random valid name 1", "Address": "Random valid 1 address", "Phone": "7712345600", "email": "randomvalid1@random.com" }, (err, result) => {
                                        if (err) {
                                            console.log(`${new Date().getTime()} - mongo insertOne error ${err}`);
                                        }
                                        console.log(`${new Date().getTime()} - data for ${result.ops[0].Name} with contact ${result.ops[0].Phone} and email ${result.ops[0].email} has been inserted with id ${result.insertedId} and result is ${JSON.stringify(result.result)}`)
                                        client.close();
                                        done();
                                    })
                                });
                            } else {
                                console.log(`${new Date().getTime()} - Email/phone is valid inserting value in db`);
                                collection.insertOne(element, (err, result) => {
                                    if (err) {
                                        console.log(`${new Date().getTime()} - mongo insertOne error ${err}`);
                                    }
                                    console.log(`${new Date().getTime()} - data for ${result.ops[0].Name} with contact ${result.ops[0].Phone} and email ${result.ops[0].email} has been inserted with id ${result.insertedId} and result is ${JSON.stringify(result.result)}`)
                                    client.close();
                                    done();
                                })
                            }
                        });
                    }
                })
            })
        } catch (error4) {
            console.log("error caught in should invalidate invalid data if any field is missing", error4);
        }
    })
})