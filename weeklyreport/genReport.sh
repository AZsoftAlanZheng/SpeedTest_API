#!/bin/sh

rm ./source.md ./source.html ./source.pdf
node index.js > source.md; node md2html.js ./source.md >./source.html;node html2pdf.js ./source.html ./source.pdf;
