'use strict';

var fs = require('fs');
var REQUEST = require('request');
var fast_csv = require('fast-csv');
var argv = require('minimist')(process.argv.slice(2));
var TokenG = require('./tokenGenerator.js');

var running = 0;
const MAX_RUNNING = 50;
const now = new Date()
const FileInputRsultsCSV = './101cityIPIPMapping17ce.csv'
const FileHttpOutput = './results.http'+now.toISOString()+'.txt'
const FilePingOutput = './results.ping'+now.toISOString()+'.txt'
const LogOutput = './log.'+now.toISOString()+'.txt'
const userName = 'shimengying@droi.com'
const passWord = 'Droi2018';
var execTimes = 3*2;//2 types
const intervalSec = 30*60;//30*60;
const checkReusltIntervalSec = 5*60;
var cityList = [];

fast_csv.fromPath(FileInputRsultsCSV,{delimiter:",",headers : true})
.on("data", obj => {
    cityList.push(obj.city);
}).on("end", function(){
    console.log('loading end')
    setTimeout(createTask, intervalSec*1000, 'HTTP');
    setTimeout(createTask, intervalSec*1000, 'PING');
});

//str: object
function writeToFile(filename, str) {
	console.log(str);
	fs.writeFile("./"+filename, JSON.stringify(str), function(err) {
	    if(err) {
	        return console.error(err);
	    }
	});
}

//type: string, [HTTP/PING]
function createTask(type) {
    let startTime=new Date();
    console.log(execTimes);
    execTimes--;
    if(execTimes < 0) return;
    
    try {
        let urlstr = '';
        if(type === 'HTTP') {
            urlstr = 'https://api.17ce.com/http';
        } else if(type === 'PING') {
            urlstr = 'https://api.17ce.com/ping';
        } else {
            throw new Error('type is wrong, '+type);
        }
        writeToFile(LogOutput,'startTime:'+startTime.toISOString()+', createTask(), '+'type:'+type);
        let ts = TokenG.getTS();
        let options = { method: 'POST',
        url: urlstr,
        headers: {
            'Cache-Control': 'no-cache',
            'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
        formData: { 
            user: 'shimengying@droi.com',
            code: TokenG.token(userName,passWord,ts),
            t: ts,
            url: 'http://snsdcres.yy845.com/old/index.html',
            city: cityList.toString(),
            isp: '1,2,7' } };
    
        request(options, function (error, response, body) {
            var data = null;
            try {
                if (error) {
                    throw error;
                } else {
                    data = JSON.parse(body);
                    if(data.tid == null) {
                        throw new Error('data.tid == null');
                    } else if(data.tid == undefined) {
                        throw new Error('data.tid == undefined');
                    } else {
                        writeToFile(LogOutput,'startTime:'+startTime.toISOString()+', tid:\n'+data.tid.toString()+'\nresponse:'+response.toString()+'\n');
                        setTimeout(parseResult(), checkReusltIntervalSec*1000, data.tid, startTime, type);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        });
    } catch(e) {
        console.error(e);
    } finally {
        var ttt = intervalSec*1000-(new Date()-startTime);
        setTimeout(createTask, (ttt<0?0:ttt), type);
    }
}

function parseResult(taskid,startTime,type) {
    try {
        if(type !== 'HTTP' && type !== 'PING') {
            throw new Error('type is wrong, '+type);
        }
        writeToFile(LogOutput,'startTime:'+startTime.toISOString()+', parseResult(), '+'type:'+type);
        var options = { method: 'POST',
        url: 'https://api.17ce.com/ajaxfresh',
        headers: {
            'Cache-Control': 'no-cache',
            'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
        formData: {
            user: 'shimengying@droi.com',
            code: TokenG.token(userName,passWord,ts),
            t: ts,
            tid: taskid } };
    
        request(options, function (error, response, body) {
            var data = null;
            try {
                if (error) {
                    throw error;
                } else {
                    data = JSON.parse(body);
                    if(data.tid == null) {
                        throw new Error('data.tid == null');
                    } else if(data.tid == undefined) {
                        throw new Error('data.tid == undefined');
                    } else if (data.tid != taskid) {
                        throw new Error('data.tid != taskid,'+data.tid+', '+taskid);
                    } else {
                        writeToFile(LogOutput,'startTime:'+startTime.toISOString()+', tid:\n'+data.tid.toString()+'\nget results response:'+response.toString()+'\n');
                        let obj ={
                            creationTime:startTime,
                            content:data
                        };
                        if(type === 'HTTP') {
                            writeToFile(FileHttpOutput, obj);
                        } else {
                            writeToFile(FilePingOutput, ojb);
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }
        });
    } catch (e) {
        console.error(e);
    }
}