import { getJson } from "serpapi";
import 'dotenv/config';
import GoogleTrendsData from '../models/GoogleTrendsData.js';

// --- THIS IS THE NEW, MORE BALANCED LIST ---
const KEYWORDS_TO_TRACK = {
  "T-Mobile deals": "positive",
  "T-Mobile 5G internet": "positive",
  "T-Mobile outage": "negative",       // <-- NEW high-volume negative
  "T-Mobile problems": "negative"      // <-- NEW high-volume negative
};
// ---

export default class GoogleTrendsService {
  /**
   * Fetches comparative trend data from SerpApi and stores it in the database.
   */
  async fetchAndStoreTrends() {
    console.log("GoogleTrendsService: Fetching comparative trend data...");

    const keywords = Object.keys(KEYWORDS_TO_TRACK);
    
    const params = {
      engine: "google_trends",
      q: keywords.join(','),
      date: "today 3-m", // Past 3 months
      data_type: "TIMESERIES",
      api_key: process.env.SERPAPI_KEY
    };

    try {
      const data = await getJson(params);

      if (!data.interest_over_time || !data.interest_over_time.timeline_data) {
        console.log('GoogleTrendsService: No interest over time data found.');
        return;
      }

      const timeline = data.interest_over_time.timeline_data;

      // Loop through each date entry
      for (const entry of timeline) {
        // Loop through each keyword's value for that date
        for (const valueData of entry.values) {
          const query = valueData.query;
          const intent = KEYWORDS_TO_TRACK[query];
          const date = entry.date;
          const value = valueData.extracted_value;

          // Save to database
          await GoogleTrendsData.createOrUpdate(query, intent, date, value);
        }
      }
      console.log(`GoogleTrendsService: Successfully fetched and stored ${timeline.length} days of trend data.`);

    } catch (error) {
      console.error('GoogleTrendsService: Error fetching data from SerpApi:', error.message);
    }
  }
}