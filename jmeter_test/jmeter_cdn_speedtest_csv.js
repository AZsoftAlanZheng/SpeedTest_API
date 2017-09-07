//Usage: node js {csv_file_path} {optional:carrier_name}
//ex:
//	node ./jmeter_cdn_speedtest_csv.js /home/alan/opt/backup/git/SpeedTest_API/jmeter_test/20170814/TestPlanSpeedTestAPI_Log.4G.txt
//	node ./jmeter_cdn_speedtest_csv.js /home/alan/opt/backup/git/SpeedTest_API/jmeter_test/20170814/TestPlanSpeedTestAPI_Log.4G.txt 中国移动

var fs = require('fs');
var fast_csv = require('fast-csv');
var request = require('request');
var config = require('../Config.js');

var csvFilePath = process.argv[2];
var filterCarrierName = process.argv[3];
var startTime;
var printStartTime = true;
var finishedTask = new Array();
var createdTask = new Array();
var queryTask = new Array();

function final() {
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

				if(filterCarrierName && filterCarrierName != ret.oCarrierName) {
					return series(queryTask.shift());
				} else {
					console.log("null,"+json.Result.TaskID+","+ret.oCountry_CityName+","+ret.oCarrierName+","+ret.oNetworkName);
					return series(queryTask.shift());
				}
			}
	});
  } else {
	return final();
  }
}

function exportRestriction(obj) {
	var oCountry_CityName;
	var oCarrierName;
	var oNetworkName;

	if(obj) {
		if(obj.hasOwnProperty("Restriction")) {
			if(obj.Restriction.hasOwnProperty("Country_City")) {
				//oCountry_CityName = Country_City[obj.Restriction.Country_City];
				oCountry_CityName = config.Country_City[obj.Restriction.Country_City];
			}
			if(obj.Restriction.hasOwnProperty("Carrier")) {
				oCarrierName = config.Carrier[obj.Restriction.Carrier];
			}
			if(obj.Restriction.hasOwnProperty("Network")) {
				oNetworkName = config.Network[obj.Restriction.Network];
			}
		}
	}
	return {oCountry_CityName:oCountry_CityName, oCarrierName:oCarrierName, oNetworkName:oNetworkName};
}

if(!fs.existsSync(csvFilePath)) {
    console.error("ERROR: CSV File Path: " + csvFilePath + " does not exists!!! ");
	process.exit(1);
}
if(filterCarrierName && Carrier.indexOf(filterCarrierName) < 0) {
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
		startTime = data[0];
	} else if(data.length >= 3 && data[1] != "Create tasks") {
		if(createdTask.length < 1) {
			console.error("createdTask.length:"+createdTask.length+", < 1");
			process.exit(1);
		}
		if(startTime === undefined || startTime === null) {
			console.error("startTime === undefined || null");
			process.exit(1);
		}
		if(printStartTime) {
			console.log(startTime+",START");
			printStartTime = false;
		}

		var json = JSON.parse(data[3]);	
		finishedTask.push(data[2]);

		var ret = exportRestriction(json);

		if(filterCarrierName && filterCarrierName != ret.oCarrierName) {
			return;
		}

		console.log(data[0]+","+data[2]+","+ret.oCountry_CityName+","+ret.oCarrierName+","+ret.oNetworkName)
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
    //tempArray.sort();
    //console.log(tempArray);

//    fast_csv.writeToPath("outputfile.csv", tempArray)
//   .on("finish", function(){
//      console.log("END");
//   });

});
