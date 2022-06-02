import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import { sendNotifyWithRentHouseSchedule, pingSchedule } from '#schedules';
import { CacheService } from '#services';

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use('/', (_, res) => {
  console.log('ok');
  res.status(200).json('ok');
});

CacheService.start();

app.set('port', process.env.PORT || 5000);
const server = app.listen(app.get('port'), () => {
  console.log(`Express running → PORT ${server.address().port}`);

  if (process.env.APP_URL.startsWith('http')) pingSchedule(process.env.APP_URL);
  sendNotifyWithRentHouseSchedule();
});
