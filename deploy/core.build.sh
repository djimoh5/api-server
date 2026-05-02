
version="${1:-dev}"
if [ "$1" = '--no-install' ] || [ "$1" = '--skip-install' ]
then
    echo "Missing Version Name"
    exit 1
else
    echo "Version $version"
fi

if [ "$2" = '--no-install' ] || [ "$2" = '--skip-install' ]
then
    echo "Skip install"
    cd ../
else
    cd ../
    sh ./npm-install.sh
fi

#update version numbers
cd deploy
skipFlag="${3:-noSkip}"
sh ./version.build.sh build-versions/build-version-$version.txt core $skipFlag
cd ../

echo "Transpiling started..."
tsc -p server
echo "Transpiling complete"

cp --parents server/package.json build
cp --parents config/secure.config.json build
cp --parents config/app_secret_private.pem build
cp --parents config/app_secret_public.pem build
cp --parents lib/*.js build

if [ "$2" = '--no-install' ]
then
    echo "No install"
else
    cp npm-install.sh build
    cd build
    sh ./npm-install.sh --production

    cd ../
fi

cd build