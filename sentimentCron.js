import cron from 'node-cron';
import User from './models/User.js';
import NotificationService from './services/NotificationService.js';
import SentimentAnalysisService from './services/SentimentAnalysisService.js';

const SENTIMENT_THRESHOLD = 0.70; // 70%
const notificationService = new NotificationService();

// --- THE FIX ---
// This variable will track the alert state.
// false = Sentiment is OK, or we are reset.
// true = Sentiment is low AND we have already sent an alert.
let isAlertActive = false;
// --- END FIX ---

async function checkSentimentAndAlert() {
  console.log('Running sentiment check...');

  try {
    const currentSentiment = await SentimentAnalysisService.calculateOverallSentiment();

    if (currentSentiment < SENTIMENT_THRESHOLD) {
      // --- UPDATED LOGIC ---
      if (isAlertActive === false) {
        // This is a NEW event. Sentiment has just dropped.
        console.log(`ALERT: Sentiment is at ${(currentSentiment * 100).toFixed(1)}%, below threshold. Sending alert...`);
        
        // 1. Get users and send alert
        const users = await User.getAll();
        const userEmails = users.map(u => u.email);

        if (userEmails.length > 0) {
          await notificationService.sendSentimentAlert(userEmails, currentSentiment);
        } else {
          console.log('Sentiment is low, but no users are in the database to notify.');
        }
        
        // 2. Set the flag so we don't spam
        isAlertActive = true;
      } else {
        // Sentiment is still low, but we've already notified. Do nothing.
        console.log(`Sentiment is still low (${(currentSentiment * 100).toFixed(1)}%), but alert already sent. No new email.`);
      }
      // --- END UPDATED LOGIC ---

    } else {
      // Sentiment is 70% or higher
      if (isAlertActive === true) {
        // --- UPDATED LOGIC ---
        // The sentiment has RECOVERED.
        console.log(`Sentiment has recovered to ${(currentSentiment * 100).toFixed(1)}%. Resetting alert state.`);
        // Reset the flag so we are ready to alert again if it drops.
        isAlertActive = false;
        // (Optional: You could send a "Sentiment Recovered" email here)
        // --- END UPDATED LOGIC ---
      } else {
        // Sentiment is normal and was already normal.
        console.log(`Sentiment is OK at ${(currentSentiment * 100).toFixed(1)}%.`);
      }
    }
  } catch (error) {
    console.error('Error during sentiment check:', error);
  }
}

// Schedule the job to run every 5 minutes
export function startSentimentCron() {
  cron.schedule('*/5 * * * *', checkSentimentAndAlert, {
    scheduled: true,
    timezone: "America/Chicago" // Set to your timezone
  });
  
  console.log('Sentiment cron job scheduled to run every 5 minutes (with anti-spam logic).');
}