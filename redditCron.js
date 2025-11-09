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
  // '0 */4 * * *' means "at minute 0, every 4th hour" 
  // (e.g., at 00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
  cron.schedule('0 */4 * * *', runRedditScrape, {
    scheduled: true,
    timezone: "America/Chicago"
  });
  
  console.log('Reddit cron job scheduled to run every 4 hours.');

  // Optional: Run once on startup for testing
  // runRedditScrape();
}