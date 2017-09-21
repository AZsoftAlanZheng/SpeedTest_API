#sudo apt-get install Dateutils
#dateutils.dseq 2017-05-13 2017-09-21 -f %Y%m%d
#./DAU_trigger.sh 2017-05-26 2017-09-19
#
versions=( "0" "6" "7" "8" )

function usage() {
  echo "$0 {START,ex:2017-05-13 } {END,ex:2017-09-21}"
}

if [ "$#" -lt 2 ]; then
  usage
  exit
fi

range=( $(dateutils.dseq "$1" "$2" -f %Y%m%d) )

for date in "${range[@]}"
do
	for version in "${versions[@]}"
	do
		echo $date $version
		curl    -H 'X-Droi-AppID:85kvmbzhq2gdJIXW5iNhM1CLD5CJ1Ua1lQC0hBwA'   -H 'X-Droi-Api-Key:GUoFk7PHQUtFXYK73vQGuD33on6oH9AYCiZrRpwN5uaSfVRvx-tmn4i937KxCY-t'   -H 'Cache-Control:no-cache'   -H 'Content-Type:application/x-www-form-urlencoded'   -H 'x-droi-session-token:AH3FllQBAInOz8oy5pMZWOINSkYlpieLftuiysPr'   -X GET   "https://api.droibaas.com/api/v2/getDAUCount?Date=$date&Version=$version&Update=true"
		echo 
	done
done