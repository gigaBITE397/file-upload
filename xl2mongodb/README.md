# xl2mongodb

Tested on node version 10.16.0 LTS and node 8.x.x.
xl to mongodb will read sheet for you, parse it and insert in mongo db.

steps:
* ```npm i``` - to install dependancies
* ```node index.js``` - startpoint of the program.
* ```use mongo shell to find data in your database``` - database name and collection name is in constants.js.
* ```npm test``` or ```mocha test.js``` for test script. - You'll need mocha installed ```npm install -g mocha```

Default configuration will be in *constants.js* file. It consists host and port of mongo server and will have database name and collection name.

Validation for email and Indian mobile numbers are done.
If any of the field is kept empty, joi validation will throw error for missing property. If a valid JSON is found, it will then check if email or mobile any of them is already in database if found, it will not insert in database and you'll find a log for such cases. If all the validations are done, it will then insert data in data base.
