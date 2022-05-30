import dotenv from 'dotenv';

import express from 'express';
import webPush from 'web-push';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import routes from '#routes';
import { CacheService } from '#services';
import { sendNotifyWithRentHouse } from '#schedules';

dotenv.config();
// eslint-disable-next-line no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirname = path.dirname(__filename);

const app = express();

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'client')));

const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

webPush.setVapidDetails(
  'mailto:bcjohnblue@gmail.com',
  publicVapidKey,
  privateVapidKey,
);

CacheService.start();
app.use('/', routes);

app.set('port', process.env.PORT || 5000);
const server = app.listen(app.get('port'), () => {
  console.log(`Express running → PORT ${server.address().port}`);
  sendNotifyWithRentHouse();
});
