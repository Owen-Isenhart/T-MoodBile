import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { startSentimentCron } from './SentimentCron.js';// Swagger Imports
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import sentimentRoutes from './routes/sentimentRoutes.js';
import { startTrendsCron } from './trendsCron.js';
import { startRedditCron } from './redditCron.js';
import callRoutes from './routes/callRoutes.js';
import twilioRoutes from './routes/twilioRoutes.js';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- SWAGGER SETUP ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'T-Mobile Sentiment Analysis API',
      version: '1.0.0',
      description: 'API for initiating customer survey calls and handling Twilio webhooks',
    },
    servers: [
      {
        url: `${process.env.BASE_URL || 'http://localhost:3000'}`,
        description: 'Dynamic Server URL',
      },
    ],
  },
  // Path to the API docs (your route files)
  apis: ['./routes/*.js', './models/*.js'], // Make sure it includes the new route file
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// --- END SWAGGER ---


// Serve static audio files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Use routes
app.use('/api/calls', callRoutes);
app.use('/api/twilio', twilioRoutes);
app.use('/api/sentiments', sentimentRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API docs available at http://localhost:${PORT}/api-docs`);
  if(process.env.BASE_URL) {
    console.log(`Swagger UI (public): ${process.env.BASE_URL}/api-docs`);
  }
  startSentimentCron();
  startTrendsCron();
  startRedditCron();
});