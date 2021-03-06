#ex:
#./extract_au_by_topcites_maxmind.sh ~/opt/apm/20170823133210.AUWindow.developer_apm.csv 
#./extract_au_by_topcites_maxmind.sh ~/opt/apm/20170823133210.AUWindow.developer_apm.csv | sort -n -k 2 -r

top101cites_maxmind=( "北京市" "上海" "广东-广州" "广东-深圳市" "天津市" "江苏省-南京" "湖北省-武汉" "辽宁-沈阳" "陕西-西安" "四川省-成都" "重庆" "浙江省-杭州" "山东省-青岛市" "辽宁-大连" "浙江省-宁波" "江苏省-苏州" "江苏省-无锡" "山东省-济南" "黑龙江省-哈尔滨" "吉林-长春" "闽-厦门市" "广东-佛山市" "广东-东莞市" "河南-郑州" "湖南-长沙市" "闽-福州市" "广东-南昌" "新疆-乌鲁木齐" "云南-昆明" "山西-太原" "甘肃-兰州" "贵州-贵阳" "安徽-合肥" "广西壮族自治区-南宁" "内蒙古自治区-呼和浩特市" "山东省-烟台市" "浙江省-温州市" "山东省-淄博" "闽-泉州市" "内蒙古自治区-包头市" "河北省-邯郸市" "江苏省-徐州" "山东省-济宁市" "江苏省-常州市" "江苏省-南通" "江西-赣州" "宁夏回族自治区-银川" "青海省-西宁" "海南-海口市" "浙江省-绍兴市" "黑龙江省-大庆" "辽宁-鞍山市" "江西-九江市" "广东-中山" "广东-珠海市" "吉林-吉林市" "广西壮族自治区-柳州" "西藏自治区-拉萨" "河北省-保定市" "河北省-秦皇岛" "河北省-沧州市" "内蒙古自治区-鄂尔多斯市" "山东省-东营市" "山东省-威海" "江苏省-扬州市" "河南-洛阳市" "山东省-德州市" "山东省-滨州市" "浙江省-嘉兴" "浙江省-金华" "江苏省-泰州市" "江苏省-镇江" "江苏省-盐城" "广西壮族自治区-桂林市" "广东-惠州市" "广东-湛江市" "广东-江门市" "广东-茂名" "湖南-株洲" "湖南-衡阳市" "陕西-宝鸡市" "陕西-咸阳" "湖北省-宜昌市" "河南-开封市" "河南-平顶山市" "江西-萍乡" "江西-上饶" "江西-景德镇市" )
top101cites_ipip=( "北京-北京" "上海-上海" "广东-广州" "广东-深圳" "天津-天津" "江苏-南京" "湖北-武汉" "辽宁-沈阳" "陕西-西安" "四川-成都" "重庆-重庆" "浙江-杭州" "山东-青岛" "辽宁-大连" "浙江-宁波" "江苏-苏州" "江苏-无锡" "山东-济南" "黑龙江-哈尔滨" "吉林-长春" "福建-厦门" "广东-佛山" "广东-东莞" "河南-郑州" "湖南-长沙" "福建-福州" "河北-石家庄" "江西-南昌" "新疆-乌鲁木齐" "云南-昆明" "山西-太原" "甘肃-兰州" "贵州-贵阳" "安徽-合肥" "广西-南宁" "内蒙古-呼和浩特" "山东-烟台" "河北-唐山" "浙江-温州" "山东-淄博" "福建-泉州" "内蒙古-包头" "河北-邯郸" "江苏-徐州" "山东-济宁" "江苏-常州" "江苏-南通" "江西-赣州" "宁夏-银川" "青海-西宁" "海南-海口" "山东-潍坊" "浙江-绍兴" "浙江-台州" "黑龙江-大庆" "辽宁-鞍山" "江西-九江" "广东-中山" "广东-珠海" "广东-汕头" "山东-泰安" "吉林-吉林市" "广西-柳州" "山东-临沂" "西藏-拉萨" "河北-保定" "河北-秦皇岛" "河北-沧州" "内蒙古-鄂尔多斯" "山东-东营" "山东-威海" "江苏-扬州" "河南-洛阳" "山东-德州" "山东-滨州" "浙江-湖州" "浙江-嘉兴" "浙江-金华" "江苏-泰州" "江苏-镇江" "江苏-盐城" "广西-桂林" "广东-惠州" "广东-湛江" "广东-江门" "广东-茂名" "湖南-株洲" "湖南-岳阳" "湖南-衡阳" "陕西-宝鸡" "陕西-咸阳" "湖北-宜昌" "湖北-襄阳" "河南-开封" "河南-许昌" "河南-平顶山" "江西-萍乡" "江西-宜春" "江西-上饶" "江西-新余" "江西-景德镇" )
function usage() {
  echo "$0 {maxmind|ipip} csv_file"
}

if [ "$#" -lt  2 ]; then
  usage
  exit
fi

if [ "$1" == "maxmind" ]; then
	top101cites=("${top101cites_maxmind[@]}")
else
	top101cites=("${top101cites_ipip[@]}")
fi

for city in "${top101cites[@]}"
do
	count=`grep ",$city," $2 | awk -F "\"*,\"*" '{sum+=$1} END {print sum}'`;
	printf "%s\t%s\n" $city $count
done