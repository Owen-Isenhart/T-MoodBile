import sql from '../db.js';

class GoogleTrendsData {
  /**
   * Creates or updates a trend data point.
   * If a record for the same query and date already exists, it updates the value.
   * @param {string} query - The search query (e.g., "How to cancel T-Mobile")
   * @param {string} intent - 'positive' or 'negative'
   * @param {string} date - The date (e.g., "Oct 26, 2025")
   * @param {number} value - The interest score (0-100)
   */
  static async createOrUpdate(query, intent, date, value) {
    // Convert date string from "Nov 9, 2025" to a SQL-friendly "YYYY-MM-DD"
    const sqlDate = new Date(date).toISOString().split('T')[0];

    try {
      const [record] = await sql`
        INSERT INTO google_trends_data
          (query, intent, date, value)
        VALUES
          (${query}, ${intent}, ${sqlDate}, ${value})
        ON CONFLICT (query, date)
        DO UPDATE SET
          value = EXCLUDED.value
        RETURNING *
      `;
      return record;
    } catch (err) {
      console.error('Error in GoogleTrendsData.createOrUpdate:', err);
    }
  }
}

export default GoogleTrendsData;