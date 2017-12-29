#!/usr/bin/env node
//usage: node md2html.js ./source.md > source.html

var showdown  = require('showdown');
var fs = require('fs');
var util = require('util');
var path = require("path");

converter = new showdown.Converter();
converter.setOption('tables', true);
var tmpl_f = path.join(process.cwd(), 'tmpl.html');

fs.readFile(tmpl_f, 'utf8', function (err, tmpl) {
    if (err) {
        throw err; 
    } else {
		var md  = fs.readFileSync(process.argv[2],'utf8');
        console.log(util.format(tmpl,converter.makeHtml(md)));
    }
});