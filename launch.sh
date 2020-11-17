# !/bin/bash

#parse verbose arg
for i in "$@"
do
case $i in
    -v|--verbose)
    VERBOSE=true
    shift # past argument=value
    ;;
    *)
          # unknown option
    ;;
esac
done

# actually do stuff

echo Starting the H5P wrapper site launcher. Hold on one second...

if [ "$VERBOSE" = true ]
then
	npm install

	npm run copy-h5p-standalone

	echo Site successfully launched. Try connecting to http://localhost:9090

	PORT=9090 npm start
else
	npm install &> /dev/null

	npm run copy-h5p-standalone &> /dev/null

	echo Site successfully launched. Try connecting to http://localhost:9090

	PORT=9090 npm start &> /dev/null
fi

