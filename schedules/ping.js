import axios from 'axios';
import cron from 'node-cron';

const ping = async (host) => {
  try {
    await axios.get(host);
  } catch (error) {
    console.error('ping error', error);
  }
};

export const pingSchedule = (host) => {
  cron.schedule('*/30 9-23 * * *', () => ping(host), {
    timezone: 'Asia/Taipei',
  });
};
