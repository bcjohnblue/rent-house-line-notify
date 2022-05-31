# Rent House - Line Notify

利用 Line Notify 即時推播 591 租屋網的最新上架物件

## Configuration

Step 1.

修改 `constants.js` 裡各項設定

- CRON_SYNTEX

  決定多久去 591 租屋網要資料，設定格式請參考：https://crontab.cronhub.io/

  預設值： `30 9-23 * * *`， 9:30 - 23:30，整點過後 30 分鐘 (09:30, 10:30, ... 23:30)

- RENT_LIST_QUERY

  591 列表搜尋的條件

  ex.

  https://rent.591.com.tw/?section=3,4,10&searchtype=1&kind=1&rentprice=20000,40000&order=posttime&orderType=desc

- RENT_INFO_QUERY

  自行設定額外過濾的條件

  預設值：

  - 最小坪數: 18 坪以上
  - 排除捷運站: ['中山', '民權西路', '中山國小', '雙連', '東湖', '內湖', '港墘']

Step 2.

前往 [Line Notify 官網](https://notify-bot.line.me/my/services/) 申請 Line Notify Token (此時需綁定 `Token` 套用的群組，此群組為之後 Line Notify 推播到的地方)

Step 3.

`.env` 環境變數檔案設定

將 `.example.env` 重新命名為 `.env` 後將 Step 2. 拿到的 `LINE_NOTIFY_TOKEN` 填入

## Start server

```shell
git clone https://github.com/bcjohnblue/rent-house-line-notify
npm install
npm start
```

<img alt="line notify image" src="./assets/line.jpg" width="30%">


<br />
最後更新日期：2022/05/31