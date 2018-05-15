//Usage: node js [-i inputfile] [-o outputfile]
//-i input file
//-o output results file (CSV)
//-t type {http/ping}
//-h help
'use strict';
var fs = require('fs');
var readline = require('readline');
var fast_csv = require('fast-csv');
var ms = require('millisecond');
var argv = require('minimist')(process.argv.slice(2));

var FileInput = argv.i;
var FileOutput = argv.o;
var typeIsHttp = true;
var currentLine = 0;
var totalObj = 0;

if(argv.h || process.argv[7] == null || (argv.t != 'http' && argv.t != 'ping') ) {
    console.log("help:");
    console.log("Usage: node js [-i inputfile] [-o outputfile]");
    console.log("-i input file (rtaskID_URLHost.json)");
    console.log("-o output csv file (results.csv)");
    console.log("-t type {http/ping})");
    return;
}

if(!fs.existsSync(FileInput)) {
    console.error("ERROR: Input File Path: " + FileInput + " does not exists!!! ");
	process.exit(1);
}

if(argv.t == 'http' ) {
    typeIsHttp = true;
} else {
    typeIsHttp = false;
}

// 建立檔案讀取資料流
var inputStream = fs.createReadStream(FileInput);

// 將讀取資料流導入 Readline 進行處理 
var lineReader = readline.createInterface({ input: inputStream });
lineReader.on('line', function(line) {
    currentLine++;
    var data = JSON.parse(line);
    var ppp = data.content.freshdata;
    Object.keys(ppp).forEach(function(key) {
        totalObj++;
        processOutput();
        var csvEntity
        if(typeIsHttp) {
            var csvEntity = new HttpDataEntity(ppp[key], data.creationTime, data.queryTime);
        } else {
            var csvEntity = new PingDataEntity(ppp[key], data.creationTime, data.queryTime);
        }
        FileOutputStream.write(csvEntity);
    });
}).on('close', ()=>{
    FileOutputStream.end();
});

var FileOutputStream = fast_csv.createWriteStream({headers: true}),
writableStream = fs.createWriteStream(FileOutput);
writableStream.on("finish", function(){
    processOutput();
    console.log("\nDONE!");
});
FileOutputStream.pipe(writableStream);

function processOutput(){
    var str = "LINE:"+currentLine+"\t, total objects:"+totalObj;
    if(process.stdout.clearLine != undefined) {
        process.stdout.clearLine();  // clear current text
        process.stdout.cursorTo(0);  // move cursor to beginning of line
        process.stdout.write(str);
    } else {
        console.log(str);
    }
}

//HTTP
// "\"144343\"": {
//     "linkname": "",
//     "link": "",
//     "name": "宝鸡市联通",
//     "areaname": "陕西宝鸡市联通",
//     "ip": "113.200.251.16",
//     "dns": "114.114.114.114",
//     "isp": "联通",
//     "view": "陕西",
//     "sid": "144343",
//     "SrcIP": {
//         "srcip": "58.144.139.29",
//         "ipfrom": "中国重庆联通"
//     },
//     "IP": "113.200.251.16",
//     "HttpCode": "200",
//     "TotalTime": "0.24s",
//     "NsLookup": "0.019s",
//     "ConnectTime": "0.028s",
//     "downtime": "0s",
//     "FileSize": "188B",
//     "realsize": "188B",
//     "speed": "1.203MB/s",
//     "HpptHead": "HTTP/1.1 200 OK\r<br>Date: Thu, 03 May 2018 09:01:20 GMT\r<br>Content-Type: text/html\r<br>Content-Length: 188\r<br>Connection: close\r<br>Server: openresty/1.7.2.1\r<br>Last-Modified: Thu, 01 Mar 2018 09:33:08 GMT\r<br>ETag: \"5a97c8d4-bc\"\r<br>Accept-Ranges: bytes\r<br>X-Ser: BC19_dx-lt-yd-zhejiang-huzhou-2-cache-5, BC26_lt-chongqing-chongqing-3-cache-6\r<br>\r<br>"
// },
class HttpDataEntity {
    constructor(Raw,cTime,qTime) {
        this.cTime = cTime;
        this.qTime = qTime;
        // this.linkname = Raw.linkname;
        // this.link = Raw.link;
        this.name = Raw.name;
        // this.areaname = Raw.areaname;
        // this.ip = Raw.ip;
        // this.dns = Raw.dns;
        this.isp = Raw.isp;
        this.view = Raw.view;
        // this.sid = Raw.sid;
        // this.srcip = Raw.SrcIP.srcip;
        // this.ipfrom = Raw.SrcIP.ipfrom;
        // this.IP = Raw.IP;
        this.HttpCode = Raw.HttpCode;
        this.TotalTime_s = ms(Raw.TotalTime);
        this.NsLookup_s = ms(Raw.NsLookup);
        this.ConnectTime_s = ms(Raw.ConnectTime);
        this.downtime_s = ms(Raw.downtime);
        // this.FileSize = Raw.FileSize;
        this.realsize = Raw.realsize;
        this.speed = Raw.speed;
        // this.HpptHead = Raw.HpptHead;
    }
}

//PING
// "\"52440\"": {
//     "linkname": "",
//     "link": "",
//     "name": "鄂州市电信",
//     "areaname": "湖北鄂州市电信",
//     "ip": "221.234.40.17",
//     "dns": "59.175.181.230",
//     "isp": "电信",
//     "view": "湖北",
//     "SrcIP": {
//         "srcip": "116.207.130.98",
//         "ipfrom": "中国湖北宜昌电信"
//     },
//     "sid": "52440",
//     "DataSize": "64B",
//     "PacketsSent": 10,
//     "PacketsRecv": 10,
//     "PacketsLost": 0,
//     "Avg": "7.622ms",
//     "Max": "7.774ms",
//     "Min": "7.576ms",
//     "PingStr": "PING snsdcres.yy845.com<br>PING snsdcres.yy845.com (116.207.130.98) with 64 bytes of data:<br>Reply from 116.207.130.98: bytes=64 time=8ms TTL=56<br>Reply from 116.207.130.98: bytes=64 time=8ms TTL=56<br>Reply from 116.207.130.98: bytes=64 time=8ms TTL=56<br>Reply from 116.207.130.98: bytes=64 time=8ms TTL=56<br>Reply from 116.207.130.98: bytes=64 time=8ms TTL=56<br>Reply from 116.207.130.98: bytes=64 time=8ms TTL=56<br>Reply from 116.207.130.98: bytes=64 time=8ms TTL=56<br>Reply from 116.207.130.98: bytes=64 time=8ms TTL=56<br>Reply from 116.207.130.98: bytes=64 time=8ms TTL=56<br>Reply from 116.207.130.98: bytes=64 time=8ms TTL=56<br><br>Ping statistics for 116.207.130.98:<br>Packets: Sent = 10, Received = 10, Lost = 0 (0% loss),<br>Approximate round trip times in milli-seconds:<br>Minimum = 8ms, Maximum = 8ms, Average = 8ms"
// },
class PingDataEntity {
    constructor(Raw,cTime,qTime) {
        this.cTime = cTime;
        this.qTime = qTime;
        // this.linkname = Raw.linkname;
        // this.link = Raw.link;
        this.name = Raw.name;
        // this.areaname = Raw.areaname;
        // this.ip = Raw.ip;
        // this.dns = Raw.dns;
        this.isp = Raw.isp;
        this.view = Raw.view;
        // this.sid = Raw.sid;
        // this.srcip = Raw.SrcIP.srcip;
        // this.ipfrom = Raw.SrcIP.ipfrom;
        // this.sid = Raw.sid;
        // this.DataSize = Raw.DataSize;
        this.PacketsSent = Raw.PacketsSent;
        this.PacketsRecv = Raw.PacketsRecv;
        this.PacketsLost = Raw.PacketsLost;
        this.Avg_ms = ms(Raw.Avg);
        this.Max_ms = ms(Raw.Max);
        this.Min_ms = ms(Raw.Min);
        // this.PingStr = Raw.PingStr;
    }
}