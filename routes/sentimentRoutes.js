import express from 'express';
import { resolveSentiment } from '../controllers/SentimentController.js';

const router = express.Router();

/**
 * @swagger
 * /api/sentiments/resolve:
 *   post:
 *     summary: Mark a sentiment as resolved
 *     tags: [Sentiments]
 *     description: Sets the 'is_resolved' flag to true for a given sentiment.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: The type of sentiment ('survey' or 'social')
 *                 example: survey
 *               id:
 *                 type: integer
 *                 description: The ID of the sentiment record
 *                 example: 1
 *     responses:
 *       '200':
 *         description: Sentiment marked as resolved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sentiment marked as resolved
 *                 data:
 *                   type: object
 *                   description: The updated record
 *                   example:
 *                     id: 1
 *                     customer_id: 1
 *                     transcript: "..."
 *                     sentiment: "bad"
 *                     insight: "..."
 *                     is_resolved: true
 *       '400':
 *         description: Invalid sentiment type
 *       '404':
 *         description: Sentiment record not found
 *       '500':
 *         description: Failed to resolve sentiment
 */
router.post('/resolve', resolveSentiment);

export default router;
