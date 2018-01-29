var request = require("request");
var cp = require('child_process');
var assert = require('assert');
var CONFIG = require('./Config.js');

assert(process.platform === 'linux','Error: only support linux');

CONFIG.login('restful_api_test', '464c7a646393b68d1a42076c010b5aae418d8d322f233ca0b8cd8e2c6bcd9676', function(error,token){
    if(error) {
        throw new Error(error);
    } else {
        if (token === null) throw new Error('token === null');
		cp.execSync("sed -i '/X-Droi-Session-Token:/ c\\            X-Droi-Session-Token: "+token+"' ./apiary.apib", {stdio: 'inherit'});
		console.log('done');
    }
});
