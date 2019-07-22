const XLSX = require('xlsx');
const constants = require('./constants.js');
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
if (fs.existsSync(constants.xlSheet) == false) {
    throw new Error("please check if sheet exists at the path given in constants.")
}
const workbook = XLSX.readFile(`${constants.xlSheet}`, { sheetStubs: true });
const sheet_name_list = workbook.SheetNames;
const sheetContent = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], { "defVal": " " });
const Joi = require('joi');
const async = require('async');

const schema = Joi.object().keys({
    month: Joi.string(),
    da_name : Joi.string(),
    creation_date: Joi.number(),
    first_name: Joi.string(),
    last_name: Joi.string(),
    email: Joi.string().email(),
    job_level: Joi.string(),
    job_title: Joi.string(),
    job_function: Joi.string(),
    company_name: Joi.string(),
    phone: [Joi.string(), Joi.number()],
    website: Joi.string(),
    address1: Joi.string(),
    address2: [Joi.string(), Joi.number()],
    city: Joi.string(),
    state: Joi.string(),
    zip: [Joi.number(), Joi.string()],
    country: Joi.string(),
    company_size: Joi.string(),
    number_of_employees: Joi.number(),
    industry: Joi.string(),
    employee_linkedin: Joi.string(),
    company_linkedin: Joi.string(),
    freshaddress_result: Joi.string(),
    freshaddress_jobno: Joi.string(),
    tenure: Joi.string(),
    qa_status: Joi.string(),
    primary_reason: Joi.string(),
    comment: Joi.string(),
    audit_date: Joi.number(),
    verified_by: Joi.string().optional(),
    live_Verification_status: Joi.string().optional(),
    verification_date: [Joi.string(), Joi.number()],
    lv_voice_log_path: Joi.string(),
    campaign_id: Joi.number(),
    lead_type: Joi.string(),
    qa_name: Joi.string(),
    revenue: Joi.string(),
    link: Joi.string(),
    sic_naic_code: Joi.string()
// }).with('month',['creation_date', 'first_name', 'last_name', "email", "job_level","job_title","job_function"," company_name", "phone", "website"," address1","address2"," city"," state","zip","country","company_size","number_of_employees","industry","employee_linkedin","company_linkedin","freshaddress_result","freshaddress_jobno","tenure","qa_status","primary_reason", "comment","audit_date","verified_by","live_verification_status","verification_date","lv_voice_log_path","campaign_id","lead_type", "qa_name","revenue","link","sic_naic_code"]);    
}).unknown();
const url = `mongodb://${constants.mongoServerHost}:${constants.mongoServerPort}/${constants.mongoDataBaseName}`; //ConnectionURL

MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
    try {
        if (err) {
            console.log(`${new Date().getTime()} error while connecting with mongo server ${err}`);
        }
        console.log(`${new Date().getTime()} - Connected successfully to mongo server`);

        const db = client.db(constants.mongoDataBaseName);
        const collection = db.collection(constants.mongoCollectionName);
        // console.log(`${new Date().getTime()} - sheetContent are  ${JSON.stringify(sheetContent)}`);

        const checkEmailPhoneExists = (email, phone) => {
            return collection.findOne({
                "$or": [{
                    "email": email
                }, {
                    "phone": phone
                }]
            }).then(function(result) {
                return result !== null;
            });
        }
        const tasks = sheetContent.map((element) => {
            return (cb) => {
                // typeof element.phone == 'number' ? element.phone = JSON.stringify(element.phone) : '';
                Joi.validate(element, schema, function(err, value) {
                    if (err) {
                        console.log(`${new Date().getTime()} - validation error for`, err);
                        // console.log(`${new Date().getTime()} - your current data is ${element}. Make sure you have complete data filled in excel sheet.`);
                    }
                    if (!err && value) {
                        checkEmailPhoneExists(value.email, value.phone).then(function(valid) {
                            if (valid) {
                                console.log(`${new Date().getTime()} - Email or phone already in database for ${value}`);
                                cb(null, 'exists');
                            } else {
                                // console.log(`${new Date().getTime()} - Email/phone is valid inserting value in db`);
                                collection.insertOne(element, (err, result) => {
                                    if (err) {
                                        console.log(`${new Date().getTime()} - mongo insertOne error ${err}`);
                                    }
                                    // console.log(`${new Date().getTime()} - data for ${result.ops[0].month} with contact ${result.ops[0].Phone} and email ${result.ops[0].email} has been inserted with id ${result.insertedId} and result is ${JSON.stringify(result.result)}`)
                                    cb(null, 'success');
                                })
                            }
                        });
                    }
                });
            }
        })
        async.parallel(tasks, (err, results) => {
            if (err) {
                console.log(`${new Date().getTime()} - error while async.parallel ${err}`);
            }
            // console.log(`${new Date().getTime()} - data insertion done final callback. ${results}`);
            // console.log(`${new Date().getTime()} - done closing mongo client.`);
            client.close();
        })
    } catch (errorincatch) {
        console.log(`error caught in try catch ${errorincatch}`);
    }
});

// console.log(workbook);
// console.log(sheet_name_list);
// console.log(sheetContent);