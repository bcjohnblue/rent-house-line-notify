// 輪詢的時間 (cron)
// https://crontab.cronhub.io/
// 9:00 - 23:59，每整點 10 分鐘執行 (09:00, 09:10, 09:20... 23:30, 23:40, 23:50)
export const CRON_SYNTEX = '0,10,20,30,40,50 9-23 * * *';

// 591 租屋列表搜尋的條件
// https://rent.591.com.tw/?kind=1&showMore=1&order=posttime&orderType=desc&section=3,4,10&searchtype=1&rentprice=20000,30000&area=18,
export const RENT_LIST_QUERY = {
  // 中山(3)、松山區(4)
  section: '3,4',
  // 按鄉鎮
  searchtype: '1',
  // 整層住家
  kind: '1',
  // 租金範圍
  rentprice: '15000,30000',
  // 坪數 (大於 18 坪)
  area: '18,',
  // 最新 -> 舊 排序
  order: 'posttime',
  orderType: 'desc',
};

// 第二組條件 - 獨立套房
export const RENT_LIST_QUERY_1 = {
  // 中山(3)、松山區(4)
  section: '3,4',
  // 按鄉鎮
  searchtype: '1',
  // 獨立套房
  kind: '2',
  // 租金範圍
  rentprice: '15000,30000',
  // 坪數 (大於 10 坪)
  area: '10,',
  // 最新 -> 舊 排序
  order: 'posttime',
  orderType: 'desc',
};

// 額外過濾的條件 - 需自行寫程式處理
export const RENT_INFO_QUERY = {
  // 排除捷運站
  excludeMRTs: ['中山', '民權西路', '中山國小', '雙連', '東湖', '內湖', '港墘', '文德', '葫州'],
};
