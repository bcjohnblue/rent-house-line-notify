/* eslint-disable camelcase */
import { APIService, CacheService } from '#services';
import { RENT_LIST_QUERY, RENT_INFO_QUERY } from '#constants';

const retrieveHeaders = async () => {
    try {
        const cache = CacheService.instance();
        if (cache.has('HEADERS')) return cache.get('HEADERS');

        const headers = await APIService.getHeaders(RENT_LIST_QUERY);
        await cache.set('HEADERS', headers);

        return headers;
    } catch (error) {
        console.error('retrieveHeaders error', error);
        return error;
    }
};

export const sendNotifyWithRentHouse = async ({ rentListQuery, cacheKey }) => {
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

            // 修正：當 Cache 記錄的物件已從列表消失時，不推送任何物件
            if (targetIndex === -1) {
                console.log('cached post_id not found in list, updating cache only');
                if (newData.length) await cache.set(cacheKey, newData[0].post_id);
                return;
            }

            newData = newData.slice(0, targetIndex);
        }
        console.log('cacheKey', cache.get(cacheKey));
        console.log(
            'NEXT_cacheKey',
            newData[0]?.post_id || cache.get(cacheKey)
        );
        if (newData.length) await cache.set(cacheKey, newData[0].post_id);

        // 使用 Flex Carousel 批量推播（最新在前）
        if (newData.length) {
            await APIService.sendFlexCarousel(newData);
        }

        console.log(
            'send post_ids',
            newData.map((d) => d.post_id)
        );
    } catch (error) {
        console.error('sendNotifyWithRentHouse error', error);
    }
};
