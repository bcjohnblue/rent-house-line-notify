import axios from 'axios';

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * 從 591 首頁取得 T591_TOKEN Cookie
 * 591 已改版為 Nuxt SSR，不再需要 CSRF Token
 */
export const getHeaders = async () => {
  try {
    const response = await axios.get('https://rent.591.com.tw/', {
      headers: { 'User-Agent': USER_AGENT },
      maxRedirects: 0,
      validateStatus: (status) => status < 400,
    });

    const setCookies = response.headers['set-cookie'] || [];
    const T591TokenCookie = setCookies.find((cookie) => cookie.includes('T591_TOKEN'));
    const T591Token = T591TokenCookie?.match(/T591_TOKEN=(.+?);/)?.[1];

    if (!T591Token) {
      throw new Error('無法取得 T591_TOKEN');
    }

    const headers = {
      'User-Agent': USER_AGENT,
      Cookie: `T591_TOKEN=${T591Token}; urlJumpIp=1; webp=1`,
    };
    return headers;
  } catch (error) {
    console.error('getHeaders error', error.message || error);
    throw error;
  }
};

const PAGE_SIZE = 30;  // 591 每頁固定 30 筆
const MAX_PAGES = 3;   // 最多抓 3 頁（90 筆），避免過多請求

/**
 * 解析 591 SSR HTML，回傳 { dataList, total }
 */
const parseNuxtHtml = (html) => {
  const match = html.match(/window\.__NUXT__=\(function\(([^)]*)\)\{return (.+)\}\((.+)\)\)/s);
  if (!match) throw new Error('無法解析 591 頁面的 __NUXT__ 資料');
  const params = match[1].split(',');
  const argsArr = new Function('return [' + match[3] + ']')();
  const nuxtData = new Function(params.join(','), 'return ' + match[2])(...argsArr);
  const rentList = nuxtData?.pinia?.['rent-list'];
  if (!rentList?.dataList) throw new Error('無法從 __NUXT__ 取得 rent-list 資料');
  return { dataList: rentList.dataList, total: rentList.total || 0 };
};

/**
 * 將原始 591 物件轉換為統一格式
 */
const normalizeItem = (item) => {
  const tags = item.tags || [];
  const hasElevator = tags.includes('有電梯');
  const totalFloor = parseInt(item.floor_name?.split('/')?.[1]) || 0;
  const building_type = hasElevator || totalFloor > 5 ? '電梯大樓' : '公寓';
  const layoutMatch = item.ding_rent_price?.match(/>(\d+房[^<]*)</);
  const fullLayout = layoutMatch?.[1] || item.layoutStr || '';
  return {
    post_id: item.id,
    section_name: item.address?.split('-')?.[0] || '',
    kind_name: item.kind_name,
    price: item.price,
    unit: item.price_unit,
    title: item.title,
    area_name: item.area_name,
    surrounding: item.surrounding,
    url: item.url,
    photo: item.photoList?.[0] || '',
    floor_name: item.floor_name || '',
    layoutStr: fullLayout,
    address: item.address || '',
    building_type,
  };
};

/**
 * 從 591 的 SSR 頁面 (/list) 取得租屋列表資料（含分頁）
 *
 * @param {Object} query - 搜尋條件
 * @param {Object} options - axios options (需包含 headers)
 */
export const getHouseListData = async (query, options) => {
  const axiosOptions = {
    ...options,
    headers: { ...options?.headers, 'User-Agent': USER_AGENT },
  };

  const fetchPage = async (page) => {
    const params = new URLSearchParams({ ...query, region: '1', page });
    const response = await axios.get(
      `https://rent.591.com.tw/list?${params}`,
      axiosOptions
    );
    return parseNuxtHtml(response.data);
  };

  // 抓第 1 頁，同時取得 total
  // 資料排序為最新 → 最舊，page 1 是最新的
  const firstPage = await fetchPage(1);
  const allItems = [...firstPage.dataList];
  const total = firstPage.total;

  const totalPages = Math.min(Math.ceil(total / PAGE_SIZE), MAX_PAGES);
  console.log(`591 total: ${total}，抓取 ${totalPages} 頁（最多 ${totalPages * PAGE_SIZE} 筆）`);

  // 並行抓剩餘頁，保持順序（page2 接在 page1 後面，越後面越舊）
  if (totalPages > 1) {
    const pageNums = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const restPages = await Promise.all(pageNums.map(fetchPage));
    restPages.forEach((p) => allItems.push(...p.dataList));
  }

  // 去重並轉換格式（保持原始順序：最新在前）
  const seen = new Set();
  const dataList = allItems
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .map(normalizeItem);

  return {
    data: {
      data: {
        data: dataList,
      },
    },
  };
};

export const getHouseDetailData = async (id, options) => {
  const url = `https://bff.591.com.tw/v1/house/rent/detail?id=${id}`;
  return axios.get(url, options);
};
