'use strict';

var fs = require('fs');
var REQUEST = require('request');
var fast_csv = require('fast-csv');
var argv = require('minimist')(process.argv.slice(2));
var TokenG = require('./tokenGenerator.js');

var running = 0;
const MAX_RUNNING = 50;
const now = new Date()
const prefix = '.';
// const prefix = '/Volumes/alan-opt/backup/git/SpeedTest_API/17ceAPI';
const FileInputRsultsCSV = prefix+'/101cityIPIPMapping17ce.csv'
const FileHttpOutput = prefix+'/results.http'+now.toISOString()+'.txt'
const FilePingOutput = prefix+'/results.ping'+now.toISOString()+'.txt'
const LogOutput = prefix+'/log.'+now.toISOString()+'.txt'
const userName = 'shimengying@droi.com'
const passWord = 'Droi2018';
var execTimes = 24*3*2*2;//2 types
const intervalSec = 30*60;//30*60;
const checkReusltIntervalSec = 5*60;
var cityList = [];

var FileHttpOutputPipe = fs.createWriteStream(FileHttpOutput, {
    flags: 'w' 
})
var FilePingOutputPipe = fs.createWriteStream(FilePingOutput, {
    flags: 'w'
})
var LogOutputPipe = fs.createWriteStream(LogOutput, {
    flags: 'w'
})

fast_csv.fromPath(FileInputRsultsCSV,{delimiter:",",headers : true})
.on("data", obj => {
    cityList.push(obj.city);
}).on("end", function(){
    console.log('loading end')
    createTask('HTTP');
    createTask('PING');
});

//type: string, [HTTP/PING]
function createTask(type) {
    let startTime=new Date();
    let urlstr = '';
    if(type === 'HTTP') {
        urlstr = 'https://api.17ce.com/http';
    } else if(type === 'PING') {
        urlstr = 'https://api.17ce.com/ping';
    } else {
        throw new Error('createTask(), type is wrong, '+type);
    }

    try {
        execTimes--;
        if(execTimes < 0) {
            FileHttpOutputPipe.end();
            FilePingOutputPipe.end();
            LogOutputPipe.end();
            return;
        }
        
        LogOutputPipe.write('startTime:'+startTime.toISOString()+', createTask(), '+'type:'+type+"\n");
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
    
        REQUEST(options, function (error, response, body) {
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
                        LogOutputPipe.write('startTime:'+startTime.toISOString()+", tid:"+data.tid.toString()+', type:'+type+", response:"+JSON.stringify(response)+"\n");
                        setTimeout(parseResult, checkReusltIntervalSec*1000, data.tid, startTime, type);
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
            throw new Error('parseResult(), type is wrong, '+type);
        }
        LogOutputPipe.write('startTime:'+startTime.toISOString()+', parseResult(), '+'type:'+type+"\n");
        let ts = TokenG.getTS();
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
    
        REQUEST(options, function (error, response, body) {
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
                        LogOutputPipe.write('startTime:'+startTime.toISOString()+", tid:"+data.tid.toString()+"get results response:"+JSON.stringify(response)+"\n");
                        let obj ={
                            creationTime:startTime,
                            queryTime:new Date(),
                            content:data
                        };
                        if(type === 'HTTP') {
                            FileHttpOutputPipe.write(JSON.stringify(obj));
                        } else {
                            FilePingOutputPipe.write(JSON.stringify(obj));
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