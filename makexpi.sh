#!/bin/bash

set -e

ZIP_FILE=save-as-pdf.zip
XPI_FILE=save-as-pdf.xpi

rm -f *.zip *.xpi
find . -type f ! -path './.git*' ! -name '*~' ! -name '*.zip' ! -name '*.xpi' ! -name '*.sh' | zip $ZIP_FILE -@
unzip -t $ZIP_FILE
mv $ZIP_FILE $XPI_FILE