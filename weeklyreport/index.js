#!/usr/bin/env node
//usage: node index.js > source.md

'use strict';

var fs = require('fs');
var REQUEST = require('request');
var ASSERT = require('assert');
var CONFIG = require('../Config.js');

var UserInfo = {
    name: 'qiniu',
    pw: '66435514515c7751314ad10a83f0786a46d051440476a0877f5c71fe3be518f7',
    token: null
};

var ctx = {
    user:{
        name: 'qiniu',
        pw: '66435514515c7751314ad10a83f0786a46d051440476a0877f5c71fe3be518f7',
        token: null
    },
    dateObjArray: [],
    cites: null
}

initDateObjArray(ctx.dateObjArray);

CONFIG.login(ctx.user.name, ctx.user.pw, function(error,token){
    if(error) {
        console.log(error);
    } else {
        outputUser(ctx.user.name);
        ctx.user.token = token;
        CONFIG.loadCites(token, function(error, citesObject){
            if(error){
                console.log(error);
            } else {
                ctx.cites = citesObject;
                outputCites(ctx.cites);
                CONFIG.loadFare(token, function(error, fareObject){
                    if(error){
                        console.log(error);
                    } else {
                        outputFare(fareObject);
                        series(ctx.dateObjArray, 0);
                    }
                })
            }
        })
    }
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

    Date.prototype.yyyymmdd = function() {
        var mm = this.getMonth() + 1; // getMonth() is zero-based
        var dd = this.getDate();

        return [this.getFullYear(),
            (mm>9 ? '-' : '0') + mm,
            (dd>9 ? '-' : '0') + dd
            ].join('');
    };
    for(var i=7;i>0;i--) {
        var d = new Date(); // Today!
        d.setDate(d.getDate() - i);
        array.push({date:d.yyyymmdd(), latestID:null, rows:[]});
    }
}

function final() {
    outputRows(ctx.dateObjArray);
}

//callback: function(error)
function loadMoreRows(dateObj, callback) {
    CONFIG.loadMore(ctx.user.token, dateObj.date, dateObj.latestID, function(error, data, returnLatestID) {
        if(error) {
            callback(error);
        } else {
            if(data.length > 0) {
                dateObj.latestID = returnLatestID;
                dateObj.rows = dateObj.rows.concat(data);
                loadMoreRows(dateObj, callback);
            } else {
                callback(null);
            }
        }
    });
}

function series(dateObjArray, index) {
    if(dateObjArray[index]) {
        loadMoreRows(dateObjArray[index], function(error){
            if(error) {
                console.log(error);
            } else {
                series(dateObjArray, ++index);
            }
        })
    } else {
        return final();
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
    console.log('| | | HTTP/PING/DNS/UDP/TCP (Wi-fi<512KB, Cell<1KB) | HTTP/PING/DNS/UDP/TCP(Wi-fi>512KB, 1KB< Cell<4KB) | TraceRoute ');
    console.log('|--- | --- | --- | --- | --- ');
    console.log('| 1級城市 | Wi-Fi | '+fareObject['111']+' | '+fareObject['112']+' | '+fareObject['113']+' ');
    console.log('| | Cellular | '+fareObject['121']+' | '+fareObject['122']+' | '+fareObject['123']+' ');
    console.log('| 2級城市 | Wi-Fi | '+fareObject['211']+' | '+fareObject['212']+' | '+fareObject['213']+' ');
    console.log('| | Cellular | '+fareObject['221']+' | '+fareObject['222']+' | '+fareObject['223']+' ');
    console.log('| 3級城市 | Wi-Fi | '+fareObject['311']+' | '+fareObject['312']+' | '+fareObject['313']+' ');
    console.log('| | Cellular | '+fareObject['321']+' | '+fareObject['322']+' | '+fareObject['323']+' ');
}

function outputRows(dateObjArray) {
    console.log('## 计量报表');
    console.log('| 日期 | 创建任务时间 | 任务辨别码 | 城市分类 | 省份与城市 | 网路类别 | 任务类别 | 任务状态 | 指定取样的数量 | 真实取样的数量 | 费用')
    console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---')
    for(var i=0;i<dateObjArray.length;i++) {
        var obj = dateObjArray[i];
        if(obj.rows.length == 0) {
            console.log('| '+obj.date+' |  |  |  |  |  |  |  |  |  | ')
        } else {
            for(var j=0;j<obj.rows.length;j++) {
                var str;
                if(j==0) {
                    str = '| '+obj.date+' | ';
                } else {
                    str = '|  | ';
                }
                var row = obj.rows[j];
                var citetag = ctx.cites.city2category[row.City];
                switch(ctx.cites.city2category[row.City]) {
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
                console.log(str + row.Date+' | '+row.TaskID+' | '+' | '+citetag+' | '+row.CityName+' | '+row.NetworkName+' | '+row.TypeName+' | '+row.Description+' | '+row.DesignatedCount+' | '+row.RecievedCount+' | '+row.Cost)
            }
        }
    }
}

