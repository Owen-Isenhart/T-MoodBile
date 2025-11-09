import express from 'express';
import { getOrCreateCustomer } from '../controllers/CustomerController.js';

const router = express.Router();

// Create or get a customer by phone (idempotent by phone)
router.post('/', getOrCreateCustomer);

export default router;


