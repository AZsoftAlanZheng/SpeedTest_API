//Usage: node js {-i inputfile} [-o outputfile] [-c statistic_outputfile] [-p]
//-i input file
//-o output results file (CSV)
//-h help
'use strict';


const assert = require('assert');
var fs = require('fs');
var jsonfile = require('jsonfile')
var REQUEST = require('request');
var fast_csv = require('fast-csv');
var CONFIG = require('../Config.js');
var argv = require('minimist')(process.argv.slice(2));

var FileInput = argv.i;
var FileOutput = argv.o;
var FileOutputStream = null;
var running = 0;
var MAX_RUNNING = 50;
console.dir(argv);

var taskCompleted = {
    total:0,
    current:0,
    httpcurrent:0,
    dnscurrent:0,
    expired:0,
    retryTimes:0,
    error:0
};

if(argv.h || process.argv[3] == null  ) {
    console.log("help:");
    console.log("Usage: node js [-i inputfile] [-o outputfile]");
    console.log("-i input file (rtaskID_URLHost.json)");
    console.log("-o output csv file (results.csv)");
    return;
}

if(FileInput && !fs.existsSync(FileInput)) {
    console.error("ERROR: Input File Path: " + FileInput + " does not exists!!! ");
	process.exit(1);
}

var FileOutputStream = fast_csv.createWriteStream({headers: true}),
writableStream = fs.createWriteStream(FileOutput);
writableStream.on("finish", function(){
    console.log("DONE!");
});
FileOutputStream.pipe(writableStream);

// CONFIG.getObjects('AH3FllQBAInOz8oy5pMZWOINSkYlpieLftuiysPr','SpeedTask','{"_CreationTime":{"$gte":"2018-04-18","$lte":"2018-04-19"},"SpeedTest.URL":"http://snsdcres.yy845.com/old/index.html"}', function(error, data, returnLatestID){
//     if(error) {
//         console.log(error)
//     } else {
//         console.log(data)
//     }
// })

function processOutput(){
    if(process.stdout.clearLine != undefined) {
        process.stdout.clearLine();  // clear current text
        process.stdout.cursorTo(0);  // move cursor to beginning of line
        process.stdout.write("completed tasks:"+taskCompleted.current+"/"+taskCompleted.total+", completed http tasks:"+taskCompleted.httpcurrent+", expired:"+taskCompleted.expired+", completed dns tasks:"+taskCompleted.dnscurrent+", retry:"+taskCompleted.retryTimes+", error:"+taskCompleted.error);
    } else {
        console.log("completed tasks:"+taskCompleted.current+"/"+taskCompleted.total+", completed http tasks:"+taskCompleted.httpcurrent+", expired:"+taskCompleted.expired+", completed dns tasks:"+taskCompleted.dnscurrent+", retry:"+taskCompleted.retryTimes+", error:"+taskCompleted.error);
    }
}

function final() {
    FileOutputStream.end();
    console.log("END");
}

function series(element) {
	if(element) {
        CONFIG.getTaskRawResult('AH3FllQBAInOz8oy5pMZWOINSkYlpieLftuiysPr',element,function(error, requestOptions, response, data){
            try{
                if (error) throw new Error(error);
                if(data.Code != 0) {
                    throw new Error(data);
                }
                var task = new TaskObj(data.Result);

                if(task.SpeedTest.Type == "HTTP") {
                    taskCompleted.httpcurrent++
                }
                if(task.SpeedTest.Type == "DNS") {
                    taskCompleted.dnscurrent++;
                }
                if(task.Status == 3) {
                    taskCompleted.expired++;
                }

                if(data.Result.Raw instanceof Array) {
                    data.Result.Raw.forEach(element => {
                        var raw = new RawData(element);
                        var csvEntity = new CsvEntity(task,raw);
                        FileOutputStream.write(csvEntity);
                    });
                }
                taskCompleted.current++;
            } catch(e) {
                console.error('options');
                console.error(requestOptions);
                console.error("error:");
                console.error(error);
                if(response == null) {
                    console.error('retry');
                    taskCompleted.retryTimes++;
                    console.log();
                } else {
                    console.error("response:");
                    console.error(response);
                    taskCompleted.error++;
                    console.log();
                }
                TaskIDList.push(element);
            } finally {
                processOutput();
                series(TaskIDList.shift());
            }
        })
	} else {
        running--;
        if(running == 0)
		    return final();
	}
}

var TaskIDList = JSON.parse(fs.readFileSync(FileInput, 'utf8')).taskIDsURL.concat(JSON.parse(fs.readFileSync(FileInput, 'utf8')).taskIDsHost);

running = MAX_RUNNING<TaskIDList.length? MAX_RUNNING:TaskIDList.length;
taskCompleted.total = TaskIDList.length;
for(var i=0; i< running;i++) {
    series(TaskIDList.shift());
}

class TaskObj {
    constructor(taskDetailJSON) {
        this.TaskID = taskDetailJSON.TaskID;
        this.TaskCreationTime = taskDetailJSON.TaskCreationTime
        this.Status = taskDetailJSON.Status;
        this.Description = taskDetailJSON.Description;
        this.SpeedTest = taskDetailJSON.SpeedTest;
    }
}

class RawData {
    constructor(Raw) {
        this.HttpStatus = Raw.HttpStatus;
        this.ClientStatus = Raw.ClientStatus;
        this.IP = Raw.IP;
        this.ClientIP = Raw.ClientIP;
        this.Time = Raw.Time;
    }
}

class CsvEntity {
    constructor(taskObj, rawData) {
        var speedtest = taskObj.SpeedTest;
        var restriction = speedtest.Restriction;
        var time = rawData.Time;

        this.TaskID = taskObj.TaskID;
        this.TaskCreationTime = taskObj.TaskCreationTime
        this.Status = taskObj.Status;
        this.Description = taskObj.Description;

        this.Type = speedtest.Type;
        this.URL = speedtest.URL;
        this.Host = speedtest.Host;

        this.Country_City = restriction.Country_City;
        this.Carrier = restriction.Carrier;
        this.Network = restriction.Network;
        this.Client = restriction.Client;

        this.HttpStatus = rawData.HttpStatus;
        this.ClientStatus = rawData.ClientStatus;
        this.IP = rawData.IP;
        this.ClientIP = rawData.ClientIP;
        this.DNS = time.DNS;
        this.RTT = time.RTT;
        this.TTFB = time.TTFB;
        this.R = time.R;
        this.Req = time.Req;
        this.Res = time.Res;
        this.Connect = time.Connect;
    }
} 