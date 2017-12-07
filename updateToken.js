var request = require("request");
var cp = require('child_process');
var assert = require('assert');

var options = { method: 'POST',
	url: 'https://api.droibaas.com/rest/users/v2/login',
	headers: 
	{ 'postman-token': '79b0e8d9-b442-16cb-ae63-51dea755504f',
	'cache-control': 'no-cache',
	'x-droi-api-key': 'nz-pvPNyKKMCufYgefFzas5LPhIZuKttV93lCxp2BBOaI8TK3_4ayOukxjYU56s2',
	'x-droi-appid': '85kvmbzhq2gdJIXW5iNhM1CLD5CJ1Ua1lQC0hBwA' },
	body: '{\n    "UserId": "restful_api_test",\n    "Password": "464c7a646393b68d1a42076c010b5aae418d8d322f233ca0b8cd8e2c6bcd9676",\n    "Type": "general"\n}' };

request(options, function (error, response, body) {
	if (error) throw new Error(error);
	var obj = JSON.parse(body);
	try {
		if (obj.Result.Token === null) throw new Error('body.Result.Token === null');
		cp.execSync("sed -i '/X-Droi-Session-Token:/ c\\            X-Droi-Session-Token: "+obj.Result.Token+"' ./apiary.apib", {stdio: 'inherit'})
	} catch (error) {
		throw error;
	}
});

