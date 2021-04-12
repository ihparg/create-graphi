#!/bin/sh

cd packages
for dir in `ls .`
do
  echo $dir
  cd $dir
  yarn
  cd ..
done
