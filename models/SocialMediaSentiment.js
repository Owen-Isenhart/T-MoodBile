import sql from '../db.js';

class SocialMediaSentiment {
  // For your web scraping script
  static async create(platform, text_content, sentiment, insight) {
    const [response] = await sql`
      INSERT INTO social_media_sentiments
        (platform, text_content, sentiment, insight)
      VALUES
        (${platform}, ${text_content}, ${sentiment}, ${insight})
      RETURNING *
    `;
    return response;
  }

  static async getAll() {
    const responses = await sql`SELECT * FROM social_media_sentiments`;
    return responses;
  }

  // For your "Mark as Resolved" button
  static async markAsResolved(id) {
    const [response] = await sql`
      UPDATE social_media_sentiments
      SET is_resolved = true
      WHERE id = ${id}
      RETURNING *
    `;
    return response;
  }
}

export default SocialMediaSentiment;