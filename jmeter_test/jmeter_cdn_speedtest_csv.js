//Usage: node js {csv_file_path} 
//	node ./jmeter_cdn_speedtest_csv.js /home/alan/opt/backup/git/SpeedTest_API/jmeter_test/20170814/TestPlanSpeedTestAPI_Log.4G.txt
//
// CSV example:
// 06/09/17 21:00:08!Create tasks!{"Code":0,"Result":{"Task":["59aff16e34da251b3d01e414","59aff16e34da251b3d01e415","59aff16e34da251b3d01e416","59aff16e34da251b3d01e417","59aff16e34da251b3d01e418","59aff16e34da251b3d01e419","59aff16e34da251b3d01e41a","59aff16e34da251b3d01e41b","59aff16e34da251b3d01e41c","59aff16e34da251b3d01e41d","59aff16e34da251b3d01e41e"]}}
// 06/09/17 21:00:41!finished!59aff16d5de88d22480300ca!{"Size":100,"MD5":"36a92cc94a9e0fa21f625f8bfb007adf","Type":"HTTP","URL":"http://c6mvmbzh-sand.droibaascdn.com/droi/c6mvmbzhyOLweq6q4Z3v11GX1Q0-22uRlQAA0Pse/866894446795558912/apm_100B.txt","Restriction":{"Country_City":304,"Carrier":0,"Network":3,"Client":1,"Timeout":60},"Headers":{"Key1":"Value1"}}!{"TaskID":"59aff16d5de88d22480300ca","Result":{"HttpStatus":{"200":3},"ClientStatus":{"0":3},"IP":"202.100.79.90","Time":{"DNS":{"Max":2,"Min":1,"Count":3,"Avg":1.3333333333333},"RTT":{"Max":444,"Min":175,"Count":3,"Avg":266.33333333333},"TTFB":{"Max":438,"Min":171,"Count":3,"Avg":262},"R":{"Max":-1,"Min":-1,"Count":0,"Avg":0},"Req":{"Max":-1,"Min":-1,"Count":0,"Avg":0},"Res":{"Max":6,"Min":3,"Count":3,"Avg":4.3333333333333},"Connect":{"Max":87,"Min":63,"Count":3,"Avg":75.333333333333}}},"SpeedTest":{"Size":100,"MD5":"36a92cc94a9e0fa21f625f8bfb007adf","Type":"HTTP","URL":"http://c6mvmbzh-sand.droibaascdn.com/droi/c6mvmbzhyOLweq6q4Z3v11GX1Q0-22uRlQAA0Pse/866894446795558912/apm_100B.txt","Restriction":{"Country_City":304,"Carrier":0,"Network":3,"Client":1,"Timeout":60},"Headers":{"Key1":"Value1"}},"Status":2,"Description":"Finished"}
//
//output example:
//06/09/17 21:01:10,START
//06/09/17 21:01:42,59aff1a75de88d28010121bd,云南,中国移动,4G
//null,59aff1abc4bd04001e00dc47,湖南-娄底,中国电信,4G

var fs = require('fs');
var fast_csv = require('fast-csv');
var request = require('request');
var moment = require('moment')
var config = require('../Config.js');

var csvFilePath = process.argv[2];
var filterCarrierName = process.argv[3];
var finishedTask = new Array();
var createdTask = new Array();
var queryTask = new Array();

var results = {};

function final() {
	var outputArray = [];
	var index;
	console.log(results.StartTime+",START");
	config.Country_City.forEach(function(city) {
		var object = {City:city};
		index = config.Country_City.indexOf(city);
		object['城市代碼']=index<0?"null":config.Country_City_Code[index];
		index = config.Top101Cites.indexOf(city)
		object['前101城市']=index<0?"N":"Y";
		config.Carrier.forEach(function(carrier) {
			config.Network.forEach(function(network) {
				var key = carrier+"-"+network;
				try {
					if(object[key]===null) {
						object[key]="null";
					} else {
						var startDate = moment(results.StartTime, 'DD-MM-YY HH:mm:ss')
						var endDate = moment(results[city][carrier][network].FinishTime, 'DD-MM-YY HH:mm:ss')
						var secondsDiff = endDate.diff(startDate, 'seconds')
						if(Number.isNaN(secondsDiff)) {
							object[key] = "null";
						} else {
							object[key] = endDate.diff(startDate, 'seconds')
						}
					}
				} catch (error) {
					object[key] = "X";
				}
			});
		});
		outputArray.push(object);
		// var ptr = results[element]['Wifi'];
		// console.log(ptr.FinishTime+","+ptr.TaskID+","+ptr.Restriction.oCountry_CityName+","+ptr.Restriction.oCarrierName+","+ptr.Restriction.oNetworkName);
	});
	fast_csv.writeToPath("outputfile.csv", outputArray, {headers: true})
	.on("finish", function(){
		console.log("END");
	});
}

function series(element) {
	if(element) {
		request({
		headers: {
			'X-Droi-AppID': '85kvmbzhq2gdJIXW5iNhM1CLD5CJ1Ua1lQC0hBwA',
			'X-Droi-Api-Key': 'nz-pvPNyKKMCufYgefFzas5LPhIZuKttV93lCxp2BBOaI8TK3_4ayOukxjYU56s2',
			'X-Droi-Session-Token': 'efe85d5ce1482a6f'
		},
		uri: 'https://api.droibaas.com/api/v2/speedtest/v1/st?TaskID='+element,
		method: 'GET'
		}, function (err, res, body) {
			if(err) {
				console.error(err);
			} else {
				var json = JSON.parse(body);

				if(!json || !json.hasOwnProperty("Result") || !json.Result.hasOwnProperty("SpeedTest") ) {
					console.error('ERROR: TaskID: '+element+', !json || !json.hasOwnProperty("Result") || !json.Result.hasOwnProperty("SpeedTest")');
					console.error(res.headers);
					process.exit(1);
				}

				var ret = exportRestriction(json.Result.SpeedTest);
				addTaskResult(results,null,element,ret);

				series(queryTask.shift());
			}
		});
	} else {
		return final();
	}
}

function addTaskResult(array,finishTime,taskid,restrictions) {
	if(array[restrictions.oCountry_CityName] === undefined || array[restrictions.oCountry_CityName] === null) {
		array[restrictions.oCountry_CityName] = {};
	}
	if(array[restrictions.oCountry_CityName][restrictions.oCarrierName] === undefined || array[restrictions.oCountry_CityName][restrictions.oCarrierName] === null) {
		array[restrictions.oCountry_CityName][restrictions.oCarrierName] = {};
	}
	array[restrictions.oCountry_CityName][restrictions.oCarrierName][restrictions.oNetworkName] = {FinishTime:finishTime,TaskID:taskid,Restriction:restrictions};
}

function exportRestriction(obj) {
	var oCountry_CityName, oCarrierName, oNetworkName, index;

	if(obj) {
		if(obj.hasOwnProperty("Restriction")) {
			if(obj.Restriction.hasOwnProperty("Country_City")) {
				index = config.Country_City_Code.indexOf(obj.Restriction.Country_City);
				if(index < 0) {
					console.error("config.Country_City_Code.indexOf("+obj.Restriction.Country_City+") < 0, ");
					process.exit(1);
				}
				oCountry_CityName = config.Country_City[index];
			}
			if(obj.Restriction.hasOwnProperty("Carrier")) {
				index = config.Carrier_Code.indexOf(obj.Restriction.Carrier);
				if(index < 0) {
					console.error("config.Carrier_Code.indexOf("+obj.Restriction.Carrier+") < 0, ");
					process.exit(1);
				}
				oCarrierName = config.Carrier[index];
			}
			if(obj.Restriction.hasOwnProperty("Network")) {
				index = config.Network_Code.indexOf(obj.Restriction.Network);
				if(index < 0) {
					console.error("config.Network_Code.indexOf("+obj.Restriction.Network+") < 0, ");
					process.exit(1);
				}
				oNetworkName = config.Network[index];
			}
		}
	}
	return {oCountry_CityName:oCountry_CityName, oCarrierName:oCarrierName, oNetworkName:oNetworkName};
}

if(!fs.existsSync(csvFilePath)) {
    console.error("ERROR: CSV File Path: " + csvFilePath + " does not exists!!! ");
	process.exit(1);
}
if(filterCarrierName && config.Carrier.indexOf(filterCarrierName) < 0) {
	console.error("ERROR: Carrier Name: " + filterCarrierName + " not in array!!! " + Carrier);
	process.exit(1);
}

fast_csv.fromPath(csvFilePath,{"delimiter":"!"}).on("data", function(data){
	if(data[1] == "Create tasks") {
		//console.log("Create tasks");
		var json = JSON.parse(data[2]);
		json.Result.Task.forEach(function(taskid){
			createdTask.push(taskid);
		})
		results.StartTime = data[0];
	} else if(data.length >= 3 && data[1] != "Create tasks") {
		if(createdTask.length < 1) {
			console.error("createdTask.length:"+createdTask.length+", < 1");
			process.exit(1);
		}
		if(results.StartTime === undefined || results.StartTime === null) {
			console.error("StartTime === undefined || null");
			process.exit(1);
		}

		var json = JSON.parse(data[3]);	
		finishedTask.push(data[2]);

		var ret = exportRestriction(json);

		if(filterCarrierName && filterCarrierName != ret.oCarrierName) {
			return;
		}

		addTaskResult(results,data[0],data[2],ret)
	}
})
  .on("end", function(){
  	createdTask.forEach(function(element) {
	    if (finishedTask.indexOf(element) > -1) {
		    //In the array!
		} else {
		    //Not in the array
		    queryTask.push(element);
		}
	});
	series(queryTask.shift());
});
