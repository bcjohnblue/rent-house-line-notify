/* eslint-disable camelcase */
import cron from 'node-cron';
import { APIService, CacheService } from '#services';
import { RENT_LIST_QUERY, RENT_INFO_QUERY } from '#constants';

const retrieveHeaders = async () => {
  const cache = CacheService.instance();
  if (cache.has('HEADERS')) return cache.get('HEADERS');

  const headers = await APIService.getHeaders(RENT_LIST_QUERY);
  cache.set('HEADERS', headers);

  return headers;
};

export const getHouseListData = async (req, res) => {
  cron.schedule('*/5 * * * * *', async () => {
    try {
      console.log('running a task every 5 second');

      const headers = await retrieveHeaders();
      const houseListResponse = await APIService.getHouseListData(
        RENT_LIST_QUERY,
        {
          headers,
        },
      );

      let newData = houseListResponse.data.data.data;
      newData = newData
        .filter(
          (d) => +d.area >= RENT_INFO_QUERY.minArea,
        )
        .filter(
          (d) => RENT_INFO_QUERY.excludeMRTs
            .every((MRT) => !new RegExp(MRT).test(d.surrounding?.desc)),
        );

      const cache = CacheService.instance();
      if (cache.has('LATEST_POST_ID')) {
        const lastestPostId = cache.get('LATEST_POST_ID');
        const postIds = newData.map((d) => d.post_id);
        const targetIndex = postIds.indexOf(lastestPostId);
        newData = newData.slice(0, targetIndex);
      }
      if (newData.length) cache.set('LATEST_POST_ID', newData[0].post_id);

      console.log('newData', newData);

      newData.reverse().forEach((data) => {
        try {
          const {
            section_name, kind_name, price, unit, post_id,
          } = data;
          const mobileLink = `https://m.591.com.tw/v2/rent/${post_id}`;
          const pcLink = `https://rent.591.com.tw/home/${post_id}`;

          APIService.sendNotify({
            message: `\r\n${section_name}，${kind_name}出租\r\n${price} ${unit}，詳情：\r\n${mobileLink}\r\n${pcLink}`,
          });
        } catch (error) {
          console.error(error);
        }
      });
    } catch (error) {
      console.error(error);
    }
  });

  res.status(201).json({});
};

export default {
  getHouseListData,
};
