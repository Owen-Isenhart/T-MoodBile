import cron from 'node-cron';
import RedditService from './services/RedditService.js';

const redditService = new RedditService();

async function runRedditScrape() {
  console.log('Running hourly Reddit scrape...');
  try {
    await redditService.scrapeAndAnalyzeReddit();
  } catch (error) {
    console.error('Error during hourly Reddit scrape:', error);
  }
}

// Schedule the job to run at minute 0 of every hour (e.g., 1:00, 2:00)
export function startRedditCron() {
  cron.schedule('0 * * * *', runRedditScrape, {
    scheduled: true,
    timezone: "America/Chicago"
  });
  
  console.log('Reddit cron job scheduled to run hourly.');

  // Optional: Run once on startup for testing
  // runRedditScrape();
}