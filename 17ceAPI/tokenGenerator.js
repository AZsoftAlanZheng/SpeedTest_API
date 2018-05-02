//Usage: node js [-u user name] [-p password] {-t timestamp}
//-u user name
//-p password
//-t timestamp
'use strict';

var MD5 = require('md5');
var BASE64 = require('base-64');

var input = '12345';
var encodedData = BASE64.encode(input);
console.log(encodedData);
// → 'MTIzNDU='

var decodedData = BASE64.decode(encodedData);
console.log(decodedData);

console.log(MD5('message'));