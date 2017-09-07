//	node ./extract_au_by_topcites.ipip.js ~/opt/apm/20170830110717.AUWindow.developer_apm.csv
//	node ./extract_au_by_topcites.ipip.js ~/opt/apm/20170830110717.AUWindow.developer_apm.csv | sort -t, --key=4 -n -r

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

var count = new Array();

if(!fs.existsSync(csvFilePath)) {
    console.error("ERROR: CSV File Path: " + csvFilePath + " does not exists!!! ");
	process.exit(1);
}

fast_csv.fromPath(csvFilePath,{"delimiter":","}).on("data", function(data){
	var aucount = data[0]
	var carrier = data[2];
	var city = data[4];
	var isp = data[5];
	var network = data[8];

	if(network == 1) {
		network = 'wifi';
		carrier = isp;
	} else if(network == 2||network == 3||network == 4){
		network = 'cell';
	} else {
		return;
	}

    if (config.Top101Cites.indexOf(city) > -1) {
	    if(count[city] == null) {
	    	//console.log("count[city] === null, "+city);
	    	count[city] = new Array();
	    }
	    if(count[city][network] == null) {
	    	//console.log("count["+city+"]["+network+"] === null, ");
	    	count[city][network] = new Array();
	    }
	    if(count[city][network][carrier] == null) {
	    	//console.log("count["+city+"]["+network+"]["+carrier+"] === null, ");
	    	count[city][network][carrier] = new Array();
	    	count[city][network][carrier] = 0;
	    }
		count[city][network][carrier]= Number(count[city][network][carrier]) + Number(aucount);
		//console.log("count[city][network][carrier]:"+count[city][network][carrier]);
	} else {
	    //Not in the array
	}
})
.on("end", function(){
	config.Top101Cites.forEach(function(city){
		for (var network in count[city]){
			count[city][network].sort(function (a, b) {
				return a[1]>b[1]? 1:a[1]<b[1]?-1:0;
			});
		    for (var carrier in count[city][network]){
		    	console.log(city+","+network+","+carrier+","+count[city][network][carrier]);
		    }
		}
	});
});
