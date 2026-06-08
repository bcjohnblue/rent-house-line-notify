/* eslint-disable camelcase */
import { APIService, CacheService } from '#services';
import { RENT_LIST_QUERY, RENT_INFO_QUERY } from '#constants';

// 已推 post_id 清單上限。591 一次抓 90 筆，物件大約 1-2 週滑出，1000 約涵蓋 2 個月。
const MAX_PUSHED_IDS = 1000;

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
      new Date().toLocaleTimeString(),
    );

    const headers = await retrieveHeaders();
    const houseListResponse = await APIService.getHouseListData(
      rentListQuery,
      { headers },
    );

    let newData = houseListResponse.data.data.data;
    newData = newData.filter((d) => RENT_INFO_QUERY.excludeMRTs.every(
      (MRT) => !new RegExp(MRT).test(d.surrounding?.desc),
    ));

    const cache = CacheService.instance();
    const currentIds = newData.map((d) => d.post_id);

    // 第一次部署（cache 沒這個 key）：seed 當前列表，不推送，避免初次部署洗版
    if (!cache.has(cacheKey)) {
      console.log('first run, seeding cache without sending notifications');
      await cache.set(cacheKey, currentIds.slice(0, MAX_PUSHED_IDS));
      return;
    }

    const pushedIds = cache.get(cacheKey) || [];
    const pushedSet = new Set(pushedIds);
    const pending = newData.filter((d) => !pushedSet.has(d.post_id));

    console.log('已推清單筆數:', pushedIds.length);
    console.log('本次新物件:', pending.map((d) => d.post_id));

    if (pending.length) {
      await APIService.sendFlexCarousel(pending);
    }

    // 新物件加在前，去重後 trim 到上限
    const updatedIds = [...new Set([
      ...pending.map((d) => d.post_id),
      ...pushedIds,
    ])].slice(0, MAX_PUSHED_IDS);
    await cache.set(cacheKey, updatedIds);
  } catch (error) {
    console.error('sendNotifyWithRentHouse error', error);
  }
};
