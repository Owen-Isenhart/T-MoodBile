import axios from "axios";
import AiAnalysisService from './AiAnalysisService.js';
import SocialMediaSentiment from '../models/SocialMediaSentiment.js';

/**
 * Pauses execution for a specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to sleep.
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class RedditService {
  constructor() {
    this.aiService = new AiAnalysisService();
  }

  /**
   * Fetches posts from a specific Reddit endpoint.
   * @param {string} sort - 'new' or 'top'
   * @param {number} limit - Number of posts to fetch
   * @param {string} [timeframe] - 'year', 'month', 'day' (for 'top' sort)
   */
  async _fetchPosts(sort, limit, timeframe = null) {
    const subreddit = "Tmobile";
    let url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;
    if (timeframe) {
      url += `&t=${timeframe}`;
    }

    try {
      const response = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      return response.data.data.children.map(c => c.data);
    } catch (err) {
      console.error(`RedditService: Error fetching ${sort} posts:`, err.message);
      return [];
    }
  }

  /**
   * Scrapes r/Tmobile for new and top posts, analyzes them with Gemini,
   * generates insights, and saves them to the database.
   */
  async scrapeAndAnalyzeReddit() {
    console.log("RedditService: Starting scrape for 50 posts...");

    // 1. Fetch 30 most RECENT posts
    const recentPosts = await this._fetchPosts('new', 30);
    
    // 2. Fetch 20 TOP posts from the past YEAR (for historical data)
    const historicalPosts = await this._fetchPosts('top', 20, 'year');

    // 3. Combine and de-duplicate (in case a post is both new and top)
    const allPostsMap = new Map();
    [...recentPosts, ...historicalPosts].forEach(post => {
      if (post.selftext || post.title) { // Only add posts with text
        allPostsMap.set(post.id, post);
      }
    });

    const uniquePosts = Array.from(allPostsMap.values());
    console.log(`RedditService: Found ${uniquePosts.length} unique posts to analyze.`);

    // --- 4. ANALYZE AND SAVE (one by one, with rate limiting) ---
    for (const post of uniquePosts) {
      const text = `${post.title} ${post.selftext || ""}`;
      const post_url = `https://www.reddit.com${post.permalink}`;
      const platform = 'reddit';
      
      try {
        // 1. Get sentiment from Gemini
        const sentiment = await this.aiService.analyzeSentiment(text);

        // 2. Get insight if needed
        let insight = null;
        if (sentiment === 'bad' || sentiment === 'neutral') {
          insight = await this.aiService.generateImprovementInsight(text, sentiment);
        }

        // 3. Save to database (will skip if URL is already saved)
        await SocialMediaSentiment.create(platform, text, sentiment, insight, post_url);
        console.log(`- Analyzed and saved post: ${post.id}`);

        // --- !! RATE LIMITING !! ---
        // Wait 7 seconds to stay under the 10-requests-per-minute free limit.
        await sleep(7000); 

      } catch (analysisError) {
        console.error(`Error analyzing post ${post.id}:`, analysisError.message);
        if (analysisError.message.includes('429')) {
          console.log('Rate limit hit, sleeping for 60 seconds...');
          await sleep(60000); // Wait a full minute
        }
      }
    }
    console.log("RedditService: Analysis and database import complete.");
  }
}

export default RedditService;