#sudo apt-get install Dateutils
#http://www.fresse.org/dateutils/
#cat job_4G.csv | grep 广东-广州| cut -k 
#dateutils.dconv -i "%d/%m/%y %T" "11/08/17 21:56:07" -f %s
#dateutils.ddiff -i "%d/%m/%y %T" "14/08/17 19:36:57" "14/08/17 19:38:00"
#
#CSV FORMAT:
#11/08/17 21:56:07,START
#11/08/17 21:58:56,598db86792a5d103470002a6,广西-南宁,中国电信,4G
#

top100cites=( "北京-北京" "上海-上海" "广东-广州" "广东-深圳" "天津-天津" "江苏-南京" "湖北-武汉" "辽宁-沈阳" "陕西-西安" "四川-成都" "重庆-重庆" "浙江-杭州" "山东-青岛" "辽宁-大连" "浙江-宁波" "江苏-苏州" "江苏-无锡" "山东-济南" "黑龙江-哈尔滨" "吉林-长春" "福建-厦门" "广东-佛山" "广东-东莞" "河南-郑州" "湖南-长沙" "福建-福州" "河北-石家庄" "江西-南昌" "新疆-乌鲁木齐" "云南-昆明" "山西-太原" "甘肃-兰州" "贵州-贵阳" "安徽-合肥" "广西-南宁" "内蒙古-呼和浩特" "山东-烟台" "河北-唐山" "浙江-温州" "山东-淄博" "福建-泉州" "内蒙古-包头" "河北-邯郸" "江苏-徐州" "山东-济宁" "江苏-常州" "江苏-南通" "江西-赣州" "宁夏-银川" "青海-西宁" "海南-海口" "山东-潍坊" "山东-淄博" "浙江-绍兴" "浙江-台州" "黑龙江-大庆" "辽宁-鞍山" "江西-九江" "广东-中山" "广东-珠海" "广东-汕头" "山东-泰安" "吉林-吉林市" "广西-柳州" "山东-临沂" "西藏-拉萨" "河北-保定" "河北-秦皇岛" "河北-沧州" "内蒙古-鄂尔多斯" "山东-东营" "山东-威海" "江苏-扬州" "河南-洛阳" "山东-德州" "山东-滨州" "浙江-湖州" "浙江-嘉兴" "浙江-金华" "江苏-泰州" "江苏-镇江" "江苏-盐城" "广西-桂林" "广东-惠州" "广东-湛江" "广东-江门" "广东-茂名" "湖南-株洲" "湖南-岳阳" "湖南-衡阳" "陕西-宝鸡" "陕西-咸阳" "湖北-宜昌" "湖北-襄阳" "河南-开封" "河南-许昌" "河南-平顶山" "江西-萍乡" "江西-宜春" "江西-上饶" "江西-新余" "江西-景德镇" )

function usage() {
  echo "$0 {diff|group} file"
}

if [ "$#" -lt  2 ]; then
  usage
  exit
fi

startTime=`head -n 1 $2|cut -f 1 -d ,`

for city in "${top100cites[@]}"
do
  #time=`cat ../20170811/job.中国联通.csv | grep $city| cut -f 1 -d ,`
  time=`cat $2 | grep $city| cut -f 1 -d ,`
  if [ -z "$time" ] ; then
  		echo $city",null"
	else
		if [ "$time" == "null" ] ; then
  			echo $city",null"
  		else
			#echo $time
			diff=`dateutils.ddiff -i "%d/%m/%y %T" "$startTime" "$time" -f "%Ss"`
			if [ "$1" == "diff" ]; then
				echo $city,$diff
			elif [[ "$1" == "group" ]]; then
				diff=`echo $diff | sed 's/s//g'`
				if [ "$diff" -lt 300 ] ; then
					echo $city,"<300"
				elif [ "$diff" -lt 900 ] ; then
					echo $city,"<900"
				elif [ "$diff" -lt 1200 ] ; then
					echo $city,"<1200"
				else
					echo $city,">1200"
				fi
			else
				usage
				exit
			fi
		fi
  fi

done