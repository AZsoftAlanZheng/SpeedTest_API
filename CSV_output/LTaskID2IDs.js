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

if(argv.h || process.argv[5] == null  ) {
    console.log("help:");
    console.log("Usage: node js [-l LTaskID] [-o outputfile]");
    console.log("-l LongTerm Task ID");
    console.log("-o output json file (taskIDs.json)");
    return;
}

var append = false;
var LTaskID = argv.l;
var LastToken = null;
var counter = 0;
console.log("LTaskID:"+LTaskID);
console.log("Output file:"+argv.o);
var FileOutput = fs.createWriteStream(argv.o, {
    flags: 'w' 
}).on('open', () => {
    FileOutput.write('{"TaskIDs":[');
}).on('close', () => {
    console.log('\nDone');
}).on('error', (err) => {
    console.error(err);
})

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
                throw new Error('data.Code != 0, '+ data.toString());
            }
            var subtasks = data.Result.Subtasks;
            if(subtasks == null || subtasks == undefined) {
                throw new Error("subtasks == null || subtasks == undefined");
            }
            var str = "";
            if(subtasks instanceof Array) {
                subtasks.forEach(element => {
                    if(append) {
                        str = str +',"'+element.TaskID+'"';
                    } else {
                        str = '"'+element.TaskID+'"';
                        append = true;
                    }
                });
                FileOutput.write(str);
            }

            LastToken = data.Result.LastToken;
        } catch(e) {
            // console.error('options');
            // console.error(requestOptions);
            console.error("\nerror:");
            console.error(e);
            if(response == null) {
                console.error('retry');
            } else {
                console.error("retry & response:");
            }
        } finally {
            if(data.hasOwnProperty('Code') && data.Code == 0 && (LastToken == null || LastToken == undefined)) {
                FileOutput.write(']}');
                FileOutput.end();
            } else {
                //recursive
                getAllSubtaskIDs(LTaskID, LastToken);
            }
        }
    })
}

getAllSubtaskIDs(LTaskID, LastToken);