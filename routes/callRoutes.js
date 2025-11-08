import express from 'express';
import { callCustomer } from '../controllers/CallController.js';

const router = express.Router();

router.post('/:customerId', callCustomer);

export default router;
