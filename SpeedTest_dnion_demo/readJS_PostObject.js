//Usage: node js {-i inputfile} [-p] [-o outputfile]
//-i input json file
//-o output csv file
//-p post object to baas mongo
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
console.dir(argv);

var FileERROR = '/home/alan/opt/backup/git/SpeedTest_API/SpeedTest_dnion_demo/ERROR_PostObjcect.json';
var FileInput = argv.i;
var FileOutput = argv.o;
var csvStream = null;
var postObject = argv.p;
if(!fs.existsSync(FileInput)) {
    console.error("ERROR: Input File Path: " + FileInput + " does not exists!!! ");
	process.exit(1);
}

if(FileOutput) {
    var csvStream = fast_csv.createWriteStream({headers: true}),
    writableStream = fs.createWriteStream(FileOutput);
    writableStream.on("finish", function(){
        console.log("DONE!");
    });
    csvStream.pipe(writableStream);
}

var ctx = {
    user:{
        name: 'dnion',
        pw: '250b402a5c95f64cf1cafde438b38a3c5ce03bc2003fcd8c917a97700fb52c3c',
        token: null
    }
}

CONFIG.login(ctx.user.name, ctx.user.pw, function(error,token){
    if(error) {
        throw new Error(error);
    } else {
        ctx.user.token = token;
        var lineReader = require('readline').createInterface({
            input: fs.createReadStream(FileInput)
        }).on('line', function (line) {
            var obj = JSON.parse(line);
            console.dir(obj);
        
            if(FileOutput) {
                //Query task
                let ts = obj.ts;
                obj.Task.forEach(function(element) {
                    var options = {
                        method: 'GET',
                        url: 'https://api.droibaas.com/api/v2/speedtest/v1/st/result',
                        qs: { TaskID: 'element' },
                        headers: { 
                            'cache-control': 'no-cache',
                            'x-droi-session-token': 'aad8597d910daf62',
                            'x-droi-api-key': 'nz-pvPNyKKMCufYgefFzas5LPhIZuKttV93lCxp2BBOaI8TK3_4ayOukxjYU56s2',
                            'x-droi-appid': ctx.user.token
                        } 
                    };
                    
                    REQUEST(options, function (error, response, body) {
                        if (error) throw new Error(error);
                        var data = JSON.parse(body)
                        var obj = {};
                        obj.Type = data.Result.SpeedTest.Type;
                        obj.Country_City = CONFIG.Country_City[CONFIG.Country_City_Code.indexOf(data.Result.SpeedTest.Type.Restriction.Country_City)];
                        obj.Carrier = CONFIG.Carrier[CONFIG.Carrier_Code.indexOf(data.Result.SpeedTest.Type.Restriction.Carrier)];
                        obj.Network = CONFIG.Network[CONFIG.Network_Code.indexOf(data.Result.SpeedTest.Type.Restriction.Network)];
                        obj.DNS_Max = data.Result.esult.Time.DNS.Max;
                        obj.DNS_Min = data.Result.esult.Time.DNS.Min;
                        obj.DNS_Avg = data.Result.esult.Time.DNS.Avg;
                        obj.Connect_Max = data.Result.esult.Time.Connect.Max;
                        obj.Connect_Min = data.Result.esult.Time.Connect.Min;
                        obj.Connect_Avg = data.Result.esult.Time.Connect.Avg;
                        obj.RTT_Max = data.Result.esult.Time.RTT.Max;
                        obj.RTT_Min = data.Result.esult.Time.RTT.Min;
                        obj.RTT_Avg = data.Result.esult.Time.RTT.Avg;
                        csvStream.write(obj);
                        console.log(body);
                    }); 
                });
            }
        
            //POST Object
            if(postObject) {
                var httpoptions = {
                    method: 'POST',
                    url: 'http://10.10.20.60:30110/objects/v2/LongTermTask_dnion',
                    headers: {
                        'cache-control': 'no-cache',
                        'x-droi-role': 'AH3FllQBAInOz8oy5pMZWOINSkYlpieLftuiysPr',
                        'x-droi-appid': '85kvmbzhq2gdJIXW5iNhM1CLD5CJ1Ua1lQC0hBwA' },
                    body: JSON.stringify(obj)
                };
            
                REQUEST(httpoptions, function (error, response, body) {
                    if (error) {
                        throw new Error(error)
                    } else {
                        var data = JSON.parse(body);
                        if(data.Code == undefined || data.Code != 0) {
                            error = new Error("ERROR: data.Code="+data.Code);
                        } else if(data.Result == undefined) {
                            error = new Error("ERROR: data.Result="+data.Result);
                        } else if(data.Result.Created == undefined) {
                            error = new Error("ERROR: data.Result.Created="+data.Result.Created);
                        } else if(data.Result._Id == undefined) {
                            error = new Error("ERROR: data.Result._Id="+data.Result._Id);
                        } else if(data.Result.UpdatedAt == undefined) {
                            error = new Error("ERROR: data.Result.UpdatedAt="+data.Result.UpdatedAt);
                        } else {
                        }
                        if(error) {
                            console.log(body);
                            jsonfile.writeFile(FileERROR, obj, {flag: 'a'}, function (err) {
                                console.log(body);
                                console.error(err)
                            })
                            throw error;
                        }
                    }
                });
            }
        });
    }
});