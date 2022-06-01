import dotenv from 'dotenv';
import express from 'express';
import { sendNotifyWithRentHouseSchedule } from '#schedules';
import { CacheService } from '#services';

dotenv.config();

const app = express();

CacheService.start();

app.set('port', process.env.PORT || 5000);
const server = app.listen(app.get('port'), () => {
  console.log(`Express running → PORT ${server.address().port}`);
  sendNotifyWithRentHouseSchedule();
});
