EX:

node ./jmeter_cdn_speedtest_csv.js ./TestPlanSpeedTestAPI_Log.4G.txt > temp; ./jobcsv_timedifference.sh diff temp

node ./jmeter_cdn_speedtest_csv.js ./TestPlanSpeedTestAPI_Log_20170811.txt 中国联通 > temp; ./jobcsv_timedifference.sh diff temp
