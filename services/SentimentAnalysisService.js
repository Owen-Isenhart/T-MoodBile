import sql from '../db.js';

class SentimentAnalysisService {
  /**
   * Calculates the overall 'good' sentiment percentage from all sources.
   * @returns {number} A value between 0 and 1 (e.g., 0.72)
   */
  static async calculateOverallSentiment() {
    console.log('Calculating overall sentiment...');
    
    // 1. Get survey sentiments
    const surveySentiments = await sql`
      SELECT sentiment FROM survey_responses WHERE sentiment IS NOT NULL
    `;
    
    // 2. Get social media sentiments
    const socialSentiments = await sql`
      SELECT sentiment FROM social_media_sentiments WHERE sentiment IS NOT NULL
    `;
    
    const allSentiments = [
      ...surveySentiments.map(s => s.sentiment),
      ...socialSentiments.map(s => s.sentiment)
    ];

    if (allSentiments.length === 0) {
      console.log('No sentiment data found.');
      return 1.0; // Default to 100% if no data
    }

    // 3. Calculate percentage
    const goodSentiments = allSentiments.filter(s => s === 'good').length;
    const totalSentiments = allSentiments.length;
    const percentage = goodSentiments / totalSentiments;
    
    console.log(`Sentiment check: ${goodSentiments} 'good' out of ${totalSentiments} total. (${(percentage * 100).toFixed(1)}%)`);
    return percentage;
  }
}

export default SentimentAnalysisService;