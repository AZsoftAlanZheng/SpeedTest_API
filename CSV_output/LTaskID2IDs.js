//Usage: node js [-l LTaskID] [-o outputfile]
//-l LongTerm Task ID
//-o output json file
//-h help
'use strict';

const assert = require('assert');
var fs = require('fs');
var jsonfile = require('jsonfile')
var REQUEST = require('request');
var fast_csv = require('fast-csv');
var CONFIG = require('../Config.js');
var argv = require('minimist')(process.argv.slice(2));

var FileOutput = argv.o;

if(argv.h || process.argv[5] == null  ) {
    console.log("help:");
    console.log("Usage: node js [-l LTaskID] [-o outputfile]");
    console.log("-l iLongTerm Task ID");
    console.log("-o output json file (taskIDs.json)");
    return;
}

var LTaskID = argv.l;
var LastToken = null;
var outputJson = {TaskIDs:[]};
var FileOutput = argv.o
var counter = 0;
console.log("LTaskID:"+LTaskID);
console.log("Output file:"+FileOutput);

function progress(c){
    var str = "total:"+c;
    if(process.stdout.clearLine != undefined) {
        process.stdout.clearLine();  // clear current text
        process.stdout.cursorTo(0);  // move cursor to beginning of line
        process.stdout.write(str);
    } else {
        console.log(str);
    }
}

function getAllSubtaskIDs(LTaskID, LastToken, outputJson) {
    CONFIG.getLTaskResult('AH3FllQBAInOz8oy5pMZWOINSkYlpieLftuiysPr', LTaskID, LastToken, function(error, requestOptions, response, data){
        try{
            progress(++counter);
            if (error) throw new Error(error);
            if(data.Code != 0) {
                throw new Error(data);
            }
            var subtasks = data.Result.Subtasks;
            if(subtasks == null || subtasks == undefined) {
                throw new Error("subtasks == null || subtasks == undefined");
            }
            if(subtasks instanceof Array) {
                subtasks.forEach(element => {
                    outputJson.TaskIDs.push(element.TaskID);
                });
            }

            LastToken = data.Result.LastToken;
            if(LastToken != null && LastToken != undefined) {
                getAllSubtaskIDs(LTaskID, LastToken, outputJson);
            } else {
                fs.writeFileSync(FileOutput, JSON.stringify(outputJson), {flag:'w'});
            }
        } catch(e) {
            // console.error('options');
            // console.error(requestOptions);
            console.error("error:");
            console.error(e);
            if(response == null) {
                console.error('retry');
                getAllSubtaskIDs(LTaskID, LastToken, outputJson);
            } else {
                console.error("response:");
                // console.error(response);
                getAllSubtaskIDs(LTaskID, LastToken, outputJson);
            }
        }
    })
}

getAllSubtaskIDs(LTaskID, LastToken, outputJson);