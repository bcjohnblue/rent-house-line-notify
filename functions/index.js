import * as dotenv from 'dotenv';
import { sendNotifyWithRentHouse } from '#schedules';
import { CacheService } from '#services';
import { RENT_LIST_QUERY } from '#constants';

// 本機開發時才載入 .env（Cloud Run Functions 上環境變數由 --set-env-vars 注入）
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: new URL('../.env', import.meta.url).pathname });
}

/**
 * notifyRentHouse
 * 由 Cloud Scheduler 每 3 小時呼叫一次
 * POST https://<function-url>/notifyRentHouse
 */
export const notifyRentHouse = async (req, res) => {
    try {
        await CacheService.start();
        await sendNotifyWithRentHouse({
            rentListQuery: RENT_LIST_QUERY,
            cacheKey: 'LATEST_POST_ID_FULL_HOME',
        });
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('notifyRentHouse error', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * lineWebhook
 * LINE Webhook endpoint，用來取得 Group ID
 * 設定到 LINE Developers Console 的 Webhook URL
 * POST https://<function-url>/lineWebhook
 */
export const lineWebhook = (req, res) => {
    const events = req.body?.events || [];
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
            console.log('將此 ID 填入環境變數的 LINE_TARGET_ID');
            console.log('========================================');
        }
    });
    res.status(200).json({ status: 'ok' });
};
