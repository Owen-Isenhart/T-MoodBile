import express from 'express';
import { callCustomer } from '../controllers/CallController.js';

const router = express.Router();

/**
 * @swagger
 * /api/calls/{customerId}:
 *   post:
 *     summary: Initiate a survey call to a customer
 *     tags: [Calls]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the customer to call
 *     responses:
 *       '200':
 *         description: Call initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Call initiated successfully
 *                 callSid:
 *                   type: string
 *                   example: CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *       '404':
 *         description: Customer not found
 *       '500':
 *         description: Failed to initiate call
 */
router.post('/:customerId', callCustomer);

export default router;
