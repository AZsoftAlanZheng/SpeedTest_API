#!/usr/bin/env node
//usage: node index.js > source.md

'use strict';

var fs = require('fs');
var REQUEST = require('request');
var ASSERT = require('assert');
var CONFIG = require('../Config.js');

var ctxs = [
    {
        user:{
            name: 'dnion',
            pw: '250b402a5c95f64cf1cafde438b38a3c5ce03bc2003fcd8c917a97700fb52c3c',
            token: null
        },
        dateObjArray: [],
        fareObject: [],
        cites: null
    },
    {
        user:{
            name: 'qiniu',
            pw: '66435514515c7751314ad10a83f0786a46d051440476a0877f5c71fe3be518f7',
            token: null
        },
        dateObjArray: [],
        fareObject: [],
        cites: null
    }
];

Date.prototype.yyyymmdd = function() {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();

    return [this.getFullYear(),
        (mm>9 ? '-' : '-0') + mm,
        (dd>9 ? '-' : '-0') + dd
        ].join('');
};
Date.prototype.toBaasUTCTimeString = function() {
    //baas utc time format: 2018-05-24T10:13:58.180Z
//console.log('baas:'+ttt.getUTCFullYear()+'-'+(ttt.getUTCMonth()+1)+'-'+ttt.getUTCDate()+'T'+ttt.getUTCHours()+':'+ttt.getUTCMinutes()+':'+ttt.getUTCSeconds()+'.'+ttt.getUTCMilliseconds()+'Z');
    var yy = this.getUTCFullYear(); //2018
    var mm = this.getUTCMonth() + 1;
    if(mm<=9) mm = '0'+mm;
    var dd = this.getUTCDate();
    if(dd<=9) dd = '0'+dd;
    var hh = this.getUTCHours();
    if(hh<=9) hh = '0'+hh;
    var min = this.getUTCMinutes();
    if(min<=9) min = '0'+min;
    var ss = this.getUTCSeconds();
    if(ss<=9) ss = '0'+ss;
    var ms = this.getUTCMilliseconds();
    if(ms<=9) ms = '00'+ms;
    else if(ms<=99) ms = '0'+ms;

    return yy+'-'+mm+'-'+dd+'T'+hh+':'+min+':'+ss+'.'+ms+'Z';
}

ctxs.forEach(function(ctx){
    initDateObjArray(ctx.dateObjArray);
    CONFIG.login(ctx.user.name, ctx.user.pw, function(error,token){
        if(error) {
            console.log(error);
        } else {
            ctx.user.token = token;
            CONFIG.loadCites(token, function(error, citesObject){
                if(error){
                    console.log(error);
                } else {
                    ctx.cites = citesObject;
                    CONFIG.loadFare(token, function(error, fareObject){
                        if(error){
                            console.log(error);
                        } else {
                            ctx.fareObject = fareObject
                            series(ctx, 0);
                        }
                    })
                }
            })
        }
    });
});

function initDateObjArray(array) {
    array.splice(0, array.length);
    // array.push({date:'2017-12-21', latestID:null, rows:[]});
    // array.push({date:'2017-12-22', latestID:null, rows:[]});
    // array.push({date:'2017-12-23', latestID:null, rows:[]});
    // array.push({date:'2017-12-24', latestID:null, rows:[]});
    // array.push({date:'2017-12-25', latestID:null, rows:[]});
    // array.push({date:'2017-12-26', latestID:null, rows:[]});
    // array.push({date:'2017-12-27', latestID:null, rows:[]});
    for(var i=7;i>0;i--) {
        var d = new Date(); // Today!
        d.setDate(d.getDate() - i);
        array.push({date:d.yyyymmdd(), latestID:null, rows:[]});
    }
}

function final(ctx) {
    outputUser(ctx.user.name);
    outputCites(ctx.cites);
    outputFare(ctx.fareObject);
    outputAggregateData(ctx.dateObjArray);
    outputRows(ctx.dateObjArray, ctx.cites);
}

//callback: function(error)
function loadMoreTasks(token, dateObj, callback) {
    var start = new Date(dateObj.date+' 00:00:00').toBaasUTCTimeString();
    var end = new Date(dateObj.date+' 24:00:00').toBaasUTCTimeString();
    CONFIG.loadTasks(token, start, end, dateObj.latestID, function(error, data, returnLatestID) {
        if(error) {
            callback(error);
        } else {
            if(data.length > 0) {
                dateObj.latestID = returnLatestID;
                dateObj.rows = dateObj.rows.concat(data);
                loadMoreTasks(token,dateObj, callback);
            } else {
                callback(null);
            }
        }
    });
}

function series(ctx, index) {
    if(ctx.dateObjArray[index]) {
        loadMoreTasks(ctx.user.token, ctx.dateObjArray[index], function(error){
            if(error) {
                console.log(error);
            } else {
                series(ctx, ++index);
            }
        })
    } else {
        return final(ctx);
    }
}

function outputUser(userName) {
    console.log('## 用戶ID');
    console.log('* '+userName);
}

function outputCites(citesObject) {
    return;
    console.log('## 城市分類');
    for(var i=1;i<4;i++) {
        console.log('### '+i+'級城市');
        citesObject['Category'+i].forEach(function(element, index, array){
            console.log('* '+element);
        })
    }
}

function outputFare(fareObject) {
    console.log('## 价格矩阵');
    console.log('| | | HTTP/PING/DNS/UDP/TCP<br>(Wi-fi<512KB, Cell<1KB) | HTTP/PING/DNS/UDP/TCP<br>(Wi-fi>512KB, 1KB< Cell<4KB) | TraceRoute ');
    console.log('| :--- | :---: | ---: | ---: | ---: ');
    console.log('| 1級城市 | Wi-Fi | '+fareObject['111']+' | '+fareObject['112']+' | '+fareObject['113']+' ');
    console.log('| | Cellular | '+fareObject['121']+' | '+fareObject['122']+' | '+fareObject['123']+' ');
    console.log('| 2級城市 | Wi-Fi | '+fareObject['211']+' | '+fareObject['212']+' | '+fareObject['213']+' ');
    console.log('| | Cellular | '+fareObject['221']+' | '+fareObject['222']+' | '+fareObject['223']+' ');
    console.log('| 3級城市 | Wi-Fi | '+fareObject['311']+' | '+fareObject['312']+' | '+fareObject['313']+' ');
    console.log('| | Cellular | '+fareObject['321']+' | '+fareObject['322']+' | '+fareObject['323']+' ');
}

function outputAggregateData(dateObjArray) {
    console.log('## 计量报表');
    console.log('| 日期 | 费用')
    console.log('| --- | ---')
    for(var i=0;i<dateObjArray.length;i++) {
        var obj = dateObjArray[i];
        if(obj.rows.length == 0) {
            console.log('| '+obj.date+' | 0 ')
        } else {
            var sum = 0.0;
            for(var j=0;j<obj.rows.length;j++) {
                sum += obj.rows[j].Cost;
            }
            console.log('| '+obj.date+' | ' + sum.toFixed(2));
        }
    }
}

function outputRows(dateObjArray, cites) {
    console.log('## 任务清单');
    console.log('| 日期 | 创建任务时间 | 任务辨别码 | 城市分类 | 省份与城市 | 营运商 | 网路类别 | 任务类别 | 任务状态 | 指定取样的数量 | 真实取样的数量 | 费用')
    console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---')
    for(var i=0;i<dateObjArray.length;i++) {
        var obj = dateObjArray[i];
        if(obj.rows.length == 0) {
            console.log('| '+obj.date+' |  |  |  |  |  |  |  |  |  |  | ')
        } else {
            for(var j=0;j<obj.rows.length;j++) {
                var str;
                if(j==0) {
                    str = '| '+obj.date+' | ';
                } else {
                    str = '|  | ';
                }
                var row = obj.rows[j];
                var citetag = cites.city2category[row.City];
                switch(cites.city2category[row.City]) {
                    case 1:
                        citetag = '1級城市';
                        break;
                    case2 :
                        citetag = '2級城市';
                        break;
                    case 3:
                        citetag = '3級城市';
                        break;
                    default:
                        citetag = '';
                }
                if(row.CarrierName == undefined) {
                    row.CarrierName = "尚未加入";
                }
                console.log(str + row.Date+' | '+row.TaskID+' | '+citetag+' | '+row.CityName+' | '+row.CarrierName+' | '+row.NetworkName+' | '+row.TypeName+' | '+row.Description+' | '+row.DesignatedCount+' | '+row.RecievedCount+' | '+row.Cost)
            }
        }
    }
}

