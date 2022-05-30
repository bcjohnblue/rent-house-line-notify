import express from 'express';
import { rent591Controller } from '#controllers';

const router = express.Router();

router.post('/subscribe', rent591Controller.getHouseListData);

export default router;
