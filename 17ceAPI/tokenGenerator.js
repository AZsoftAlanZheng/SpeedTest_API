//Usage: node js [-u user name] [-p password] {-t timestamp}
//-u user name
//-p password
//-t timestamp
//ex: node ./tokenGenerator.js -u 'test@17ce.com' -p '123456' -t '1512459843' -> token:f146229a1556b9b8bbd6b7cd662bc522
'use strict';

var MD5 = require('md5');
var BASE64 = require('base-64');

//BASE64
// var input = '12345';
// var encodedData = BASE64.encode(input);
// console.log(encodedData);
// // → 'MTIzNDU='

// var decodedData = BASE64.decode(encodedData);
// console.log(decodedData);

//MD5
// console.log(MD5('message'));

//TimeStamp (UTC)
//Date.now() / 1000 | 0
//+08:00?
//Date.now() / 1000 + 28800 //28800 = 8*60*60 

module.exports={
    //user: string
    //pw:   string
    //ts:   string, if null, ts=now()
    //return string
    token:function(user, pw, ts) {
        if(typeof(user) !== 'string') throw new Error("typeof(user) !== 'string'");
	    if(typeof(pw) !== 'string') throw new Error("typeof(pw) !== 'string'");
        if(ts) {
            if(typeof(ts) !== 'string') throw new Error("typeof(ts) !== 'string'");
            return MD5(BASE64.encode(MD5(pw).substr(4,19).concat(user).concat(ts)));
        } else {
           return MD5(BASE64.encode(MD5(pw).substr(4,19).concat(user).concat(this.getTS())));
        }
    },
    getTS: function() {
        return (Date.now() / 1000 | 0).toString();
    }
}
////////////
var argv = require('minimist')(process.argv.slice(2));

if (require.main === module) {
    if(argv.h || process.argv[5] == null  ) {
        console.log("help:");
        console.log("Usage: node js [-u user name] [-p password] {-t timestamp}");
        console.log("-u user name");
        console.log("-p password");
        console.log("-t timestamp");
        return;
    }

    const userName = argv.u;
    const passWord = argv.p.toString();
    const timeStamp = (argv.t ? argv.t : Date.now() / 1000 | 0).toString();//Date.now(), UTC time
    console.log("userName="+userName);
    console.log("passWord="+passWord);
    console.log("timeStamp="+timeStamp);
    var ret = MD5(BASE64.encode(MD5(passWord).substr(4,19).concat(userName).concat(timeStamp)));
    console.log(ret);
} else {
    console.log('required as a module');
}