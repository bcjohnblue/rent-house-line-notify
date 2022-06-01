import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ping = async () => {
  try {
    await axios.get(process.env.APP_URL);
  } catch (error) {
    console.error('ping error', error);
  }
};

ping();
