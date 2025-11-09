import express from 'express';
import {
  getActionableInsights,
  getDashboardKpis,
  getGoogleTrendsData,
  getAllSurveys,
  getAllSocial,
  getSentimentOverTime,
  getAllCustomers
} from '../controllers/DashboardController.js';

const router = express.Router();

/**
 * @swagger
 * /api/dashboard/actionable-insights:
 *   get:
 *     summary: Get all unresolved 'bad' or 'neutral' sentiments
 *     tags: [Dashboard]
 *     description: Fetches a combined list of survey and social media posts that are not 'good' and not resolved. This is for the main "to-do" list.
 *     responses:
 *       '200':
 *         description: A list of actionable items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   type:
 *                     type: string
 *                     example: survey
 *                   sentiment:
 *                     type: string
 *                   text:
 *                     type: string
 *                   insight:
 *                     type: string
 *                   url:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                   customer_name:
 *                     type: string
 *                   customer_phone:
 *                     type: string
 */
router.get('/actionable-insights', getActionableInsights);

/**
 * @swagger
 * /api/dashboard/kpis:
 *   get:
 *     summary: Get all dashboard KPIs and sentiment breakdowns
 *     tags: [Dashboard]
 *     description: Fetches key statistics, including Direct, Indirect, and Total sentiment percentages.
 *     responses:
 *       '200':
 *         description: A JSON object of all KPIs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 direct_sentiment_breakdown:
 *                   type: object
 *                   properties:
 *                     good:
 *                       type: integer
 *                     neutral:
 *                       type: integer
 *                     bad:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     good_percent:
 *                       type: number
 *                     neutral_percent:
 *                       type: number
 *                     bad_percent:
 *                       type: number
 *                 indirect_sentiment_breakdown:
 *                   type: object
 *                   properties:
 *                     positive:
 *                       type: integer
 *                     negative:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     positive_percent:
 *                       type: number
 *                     negative_percent:
 *                       type: number
 *                 total_customer_sentiment_percent:
 *                   type: number
 */
router.get('/kpis', getDashboardKpis);

/**
 * @swagger
 * /api/dashboard/sentiment-over-time:
 *   get:
 *     summary: Get data for the sentiment over time line graph
 *     tags: [Dashboard]
 *     description: Fetches the daily 'good' sentiment percentage from all direct sources (calls + social).
 *     responses:
 *       '200':
 *         description: A list of date/percentage objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     example: "2025-10-25"
 *                   good_percent:
 *                     type: number
 *                     example: 75.5
 */
router.get('/sentiment-over-time', getSentimentOverTime);

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     summary: Get formatted data for Google Trends
 *     tags: [Dashboard]
 *     description: Fetches all Google Trends data, formatted for a chart library (e.g., Chart.js).
 *     responses:
 *       '200':
 *         description: A JSON object formatted for charts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 "How to cancel T-Mobile":
 *                   - date: "2025-10-01"
 *                     value: 12
 *                 "T-Mobile deals":
 *                   - date: "2025-10-01"
 *                     value: 5
 */
router.get('/trends', getGoogleTrendsData);

/**
 * @swagger
 * /api/dashboard/surveys:
 *   get:
 *     summary: Get all survey responses
 *     tags: [Dashboard]
 *     description: Fetches a complete list of all survey responses, joined with customer info.
 *     responses:
 *       '200':
 *         description: A list of all survey responses
 */
router.get('/surveys', getAllSurveys);

/**
 * @swagger
 * /api/dashboard/social:
 *   get:
 *     summary: Get all social media sentiments
 *     tags: [Dashboard]
 *     description: Fetches a complete list of all social media sentiment records.
 *     responses:
 *       '200':
 *         description: A list of all social media posts
 */
router.get('/social', getAllSocial);

/**
 * @swagger
 * /api/dashboard/customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Dashboard]
 *     description: Fetches a complete list of all customers to display in a table.
 *     responses:
 *       '200':
 *         description: A list of all customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 */
router.get('/customers', getAllCustomers);

export default router;
