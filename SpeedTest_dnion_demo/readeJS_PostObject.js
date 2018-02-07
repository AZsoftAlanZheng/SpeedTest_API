//Usage: node js {inputfile} 

'use strict';

var fs = require('fs');
var jsonfile = require('jsonfile')
var REQUEST = require('request');

var FileERROR = '/home/alan/opt/backup/git/SpeedTest_API/SpeedTest_dnion_demo/ERROR_PostObjcect.json';
var FileInput = process.argv[2];
if(!fs.existsSync(FileInput)) {
    console.error("ERROR: Input File Path: " + FileInput + " does not exists!!! ");
	process.exit(1);
}

var lineReader = require('readline').createInterface({
    input: fs.createReadStream(FileInput)
});

lineReader.on('line', function (line) {
    var obj = JSON.parse(line);
    console.dir(obj);

    //POST Object
    var httpoptions = {
        method: 'POST',
        url: 'http://10.10.20.60:30110/objects/v2/LongTermTask_dnion',
        headers: {
            'cache-control': 'no-cache',
            'x-droi-role': 'AH3FllQBAInOz8oy5pMZWOINSkYlpieLftuiysPr',
            'x-droi-appid': '85kvmbzhq2gdJIXW5iNhM1CLD5CJ1Ua1lQC0hBwA' },
        body: JSON.stringify(obj)
    };

    REQUEST(httpoptions, function (error, response, body) {
        if (error) {
            throw new Error(error)
        } else {
            var data = JSON.parse(body);
            if(data.Code == undefined || data.Code != 0) {
                error = new Error("ERROR: data.Code="+data.Code);
            } else if(data.Result == undefined) {
                error = new Error("ERROR: data.Result="+data.Result);
            } else if(data.Result.Created == undefined) {
                error = new Error("ERROR: data.Result.Created="+data.Result.Created);
            } else if(data.Result._Id == undefined) {
                error = new Error("ERROR: data.Result._Id="+data.Result._Id);
            } else if(data.Result.UpdatedAt == undefined) {
                error = new Error("ERROR: data.Result.UpdatedAt="+data.Result.UpdatedAt);
            } else {
            }
            if(error) {
                console.log(body);
                jsonfile.writeFile(FileERROR, obj, {flag: 'a'}, function (err) {
                    console.log(body);
                    console.error(err)
                })
                throw error;
            }
        }
    });
});