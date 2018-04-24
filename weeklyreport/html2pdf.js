#!/usr/bin/env node
//usage: node html2pdf ./source.html ./source.pdf

var fs = require('fs')
var pdf = require('html-pdf')
var path = require('path')

var args = process.argv.slice(2)

if (args.length >= 2) {
  htmlpdf(args[0], args[1])
} else {
  help()
}

function help () {
  var help = [
    'Usage: html-pdf <source> <destination>',
    'e.g.: html-pdf source.html destination.pdf'
  ].join('\n')

  console.log(help)
}

function htmlpdf (source, destination) {
  var html = fs.readFileSync(source, 'utf8')
  var options = {
    base: 'file://' + path.resolve(source),
    format: 'A3',
    orientation: "landscape",
    timeout: 300000
  }
  pdf.create(html, options).toFile(destination, function (err, res) {
    if (err) throw err
  })
}