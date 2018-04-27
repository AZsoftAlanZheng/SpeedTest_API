//Usage: node js [-i inputfile] [-o outputfile]
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
    httpexpired:0,
    dnsexpired:0,
    retryTimes:0,
    error:0
};

if(argv.h || process.argv[5] == null  ) {
    console.log("help:");
    console.log("Usage: node js [-i inputfile] [-o outputfile]");
    console.log("-i input file (rtaskID_URLHost.json)");
    console.log("-o output csv file (results.csv)");
    return;
}

if(!fs.existsSync(FileInput)) {
    console.error("ERROR: Input File Path: " + FileInput + " does not exists!!! ");
	process.exit(1);
}

var FileOutputStream = fast_csv.createWriteStream({headers: true}),
writableStream = fs.createWriteStream(FileOutput);
writableStream.on("finish", function(){
    processOutput();
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
    var str = "total:"+taskCompleted.current+"/"+taskCompleted.total+", total(http/s):"+taskCompleted.httpcurrent+", expired(http/s):"+taskCompleted.httpexpired+", total(dns/ping/traceroute):"+taskCompleted.dnscurrent+", expired(dns/ping/traceroute):"+taskCompleted.dnsexpired+", retry:"+taskCompleted.retryTimes+", error:"+taskCompleted.error;
    if(process.stdout.clearLine != undefined) {
        process.stdout.clearLine();  // clear current text
        process.stdout.cursorTo(0);  // move cursor to beginning of line
        process.stdout.write(str);
    } else {
        console.log(str);
    }
}

function final() {
    FileOutputStream.end();
    console.log("END");
}

function series(element) {
	if(element) {
        CONFIG.getTaskRawResult('AH3FllQBAInOz8oy5pMZWOINSkYlpieLftuiysPr',element.ID, element.LastToken, function(error, requestOptions, response, data){
            try{
                if (error) throw new Error(error);
                if(data.Code != 0) {
                    throw new Error(data);
                }
                var task = new TaskObj(data.Result);

                if(data.Result.Raw instanceof Array) {
                    data.Result.Raw.forEach(element => {
                        var raw = new RawData(element);
                        var csvEntity = new CsvEntity(task,raw);
                        FileOutputStream.write(csvEntity);
                    });
                } else {
                    var csvEntity = new CsvEntity(task, null);
                    FileOutputStream.write(csvEntity);
                }

                if(data.Result.LastToken == null || data.Result.LastToken == undefined) {
                    taskCompleted.current++;
                    if(task.SpeedTest.Type == "HTTP" || task.SpeedTest.Type == "HTTPS") {
                        taskCompleted.httpcurrent++
                    } else { //task.SpeedTest.Type == "DNS" || task.SpeedTest.Type == "PING" || task.SpeedTest.Type == "TRACEROUTE"
                        taskCompleted.dnscurrent++;
                    }
                    if(task.Status == 3) {
                        if(task.SpeedTest.Type == "HTTP" || task.SpeedTest.Type == "HTTPS") {
                            taskCompleted.httpexpired++
                        } else { //task.SpeedTest.Type == "DNS" || task.SpeedTest.Type == "PING" || task.SpeedTest.Type == "TRACEROUTE"
                            taskCompleted.dnsexpired++;
                        }
                    }
                } else {
                    element.LastToken = data.Result.LastToken;
                    TaskIDList.push(element);
                }
            } catch(e) {
                console.error('options');
                console.error(requestOptions);
                console.error("error:");
                console.error(e);
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

var list = JSON.parse(fs.readFileSync(FileInput, 'utf8')).TaskIDs;
var TaskIDList = [];
for(var i=0; i< list.length;i++) {
    TaskIDList.push({ID:list[i]})
}
list = null;

running = MAX_RUNNING<TaskIDList.length? MAX_RUNNING:TaskIDList.length;
taskCompleted.total = TaskIDList.length;
for(var i=0; i< running;i++) {
    series(TaskIDList.shift());
}

class TaskObj {
    constructor(taskDetailJSON) {
        this.LTaskID = taskDetailJSON.LTaskID;
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

        this.LTaskID = taskObj.LTaskID;
        this.TaskID = taskObj.TaskID;
        this.TaskCreationTime = taskObj.TaskCreationTime
        this.Status = taskObj.Status;
        this.Description = taskObj.Description;

        this.Type = speedtest.Type;
        this.URL = speedtest.URL;
        this.Host = speedtest.Host;

        this.Country_City = CONFIG.Country_City_Array[restriction.Country_City-1].Name;
        this.Carrier = CONFIG.Carrier_Array[restriction.Carrier].Name;
        this.Network = CONFIG.Network_Array[restriction.Network-1].Name;
        this.Client = restriction.Client;

        if( rawData && rawData.hasOwnProperty('Time')) {
            var time = rawData.Time;
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
        } else {
            this.HttpStatus = null;
            this.ClientStatus = null;
            this.IP = null;
            this.ClientIP = null;
            this.DNS = null;
            this.RTT = null;
            this.TTFB = null;
            this.R = null;
            this.Req = null;
            this.Res = null;
            this.Connect = null;
        }

    }
} 
