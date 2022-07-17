/* eslint-disable camelcase */
import cron from 'node-cron';
import {APIService, CacheService} from '#services';
import {RENT_LIST_QUERY, RENT_INFO_QUERY, CRON_SYNTEX} from '#constants';

const retrieveHeaders = async () => {
    try {
        const cache = CacheService.instance();
        if (cache.has('HEADERS')) return cache.get('HEADERS');

        const headers = await APIService.getHeaders(RENT_LIST_QUERY);
        cache.set('HEADERS', headers);

        return headers;
    } catch (error) {
        console.error('retrieveHeaders error', error);
        return error;
    }
};

const sendNotifyWithRentHouse = async ({rentListQuery, cacheKey}) => {
    try {
        console.log(
            'send the line notification',
            new Date().toLocaleTimeString()
        );

        const headers = await retrieveHeaders();
        const houseListResponse = await APIService.getHouseListData(
            rentListQuery,
            {
                headers,
            }
        );

        let newData = houseListResponse.data.data.data;
        newData = newData.filter((d) =>
            RENT_INFO_QUERY.excludeMRTs.every(
                (MRT) => !new RegExp(MRT).test(d.surrounding?.desc)
            )
        );

        const cache = CacheService.instance();
        if (cache.has(cacheKey)) {
            const lastestPostId = cache.get(cacheKey);
            const postIds = newData.map((d) => d.post_id);
            const targetIndex = postIds.indexOf(lastestPostId);
            newData = newData.slice(0, targetIndex);
        }
        console.log('cacheKey', cache.get(cacheKey));
        console.log(
            'NEXT_cacheKey',
            newData[0]?.post_id || cache.get(cacheKey)
        );
        if (newData.length) cache.set(cacheKey, newData[0].post_id);

        newData.reverse().forEach((data) => {
            const {section_name, kind_name, price, unit, post_id} = data;
            const mobileLink = `https://m.591.com.tw/v2/rent/${post_id}`;
            const pcLink = `https://rent.591.com.tw/home/${post_id}`;

            APIService.sendNotify({
                message: `\r\n${section_name}，${kind_name}出租\r\n${price} ${unit}，詳情：\r\n${mobileLink}\r\n${pcLink}`,
            });
        });

        console.log(
            'send post_ids',
            newData.map((d) => d.post_id)
        );
    } catch (error) {
        console.error('sendNotifyWithRentHouse error', error);
    }
};

export const sendNotifyWithRentHouseSchedule = ({rentListQuery, cacheKey}) => {
    cron.schedule(CRON_SYNTEX, () => sendNotifyWithRentHouse({rentListQuery, cacheKey}), {
        timezone: 'Asia/Taipei',
    });
};
