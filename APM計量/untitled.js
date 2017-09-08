var fast_csv = require('fast-csv');
var config = require('../Config.js');

fast_csv.fromPath("./APM計量 - Wi-Fi_All.csv",{"delimiter":","}).on("data", function(data){
	var output = data[0];
	for(var i = 1; i < data.length; i++) {
		output = output + "," + data[i];
	}
	var index = config.Country_City.indexOf(data[2]);
	if (index > -1) {
		output = output + "," + index;
	} else {
		console.error("(Country_City) no index of "+data[2]);
		process.exit(1);
	}

	var index = config.Top101Cites.indexOf(data[2]);
	if (index > -1) {
		output = output+",Y";
	}

	console.log(output);
})
.on("end", function(){
});	