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

var TaskQueue = [];
var running = 0;
const MAX_RUNNING = 50;
var outputJson = {TaskIDs:[]};
const Start = '1525392000';//GMT: 2018年May4日Friday 00:00:00
const End = '1525824000';//GMT: 2018年May9日Wednesday 00:00:00
const TypeArray = ['HTTP','DNS'];

var append = false;
const LTaskID = argv.l;
const FileOutput = argv.o;
var counter = 0;
console.log("LTaskID:"+LTaskID);
console.log("Output file:"+FileOutput);


class TaskObj {
    constructor(LTaskID,Start,End,Type,LastToken) {
        this.LTaskID = LTaskID;
        this.Start = Start;
        this.End = End;
        this.Type = Type;
        this.LastToken = LastToken;
    }
}

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

function final() {
    fs.writeFileSync(FileOutput, JSON.stringify(outputJson), {flag:'w'});
}

function getAllSubtaskIDs(element, outputJson) {
    if(element) {
        CONFIG.getLTaskResult('AH3FllQBAInOz8oy5pMZWOINSkYlpieLftuiysPr', element.LTaskID, element.Start, element.End, element.Type, element.LastToken, function(error, requestOptions, response, data){
            try{
                progress(++counter);
                if (error) throw new Error(error);
                if(data.Code != 0) {
                    throw new Error('data.Code != 0, '+ data.toString());
                }
                if(data.Result.ErrorCode != undefined) {
                    throw new Error('data.Result.ErrorCode != undefined, '+ data.Result.ErrorCode+ ', ' +data.Result.MSG);
                }
                var subtasks = data.Result.Subtasks;
                if(subtasks == null || subtasks == undefined) {
                    throw new Error("subtasks == null || subtasks == undefined");
                }
                var str = "";
                if(subtasks instanceof Array) {
                    subtasks.forEach(element => {
                        outputJson.TaskIDs.push(element.TaskID);
                    });
                }
    
                element.LastToken = data.Result.LastToken;
                if(element.LastToken != null && element.LastToken != undefined ) {
                    TaskQueue.push(element);
                }
            } catch(e) {
                console.error('\noptions');
                console.error(requestOptions);
                console.error("\nerror:");
                console.error(e);
                if(response == null) {
                    console.error('retry');
                } else {
                    console.error("retry & response:");
                }
                TaskQueue.push(element);
            } finally {
                getAllSubtaskIDs(TaskQueue.shift(),outputJson);
            }
        })
    } else {
        running--;
        if(running == 0)
            return final();
    }
}


TypeArray.forEach(element=>{
    console.log("Type:"+element);
    TaskQueue.push(new TaskObj(LTaskID,Start,End,element,null));
})

running = MAX_RUNNING<TaskQueue.length? MAX_RUNNING:TaskQueue.length;
for(var i=0; i< running;i++) {
    getAllSubtaskIDs(TaskQueue.shift(),outputJson);
}