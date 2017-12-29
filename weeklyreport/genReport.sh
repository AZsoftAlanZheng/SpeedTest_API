#!/bin/sh

BASEDIR=$(dirname "$0")
[ -e $BASEDIR/source.md ] && rm $BASEDIR/source.md
[ -e $BASEDIR/source.html ] && rm $BASEDIR/source.html
[ -e $BASEDIR/source.pdf ] && rm $BASEDIR/source.pdf

node $BASEDIR/index.js > $BASEDIR/source.md
OUT=$?
if [ $OUT -ne 0 ];then
   echo "node $BASEDIR/index.js > $BASEDIR/source.md failed"
   return 111
fi

node $BASEDIR/md2html.js $BASEDIR/source.md > $BASEDIR/source.html
OUT=$?
if [ $OUT -ne 0 ];then
   echo "node $BASEDIR/md2html.js $BASEDIR/source.md > $BASEDIR/source.html failed"
   return 112
fi

node $BASEDIR/html2pdf.js $BASEDIR/source.html $BASEDIR/source.pdf
OUT=$?
if [ $OUT -ne 0 ];then
   echo "node $BASEDIR/html2pdf.js $BASEDIR/source.html $BASEDIR/source.pdf failed"
   return 113
fi

echo "done, output file is $BASEDIR/source.pdf"