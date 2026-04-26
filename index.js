import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import { sendNotifyWithRentHouse } from '#schedules';
import { CacheService } from '#services';
import { RENT_LIST_QUERY } from '#constants';

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.get('/', (_, res) => {
    console.log('ok');
    res.status(200).json('ok');
});

// LINE Webhook - 用來取得 Group ID
// 將此 URL 設定到 LINE Developers Console 的 Webhook URL
// ex. https://your-app.herokuapp.com/webhook
app.post('/webhook', (req, res) => {
    const events = req.body.events || [];
    events.forEach((event) => {
        const { source } = event;
        const targetId = process.env.LINE_TARGET_ID;
        const sourceId = source.type === 'group' ? source.groupId : source.userId;
        const label = source.type === 'group' ? 'Group' : 'User';

        if (sourceId === targetId) {
            console.log(`✅ ${label} ID 已設定好：${sourceId}`);
        } else {
            console.log('========================================');
            console.log(`📌 ${label} ID: ${sourceId}`);
            console.log('將此 ID 填入 .env 的 LINE_TARGET_ID');
            console.log('========================================');
        }
    });
    res.status(200).json({ status: 'ok' });
});

app.set('port', process.env.PORT || 5001);
const server = app.listen(app.get('port'), async () => {
    console.log(`Express running → PORT ${server.address().port}`);

    await CacheService.start();
    await sendNotifyWithRentHouse({ rentListQuery: RENT_LIST_QUERY, cacheKey: 'LATEST_POST_ID_FULL_HOME' });
});
