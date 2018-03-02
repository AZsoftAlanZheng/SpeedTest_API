//Usage: node js {-i inputfile} [-o outputfile] [-c statistic_outputfile] [-p]
//-i input json file
//-o output result file (CSV)
//-r input data from result file (CSV)
//-c output statistic file for report (CSV)
//-p post object to baas mongo
//Example:
//node js -i ./SpeedTest_dnion_demo/Task.json -o ./SpeedTest_dnion_demo/results.csv -c ./SpeedTest_dnion_demo/statistics.csv
//node js -r ./SpeedTest_dnion_demo/results.csv -c ./SpeedTest_dnion_demo/statistics.csv
//inputfile format:
//{"Type":128,"ts":1517988002,"Task":["5a7aa8d6063e41117600404d","5a7aa8d6063e41117600404e","5a7aa8d6063e41117600404f","5a7aa8d6063e411176004050","5a7aa8d6063e411176004051","5a7aa8d6063e411176004052","5a7aa8d6063e411176004053","5a7aa8d6063e411176004054","5a7aa8d6063e411176004055","5a7aa8d6063e411176004056","5a7aa8d6063e411176004057","5a7aa8d6063e411176004058","5a7aa8d6063e411176004059","5a7aa8d6063e41117600405a","5a7aa8d6063e41117600405b","5a7aa8d6063e41117600405c","5a7aa8d6063e41117600405d","5a7aa8d6063e41117600405e","5a7aa8d6063e41117600405f","5a7aa8d6063e411176004060","5a7aa8d6063e411176004061","5a7aa8d6063e411176004062","5a7aa8d6063e411176004063","5a7aa8d6063e411176004064","5a7aa8d6063e411176004065","5a7aa8d6063e411176004066","5a7aa8d6063e411176004067","5a7aa8d6063e411176004068","5a7aa8d6063e411176004069","5a7aa8d6063e41117600406a","5a7aa8d6063e41117600406b","5a7aa8d6063e41117600406c","5a7aa8d6063e41117600406d","5a7aa8d6063e41117600406e","5a7aa8d6063e41117600406f","5a7aa8d6063e411176004070","5a7aa8d6063e411176004071","5a7aa8d6063e411176004072","5a7aa8d6063e411176004073","5a7aa8d6063e411176004074","5a7aa8d6063e411176004075","5a7aa8d6063e411176004076","5a7aa8d6063e411176004077","5a7aa8d6063e411176004078","5a7aa8d6063e411176004079","5a7aa8d6063e41117600407a","5a7aa8d6063e41117600407b","5a7aa8d6063e41117600407c"]}
//{"Type":134,"ts":1517989201,"Task":["5a7aad85aa4b2809bb015442","5a7aad85aa4b2809bb015443","5a7aad85aa4b2809bb015444","5a7aad85aa4b2809bb015445","5a7aad85aa4b2809bb015446","5a7aad85aa4b2809bb015447","5a7aad85aa4b2809bb015448","5a7aad85aa4b2809bb015449","5a7aad85aa4b2809bb01544a","5a7aad85aa4b2809bb01544b","5a7aad85aa4b2809bb01544c","5a7aad85aa4b2809bb01544d","5a7aad85aa4b2809bb01544e","5a7aad85aa4b2809bb01544f","5a7aad85aa4b2809bb015450","5a7aad85aa4b2809bb015451","5a7aad85aa4b2809bb015452","5a7aad85aa4b2809bb015453"]}

'use strict';

var fs = require('fs');
var jsonfile = require('jsonfile')
var REQUEST = require('request');
var fast_csv = require('fast-csv');
var CONFIG = require('../Config.js');
var argv = require('minimist')(process.argv.slice(2));
var running = 0;
var MAX_RUNNING = 50;
console.dir(argv);

var FileERROR = '/home/alan/opt/backup/git/SpeedTest_API/SpeedTest_dnion_demo/ERROR_PostObjcect.json';
var FileInput = argv.i;
var FileOutput = argv.o;
var FileInputRsultsCSV = argv.r;
var FileStatisticOutput = argv.c;
var FileOutputStream = null;
var postObject = argv.p;
var queryTask = new Array();
var outputResult = {};
var statisticOutputArray = new Array();
var taskCompleted = {
    total:0,
    current:0,
    httpcurrent:0,
    retryTimes:0,
    error:0
};

if(argv.h || process.argv[2] == null  ) {
    console.log("help:");
    console.log("Usage: node js {-i inputfile} [-o outputfile] [-c CSV_outputfile] [-p]");
    console.log("-i input json file");
    console.log("-o output csv file");
    console.log("-r input data from result file (CSV) (results.csv)");
    console.log("-c output csv file for report (statistics.cs)");
    console.log("-p post object to baas mongo");
    console.log("Example:");
    console.log("node js -i ./SpeedTest_dnion_demo/Task.json -o ./SpeedTest_dnion_demo/results.csv -c ./SpeedTest_dnion_demo/statistics.csv");
    console.log("node js -r ./SpeedTest_dnion_demo/results.csv -c ./SpeedTest_dnion_demo/statistics.csv");
    return;
}

if((FileInput && FileInputRsultsCSV) || (!FileInput && !FileInputRsultsCSV)) {
    console.error('ERROR: should use "-r" or "-i"');
	process.exit(1);
}

if(FileInputRsultsCSV && (FileInput || FileOutput)) {
    console.error('ERROR: "-r" should not be used with "-i" or "-o"');
	process.exit(1);
}

if(FileInput && !fs.existsSync(FileInput)) {
    console.error("ERROR: Input File Path: " + FileInput + " does not exists!!! ");
	process.exit(1);
}

if(FileInputRsultsCSV && !fs.existsSync(FileInputRsultsCSV)) {
    console.error("ERROR: Input Results CSV File Path: " + FileInputRsultsCSV + " does not exists!!! ");
	process.exit(1);
}

if(FileOutput) {
    var FileOutputStream = fast_csv.createWriteStream({headers: true}),
    writableStream = fs.createWriteStream(FileOutput);
    writableStream.on("finish", function(){
        console.log("DONE!");
    });
    FileOutputStream.pipe(writableStream);
}

// function routine() {
//     console.log("routine: completed tasks:"+taskCompleted.current+"/"+taskCompleted.total+", completed http tasks:"+taskCompleted.httpcurrent+", retry:"+taskCompleted.retryTimes+", error:"+taskCompleted.error);
//     setTimeout(routine, 1000 * 10);
// }
// setTimeout(routine, 1000 * 60);

var ctx = {
    user:{
        name: 'dnion',
        pw: '250b402a5c95f64cf1cafde438b38a3c5ce03bc2003fcd8c917a97700fb52c3c',
        token: null
    }
}

function statistic(obj) {
    if(FileStatisticOutput) {
        if( outputResult[obj.Country_City] == null) {
            outputResult[obj.Country_City] = {}
        }
        if( outputResult[obj.Country_City][obj.Carrier] == null) {
            outputResult[obj.Country_City][obj.Carrier] = {}
        }
        if(outputResult[obj.Country_City][obj.Carrier].Connect_Sum == null) {
            outputResult[obj.Country_City][obj.Carrier].Connect_Sum = 0
        }
        if(outputResult[obj.Country_City][obj.Carrier].Connect_Count == null) {
            outputResult[obj.Country_City][obj.Carrier].Connect_Count = 0;
        }
        if(outputResult[obj.Country_City][obj.Carrier].RTT_Sum == null) {
            outputResult[obj.Country_City][obj.Carrier].RTT_Sum = 0
        }
        if(outputResult[obj.Country_City][obj.Carrier].RTT_Count == null) {
            outputResult[obj.Country_City][obj.Carrier].RTT_Count = 0;
        }
        outputResult[obj.Country_City][obj.Carrier].Connect_Sum += obj.Connect_Min;
        outputResult[obj.Country_City][obj.Carrier].Connect_Count++;
        outputResult[obj.Country_City][obj.Carrier].RTT_Sum += obj.RTT_Min;
        outputResult[obj.Country_City][obj.Carrier].RTT_Count++;
    }
}

function processOutput(){
    if(process.stdout.clearLine != undefined) {
        process.stdout.clearLine();  // clear current text
        process.stdout.cursorTo(0);  // move cursor to beginning of line
        process.stdout.write("completed tasks:"+taskCompleted.current+"/"+taskCompleted.total+", completed http tasks:"+taskCompleted.httpcurrent+", retry:"+taskCompleted.retryTimes+", error:"+taskCompleted.error);
    } else {
        console.log("completed tasks:"+taskCompleted.current+"/"+taskCompleted.total+", completed http tasks:"+taskCompleted.httpcurrent+", retry:"+taskCompleted.retryTimes+", error:"+taskCompleted.error);
    }
}

function final() {
    if(FileStatisticOutput) {
        for (var k in outputResult){
            if (outputResult.hasOwnProperty(k)) {
                var object = {};
                object['City'] = k
                for (var v in outputResult[k]){
                    if (outputResult[k].hasOwnProperty(v)) {
                        object[v+'_Connect_Avg'] = (outputResult[k][v].Connect_Sum/outputResult[k][v].Connect_Count).toFixed(2);
                        object[v+'_RTT_Avg'] = (outputResult[k][v].RTT_Sum/outputResult[k][v].RTT_Count).toFixed(2);
                    }
                }
                statisticOutputArray.push(object);
            }
        }
        fast_csv.writeToPath(FileStatisticOutput, statisticOutputArray, {headers: true})
        .on("finish", function(){
            console.log("END(FileStatisticOutput)");
        });
    } else {
        console.log("END");
    }
}

function series(element) {
	if(element) {
        CONFIG.getTaskResult(ctx.user.token, element.TaskID , function (error, options, response, data) {
            try {
                if (error) throw new Error(error);
                if(data.Code != 0) {
                    throw new Error(data);
                }
                var obj = {};
                obj.timestamp = element.ts;
                obj.TaskID = element.TaskID;
                obj.Type = data.Result.SpeedTest.Type;
                obj.Country_City = CONFIG.Country_City[CONFIG.Country_City_Code.indexOf(data.Result.SpeedTest.Restriction.Country_City)];
                obj.Carrier = CONFIG.Carrier[CONFIG.Carrier_Code.indexOf(data.Result.SpeedTest.Restriction.Carrier)];
                obj.Network = CONFIG.Network[CONFIG.Network_Code.indexOf(data.Result.SpeedTest.Restriction.Network)];

                //!!!!!!!!! HTTP only !!!!!!!!!!!
                if(obj.Type == "HTTP") {
                    //TODO: check Type of testing
                    if(data.Result.Status == 2 ) {
                        obj.DNS_Max = data.Result.Result.Time.DNS.Max;
                        obj.DNS_Min = data.Result.Result.Time.DNS.Min;
                        obj.DNS_Avg = data.Result.Result.Time.DNS.Avg;
                        obj.Connect_Max = data.Result.Result.Time.Connect.Max;
                        obj.Connect_Min = data.Result.Result.Time.Connect.Min;
                        obj.Connect_Avg = data.Result.Result.Time.Connect.Avg;
                        obj.RTT_Max = data.Result.Result.Time.RTT.Max;
                        obj.RTT_Min = data.Result.Result.Time.RTT.Min;
                        obj.RTT_Avg = data.Result.Result.Time.RTT.Avg;

                        statistic(obj);
                    } else {
                        obj.DNS_Max = 'X';
                        obj.DNS_Min = 'X';
                        obj.DNS_Avg = 'X';
                        obj.Connect_Max = 'X';
                        obj.Connect_Min = 'X';
                        obj.Connect_Avg = 'X';
                        obj.RTT_Max = 'X';
                        obj.RTT_Min = 'X';
                        obj.RTT_Avg = 'X';
                    }
                    if(FileOutput) {
                        FileOutputStream.write(obj);
                    }
                    taskCompleted.httpcurrent++;
                }
                taskCompleted.current++;
            } catch (error) {
                console.error('options');
                console.error(options);
                console.error("error:");
                console.error(error);
                if(response == null) {
                    console.error('retry');
                    taskCompleted.retryTimes++;
                    queryTask.push(element);
                    console.log();
                } else {
                    console.error("response:");
                    console.error(response);
                    taskCompleted.error++;
                    queryTask.push(element);
                    console.log();
                    //throw error;
                }
            } finally {
                //log
                processOutput();
                series(queryTask.shift());
            }
        });
	} else {
        running--;
        if(running == 0)
		    return final();
	}
}

if(FileInputRsultsCSV) {
    fast_csv.fromPath(FileInputRsultsCSV,{delimiter:",",headers : true})
    .on("data", function(obj){
        if(obj.Type == "HTTP" && obj.DNS_Max != 'X') {
            //for csv file only, convert string to number
            obj.Connect_Min = parseInt(obj.Connect_Min, 10);
            obj.RTT_Min = parseInt(obj.RTT_Min, 10);
            statistic(obj);
        }
    }).on("end", function(){
        final();
    });
} else {
    CONFIG.login(ctx.user.name, ctx.user.pw, function(error,token){
        if(error) {
            throw new Error(error);
        } else {
            ctx.user.token = token;
            var lineReader = require('readline').createInterface({
                input: fs.createReadStream(FileInput)
            }).on('close', function(){
                //https query
                running = MAX_RUNNING<queryTask.length? MAX_RUNNING:queryTask.length;
                for(var i=0; i< running;i++) {
                    series(queryTask.shift());
                }
            }).on('line', function (line) {
                var obj = JSON.parse(line);
                //bypass some types
                //if(obj.Type != 128)
                //     return;
                //console.dir(obj);
                if(FileOutput || FileStatisticOutput) {
                    //Query task
                    let ts = obj.ts;
                    obj.Task.forEach(function(element) {
                        queryTask.push({ts:ts,TaskID:element});
                    });
                    taskCompleted.total = queryTask.length;
                }
            
                //POST Object
                if(postObject) {
                    CONFIG.createObject('AH3FllQBAInOz8oy5pMZWOINSkYlpieLftuiysPr','LongTermTask_dnion',JSON.stringify(obj),function(error,data){
                        if(error) {
                            console.log(body);
                            jsonfile.writeFile(FileERROR, obj, {flag: 'a'}, function (err) {
                                console.log(body);
                                console.error(err)
                            })
                            throw error;
                        }
                    });
                }
            });
        }
    });
}