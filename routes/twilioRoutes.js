import express from 'express';
import { generateTwiML, handleRecordingWebhook } from '../controllers/TwilioController.js';

const router = express.Router();

/**
 * @swagger
 * /api/twilio/twiml/{customerId}:
 *   post:
 *     summary: (Webhook) Generate TwiML instructions for Twilio
 *     tags: [Twilio Webhooks]
 *     description: This endpoint is called BY TWILIO to get XML instructions for the call.
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the customer being called
 *     responses:
 *       '200':
 *         description: TwiML (XML) response
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 *               example: "<Response><Play>...</Play><Record>...</Record></Response>"
 */
router.post('/twiml/:customerId', generateTwiML);

/**
 * @swagger
 * /api/twilio/recording-webhook:
 *   post:
 *     summary: (Webhook) Receive completed recording from Twilio
 *     tags: [Twilio Webhooks]
 *     description: This endpoint is called BY TWILIO after the call ends, with a link to the recording.
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               RecordingUrl:
 *                 type: string
 *                 description: The URL of the .wav recording
 *               CallSid:
 *                 type: string
 *                 description: The SID of the parent call
 *     responses:
 *       '200':
 *         description: Webhook received successfully
 */
router.post('/recording-webhook', handleRecordingWebhook);

export default router;
