import axios from 'axios';

// axios.defaults.timeout = 5000;

export const getHeaders = async () => {
  const response = await axios.get('https://rent.591.com.tw');

  const regExp = /<meta name="csrf-token" content="([A-Za-z0-9]*)">/gi;
  const csrfToken = regExp.exec(response.data)[1];

  const T591TokenCookie = response.headers['set-cookie'].find((cookie) => cookie.includes('T591_TOKEN'));
  const T591Token = T591TokenCookie.match(/T591_TOKEN=(.+?);/)[1];

  const Cookie = response.headers['set-cookie'].find((cookie) => cookie.includes('591_new_session'));

  const headers = {
    'X-CSRF-TOKEN': csrfToken,
    T591_TOKEN: T591Token,
    Cookie,
  };
  return headers;
};

export const getHouseListData = async (query, options) => {
  const params = new URLSearchParams(query);
  const url = `https://rent.591.com.tw/home/search/rsList?${params}`;
  return axios.get(url, options);
};

export const getHouseDetailData = async (id, options) => {
  const url = `https://bff.591.com.tw/v1/house/rent/detail?id=${id}`;
  return axios.get(url, options);
};
