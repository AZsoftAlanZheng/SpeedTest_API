var REQUEST = require('request');

//openapi
loginHeaders = {'X-Droi-Api-Key':'nz-pvPNyKKMCufYgefFzas5LPhIZuKttV93lCxp2BBOaI8TK3_4ayOukxjYU56s2'}
commandheaders = {
	'X-Droi-AppID':'85kvmbzhq2gdJIXW5iNhM1CLD5CJ1Ua1lQC0hBwA',
	'X-Droi-Api-Key':'yKPGxDnX0TDbKyEq-Ucu5tMbycFfl_WoaNsaEznknKFKUsx6e9XjNtL5m0zKv8nJ',
	'Cache-Control':'no-cache'
}

//token:string
//conditions:string
//tableName:string, [CityCategory, FareCategory, Accounting]
//callback:function(error, data)
function getData(token, conditions, tableName, callback) {
	if(typeof(token) !== 'string') callback(new Error("typeof(token) !== 'string'"));
	if(typeof(tableName) !== 'string') callback(new Error("typeof(tableName) !== 'string'"));
	var options = {
		method: 'GET',
		url: 'https://api.droibaas.com/rest/objects/v2/'+tableName+'?limit=1000',
		encoding: null,
		headers: Object.assign({}, commandheaders)
	};
	options.headers['X-Droi-Session-Token'] = token;
	if(conditions) {
		if(typeof(conditions) !== 'string') callback(new Error("typeof(conditions) !== 'string'"));
		else options.url = options.url+'&'+conditions;
	}
	REQUEST(options, function(error, response, body){
		var data;
		if(!error) {
			data = JSON.parse(body);
			if(data.Code == undefined || data.Code != 0) {
				error = new Error("ERROR: data.Code="+data.Code);
			} else if(data.Count == undefined) {
				error = new Error("ERROR: data.Count="+data.Count);
			} else if(data.Result == undefined) {
				error = new Error("ERROR: data.Result="+data.Result);
			} else if(data.Count != data.Result.length) {
				error = new Error("ERROR: data.Count != data.Result.length");
			} else if(data.Result.length != 0 && data.Result[data.Result.length-1]._Id == undefined) {
				error = new Error("ERROR: data.Result.length != 0 && data.Result[data.Result.length-1]._Id == undefined");
			} else {
			}
		}
		callback(error,data);
	}); 
}

module.exports={

	CONFIG_VER: 2,

	//user:string
	//password:string
	//callback:function(error,token)
	login: function(user, password, callback) {
		var options = {
	        url: 'https://api.droibaas.com/rest/users/v2/login',
	        method: 'POST',
	        encoding: null,
			headers: commandheaders,
			body: JSON.stringify({
				"UserId": user,
				"Password": password.toString(),
				"Type": "general"
			})
		};

		//add headers for login
		for (var key in loginHeaders) {
			options.headers[key] = loginHeaders[key];
		}
		
		REQUEST(options, function(error, response, body){
			var token;
			if(!error) {
				var data = JSON.parse(body);
				if(data.Code == undefined || data.Code != 0) {
					error = new Error("ERROR: data.Code="+data.Code);
				} else if(data.Result == undefined) {
					error = new Error("ERROR: data.Result="+data.Result);
				} else if(data.Result.Token == undefined) {
					error = new Error("ERROR: data.Token="+data.Result.Token);
				} else {
					token = data.Result.Token;
				}
			}
			callback(error,token);
		}); 
	},

	//token: string
	//callback: function(error,citesObject)
	loadCites: function(token, callback) {
		getData(token, null, 'CityCategory', function(error,data){
			var citesObject = {};
			if(!error) {
				//EX:{
				//     "Code": 0,
				//     "Count": 398,
				//     "Result": [
				//         {
				//             "Category": 1,
				//             "City": 1,
				//             "CityName": "\u4e0a\u6d77-\u4e0a\u6d77",
				//             "_ACL": {
				//                 "creator": "Master",
				//                 "pr": true,
				//                 "pw": true
				//             },
				//             "_ClassName": "CityCategory",
				//             "_CreationTime": "2017-10-12T03:23:45.394Z",
				//             "_Id": "59dee041bbef8c003f035506",
				//             "_ModifiedTime": "2017-10-13T11:14:31.750Z"
				//         },...
				//     ]
				// }
				citesObject['Category1'] = [];
				citesObject['Category2'] = [];
				citesObject['Category3'] = [];
				citesObject['city2category'] = {};
				data.Result.forEach(function(element, index, array){
					citesObject['city2category'][element.City] = element.Category;
					switch(element.Category) {
						case 1:
							citesObject['Category1'].push(element.CityName);
							break;
						case 2:
							citesObject['Category2'].push(element.CityName);
							break;
						case 3:
							citesObject['Category3'].push(element.CityName);
							break;
					}
				});
			}
			callback(error,citesObject);
		}); 
	},
	
	//token: string
	//callback: function(error,citesObject)
	loadFare: function(token, callback) {
		getData(token, null, 'FareCategory', function(error,data){
			var fareObject = {};
			if(!error) {
				//EX:{
				//     "Code": 0,
				//     "Count": 1,
				//     "Result": [
				//         {
				//             "111": 0.05,
				//             "112": 0.08,
				//             "113": 0.15,
				//             "121": 0.22,
				//             "122": 0.33,
				//             "123": 0.65,
				//             "211": 0.3,
				//             "212": 0.45,
				//             "213": 0.9,
				//             "221": 1.3,
				//             "222": 1.96,
				//             "223": 3.91,
				//             "311": 0.95,
				//             "312": 1.43,
				//             "313": 2.85,
				//             "321": 4.13,
				//             "322": 6.2,
				//             "323": 12.39,
				//             "UserName": "restful_api_test",
				//             "_ACL": {
				//                 "creator": "Master",
				//                 "pr": false,
				//                 "pw": false,
				//                 "ur": [
				//                     "1fba13c44144a530aab40ed4"
				//                 ]
				//             },
				//             "_ClassName": "FareCategory",
				//             "_CreationTime": "2017-10-13T08:10:38.263Z",
				//             "_Id": "59e074fec77234004c0569df",
				//             "_ModifiedTime": "2017-10-13T10:55:49.106Z"
				//         }
				//     ]
				// }
				fareObject = data.Result[0]
				var target = fareObject ;
				for (var k in target){
					if (target.hasOwnProperty(k)) {
						if (k.match(/^([0-9]{3})$/)) {
							fareObject[k] = target[k];
						}
					}
				}
			}
			callback(error,fareObject);
		}); 
	},

	//token: string
	//date: string, format(yy-mm-dd), 2017-02-29
	//latestID: string || null
	//callback: function(error, data, returnLatestID)
	loadMore: function(token, date, latestID, callback) {
		if(!date || typeof(date) !== 'string') callback(new Error("!date || typeof(date) !== 'string'"));
		var conditions;
		if(latestID != null) {
			conditions = 'where={"_Id":{"$gt":"'+latestID+'"},"Date":{"$gte":"'+date+'T00:00:00.000Z","$lte":"'+date+'T24:00:00.000Z"}}'
		} else if(date != null) {
			conditions = 'where={"Date":{"$gte":"'+date+'T00:00:00.000Z","$lte":"'+date+'T24:00:00.000Z"}}'
		}
		var returnLatestID = null;
		getData(token, conditions, 'Accounting', function(error,data){
			if(!error) {
				//EX:{
				//     "Code": 0,
				//     "Count": 4,
				//     "Result": [
				//         {
				//             "City": 1,
				//             "CityName": "\u4e0a\u6d77-\u4e0a\u6d77",
				//             "Date": "2017-10-02T08:06:10.661Z",
				//             "Description": "Finished",
				//             "DesignatedCount": 1,
				//             "Network": 1,
				//             "NetworkName": "Wifi",
				//             "RecievedCount": 5,
				//             "Size": 100,
				//             "Status": 2,
				//             "TaskID": "59d1f372560d4b0024005382",
				//             "Type": 129,
				//             "TypeName": "HTTPS",
				//             "_ACL": {
				//                 "creator": "Master",
				//                 "pr": false,
				//                 "pw": false,
				//                 "ur": [
				//                     "1fba13c44144a530aab40ed4"
				//                 ]
				//             },
				//             "_ClassName": "Accounting",
				//             "_CreationTime": "2017-10-03T06:55:19.846Z",
				//             "_Id": "59d334574b1e230024002bbd",
				//             "_ModifiedTime": "2017-10-03T06:55:19.846Z",
				//             "UserId": "1fba13c44144a530aab40ed4",
				//             "UserName": "restful_api_test"
				//         },...
				//     ]
				// }
				if(data.Result.length > 0)
					returnLatestID = data.Result[data.Result.length-1]._Id;
			}
			callback(error, data.Result, returnLatestID);
		});
	},

	//cites mapping
	Country_City:['上海-上海','云南','云南-临沧','云南-丽江','云南-保山','云南-大理白族自治州','云南-德宏傣族景颇族自治州','云南-怒江傈僳族自治州','云南-文山壮族苗族自治州','云南-昆明','云南-昭通','云南-普洱','云南-曲靖','云南-楚雄彝族自治州','云南-玉溪','云南-红河哈尼族彝族自治州','云南-西双版纳傣族自治州','云南-迪庆藏族自治州','内蒙古','内蒙古-乌兰察布','内蒙古-乌海','内蒙古-兴安盟','内蒙古-包头','内蒙古-呼伦贝尔','内蒙古-呼和浩特','内蒙古-巴彦淖尔','内蒙古-赤峰','内蒙古-通辽','内蒙古-鄂尔多斯','内蒙古-锡林郭勒盟','内蒙古-阿拉善盟','北京-北京','台湾','台湾-台中市','台湾-台北市','台湾-台南市','台湾-屏东县','台湾-彰化县','台湾-新北市','台湾-桃园市','台湾-苗栗县','台湾-高雄市','吉林','吉林-吉林市','吉林-四平','吉林-延边朝鲜族自治州','吉林-松原','吉林-白城','吉林-白山','吉林-辽源','吉林-通化','吉林-长春','四川','四川-乐山','四川-内江','四川-凉山彝族自治州','四川-南充','四川-宜宾','四川-巴中','四川-广元','四川-广安','四川-德阳','四川-成都','四川-攀枝花','四川-泸州','四川-甘孜藏族自治州','四川-眉山','四川-绵阳','四川-自贡','四川-资阳','四川-达州','四川-遂宁','四川-阿坝藏族羌族自治州','四川-雅安','天津-天津','宁夏','宁夏-中卫','宁夏-吴忠','宁夏-固原','宁夏-石嘴山','宁夏-银川','安徽','安徽-亳州','安徽-六安','安徽-合肥','安徽-安庆','安徽-宣城','安徽-宿州','安徽-池州','安徽-淮北','安徽-淮南','安徽-滁州','安徽-芜湖','安徽-蚌埠','安徽-铜陵','安徽-阜阳','安徽-马鞍山','安徽-黄山','山东','山东-东营','山东-临沂','山东-威海','山东-德州','山东-日照','山东-枣庄','山东-泰安','山东-济南','山东-济宁','山东-淄博','山东-滨州','山东-潍坊','山东-烟台','山东-聊城','山东-莱芜','山东-菏泽','山东-青岛','山西','山西-临汾','山西-吕梁','山西-大同','山西-太原','山西-忻州','山西-晋中','山西-晋城','山西-朔州','山西-运城','山西-长治','山西-阳泉','广东','广东-东莞','广东-中山','广东-云浮','广东-佛山','广东-广州','广东-惠州','广东-揭阳','广东-梅州','广东-汕头','广东-汕尾','广东-江门','广东-河源','广东-深圳','广东-清远','广东-湛江','广东-潮州','广东-珠海','广东-肇庆','广东-茂名','广东-阳江','广东-韶关','广西','广西-北海','广西-南宁','广西-崇左','广西-来宾','广西-柳州','广西-桂林','广西-梧州','广西-河池','广西-玉林','广西-百色','广西-贵港','广西-贺州','广西-钦州','广西-防城港','新疆','新疆-乌鲁木齐','新疆-伊犁哈萨克自治州','新疆-克孜勒苏柯尔克孜自治州','新疆-克拉玛依','新疆-博尔塔拉蒙古自治州','新疆-吐鲁番','新疆-和田地区','新疆-哈密','新疆-喀什地区','新疆-塔城地区','新疆-巴音郭楞蒙古自治州','新疆-昌吉回族自治州','新疆-石河子','新疆-阿克苏地区','新疆-阿勒泰地区','江苏','江苏-南京','江苏-南通','江苏-宿迁','江苏-常州','江苏-徐州','江苏-扬州','江苏-无锡','江苏-泰州','江苏-淮安','江苏-盐城','江苏-苏州','江苏-连云港','江苏-镇江','江西','江西-上饶','江西-九江','江西-南昌','江西-吉安','江西-宜春','江西-抚州','江西-新余','江西-景德镇','江西-萍乡','江西-赣州','江西-鹰潭','河北','河北-保定','河北-唐山','河北-廊坊','河北-张家口','河北-承德','河北-沧州','河北-石家庄','河北-秦皇岛','河北-衡水','河北-邢台','河北-邯郸','河南','河南-三门峡','河南-信阳','河南-南阳','河南-周口','河南-商丘','河南-安阳','河南-平顶山','河南-开封','河南-新乡','河南-洛阳','河南-济源','河南-漯河','河南-濮阳','河南-焦作','河南-许昌','河南-郑州','河南-驻马店','河南-鹤壁','浙江','浙江-丽水','浙江-台州','浙江-嘉兴','浙江-宁波','浙江-杭州','浙江-温州','浙江-湖州','浙江-绍兴','浙江-舟山','浙江-衢州','浙江-金华','海南','海南-万宁','海南-三亚','海南-东方','海南-临高县','海南-乐东黎族自治县','海南-五指山','海南-保亭黎族苗族自治县','海南-儋州','海南-定安县','海南-屯昌县','海南-文昌','海南-昌江黎族自治县','海南-海口','海南-澄迈县','海南-琼中黎族苗族自治县','海南-琼海','海南-白沙黎族自治县','海南-陵水黎族自治县','湖北','湖北-仙桃','湖北-十堰','湖北-咸宁','湖北-天门','湖北-孝感','湖北-宜昌','湖北-恩施土家族苗族自治州','湖北-武汉','湖北-潜江','湖北-神农架林区','湖北-荆州','湖北-荆门','湖北-襄阳','湖北-鄂州','湖北-随州','湖北-黄冈','湖北-黄石','湖南','湖南-娄底','湖南-岳阳','湖南-常德','湖南-张家界','湖南-怀化','湖南-株洲','湖南-永州','湖南-湘潭','湖南-湘西土家族苗族自治州','湖南-益阳','湖南-衡阳','湖南-邵阳','湖南-郴州','湖南-长沙','澳门','甘肃','甘肃-临夏回族自治州','甘肃-兰州','甘肃-嘉峪关','甘肃-天水','甘肃-定西','甘肃-平凉','甘肃-庆阳','甘肃-张掖','甘肃-武威','甘肃-甘南藏族自治州','甘肃-白银','甘肃-酒泉','甘肃-金昌','甘肃-陇南','福建','福建-三明','福建-南平','福建-厦门','福建-宁德','福建-泉州','福建-漳州','福建-福州','福建-莆田','福建-龙岩','西藏','西藏-山南','西藏-拉萨','西藏-日喀则','西藏-昌都','西藏-林芝','西藏-那曲地区','西藏-阿里地区','贵州','贵州-六盘水','贵州-安顺','贵州-毕节','贵州-贵阳','贵州-遵义','贵州-铜仁','贵州-黔东南苗族侗族自治州','贵州-黔南布依族苗族自治州','贵州-黔西南布依族苗族自治州','辽宁','辽宁-丹东','辽宁-大连','辽宁-抚顺','辽宁-朝阳','辽宁-本溪','辽宁-沈阳','辽宁-盘锦','辽宁-营口','辽宁-葫芦岛','辽宁-辽阳','辽宁-铁岭','辽宁-锦州','辽宁-阜新','辽宁-鞍山','重庆-重庆','陕西','陕西-咸阳','陕西-商洛','陕西-安康','陕西-宝鸡','陕西-延安','陕西-榆林','陕西-汉中','陕西-渭南','陕西-西安','陕西-铜川','青海','青海-果洛藏族自治州','青海-海东','青海-海北藏族自治州','青海-海南藏族自治州','青海-海西蒙古族藏族自治州','青海-玉树藏族自治州','青海-西宁','青海-黄南藏族自治州','香港','黑龙江','黑龙江-七台河','黑龙江-伊春','黑龙江-佳木斯','黑龙江-双鸭山','黑龙江-哈尔滨','黑龙江-大兴安岭地区','黑龙江-大庆','黑龙江-牡丹江','黑龙江-绥化','黑龙江-鸡西','黑龙江-鹤岗','黑龙江-黑河','黑龙江-齐齐哈'],
	Country_City_Code:[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,256,257,258,259,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,297,298,299,300,301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,323,324,325,326,327,328,329,330,331,332,333,334,335,336,337,338,339,340,341,342,343,344,345,346,347,348,349,350,351,352,353,354,355,356,357,358,359,360,361,362,363,364,365,366,367,368,369,370,371,372,373,374,375,376,377,378,379,380,381,382,383,384,385,386,387,388,389,390,391,392,393,394,395,396,397],

	Carrier:['中国电信','中国移动','中国联通'],
	Carrier_Code: [0,1,2],

	Network: ['Wifi','2G','3G','4G'],
	Network_Code: [1,2,3,4],

	Top101Cites : ['北京-北京','上海-上海','广东-广州','广东-深圳','天津-天津','江苏-南京','湖北-武汉','辽宁-沈阳','陕西-西安','四川-成都','重庆-重庆','浙江-杭州','山东-青岛','辽宁-大连','浙江-宁波','江苏-苏州','江苏-无锡','山东-济南','黑龙江-哈尔滨','吉林-长春','福建-厦门','广东-佛山','广东-东莞','河南-郑州','湖南-长沙','福建-福州','河北-石家庄','江西-南昌','新疆-乌鲁木齐','云南-昆明','山西-太原','甘肃-兰州','贵州-贵阳','安徽-合肥','广西-南宁','内蒙古-呼和浩特','山东-烟台','河北-唐山','浙江-温州','山东-淄博','福建-泉州','内蒙古-包头','河北-邯郸','江苏-徐州','山东-济宁','江苏-常州','江苏-南通','江西-赣州','宁夏-银川','青海-西宁','海南-海口','山东-潍坊','浙江-绍兴','浙江-台州','黑龙江-大庆','辽宁-鞍山','江西-九江','广东-中山','广东-珠海','广东-汕头','山东-泰安','吉林-吉林市','广西-柳州','山东-临沂','西藏-拉萨','河北-保定','河北-秦皇岛','河北-沧州','内蒙古-鄂尔多斯','山东-东营','山东-威海','江苏-扬州','河南-洛阳','山东-德州','山东-滨州','浙江-湖州','浙江-嘉兴','浙江-金华','江苏-泰州','江苏-镇江','江苏-盐城','广西-桂林','广东-惠州','广东-湛江','广东-江门','广东-茂名','湖南-株洲','湖南-岳阳','湖南-衡阳','陕西-宝鸡','陕西-咸阳','湖北-宜昌','湖北-襄阳','河南-开封','河南-许昌','河南-平顶山','江西-萍乡','江西-宜春','江西-上饶','江西-新余','江西-景德镇'],
}
