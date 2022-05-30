import axios from 'axios';

export const sendNotify = (data) => {
  const url = 'https://notify-api.line.me/api/notify';
  return axios.post(
    url,
    data,
    {
      headers: {
        'content-type': 'multipart/form-data',
        Authorization: `Bearer ${process.env.LINE_NOTIFY_TOKEN}`,
      },
    },
  );
};
