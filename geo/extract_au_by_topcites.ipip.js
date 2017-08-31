//	node node ./extract_au_by_topcites.ipip.js ~/opt/apm/20170830110717.AUWindow.developer_apm.csv
//	node node ./extract_au_by_topcites.ipip.js ~/opt/apm/20170830110717.AUWindow.developer_apm.csv | sort -t, --key=4 -n -r

var fs = require('fs');
var fast_csv = require('fast-csv');
var request = require('request');

var csvFilePath = process.argv[2];
var filterCarrierName = process.argv[3];
var startTime;
var printStartTime = true;
var finishedTask = new Array();
var createdTask = new Array();

var Country_City = ['北京-北京','上海-上海','广东-广州','广东-深圳','天津-天津','江苏-南京','湖北-武汉','辽宁-沈阳','陕西-西安','四川-成都','重庆-重庆','浙江-杭州','山东-青岛','辽宁-大连','浙江-宁波','江苏-苏州','江苏-无锡','山东-济南','黑龙江-哈尔滨','吉林-长春','福建-厦门','广东-佛山','广东-东莞','河南-郑州','湖南-长沙','福建-福州','河北-石家庄','江西-南昌','新疆-乌鲁木齐','云南-昆明','山西-太原','甘肃-兰州','贵州-贵阳','安徽-合肥','广西-南宁','内蒙古-呼和浩特','山东-烟台','河北-唐山','浙江-温州','山东-淄博','福建-泉州','内蒙古-包头','河北-邯郸','江苏-徐州','山东-济宁','江苏-常州','江苏-南通','江西-赣州','宁夏-银川','青海-西宁','海南-海口','山东-潍坊','浙江-绍兴','浙江-台州','黑龙江-大庆','辽宁-鞍山','江西-九江','广东-中山','广东-珠海','广东-汕头','山东-泰安','吉林-吉林市','广西-柳州','山东-临沂','西藏-拉萨','河北-保定','河北-秦皇岛','河北-沧州','内蒙古-鄂尔多斯','山东-东营','山东-威海','江苏-扬州','河南-洛阳','山东-德州','山东-滨州','浙江-湖州','浙江-嘉兴','浙江-金华','江苏-泰州','江苏-镇江','江苏-盐城','广西-桂林','广东-惠州','广东-湛江','广东-江门','广东-茂名','湖南-株洲','湖南-岳阳','湖南-衡阳','陕西-宝鸡','陕西-咸阳','湖北-宜昌','湖北-襄阳','河南-开封','河南-许昌','河南-平顶山','江西-萍乡','江西-宜春','江西-上饶','江西-新余','江西-景德镇'];
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

    if (Country_City.indexOf(city) > -1) {
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
	Country_City.forEach(function(city){
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
