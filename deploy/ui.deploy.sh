#!/bin/bash
export NODE_OPTIONS=--max_old_space_size=4096

set -e
export NG_CLI_ANALYTICS="false"
if [ "$2" = "--no-build" ] || [ "$3" = "--no-build" ]
then
    echo "Skipping Build"
else
    sh ./ui.build.sh $1 $2
fi
cd ../

if [ "$2" = "static-build-number" ] || [ "$2" = "--no-build" ]
then
    ts-node jobs/deploy.app.ts --$1 --platform $3
else
    ts-node jobs/deploy.app.ts --$1 --platform $2
fi

cd ./ui

if [ $1 != 'release' ]
then
    rm -r dist
fi