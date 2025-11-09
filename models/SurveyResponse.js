import sql from '../db.js';

class SurveyResponse {
  static async create(customerId, transcript, sentiment, insight) {
    const [response] = await sql`
      INSERT INTO survey_responses 
        (customer_id, transcript, sentiment, insight)
      VALUES 
        (${customerId}, ${transcript}, ${sentiment}, ${insight}) 
      RETURNING *
    `;
    return response;
  }

  static async getAll() {
    const responses = await sql`SELECT * FROM survey_responses`;
    return responses;
  }

  static async markAsResolved(id) {
    const [response] = await sql`
      UPDATE survey_responses
      SET is_resolved = true
      WHERE id = ${id}
      RETURNING *
    `;
    return response;
  }
}

export default SurveyResponse;
