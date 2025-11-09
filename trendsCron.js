import cron from 'node-cron';
import GoogleTrendsService from './services/GoogleTrendsService.js';

const trendsService = new GoogleTrendsService();

async function runTrendsUpdate() {
  console.log('Running daily Google Trends update...');
  try {
    await trendsService.fetchAndStoreTrends();
  } catch (error) {
    console.error('Error during daily trends update:', error);
  }
}

// Schedule the job to run once per day at 2:00 AM
export function startTrendsCron() {
  cron.schedule('0 2 * * *', runTrendsUpdate, {
    scheduled: true,
    timezone: "America/Chicago"
  });
  
  console.log('Google Trends cron job scheduled to run daily at 2:00 AM.');

  // Optional: Run once on startup for testing
  //runTrendsUpdate();
}