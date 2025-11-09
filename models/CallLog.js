import sql from '../db.js';

class CallLog {
  static async create(customerId, callSid) {
    const [log] = await sql`
      INSERT INTO call_logs (customer_id, call_sid)
      VALUES (${customerId}, ${callSid})
      RETURNING *
    `;
    return log;
  }

  static async findBySid(callSid) {
    const [log] = await sql`
      SELECT * FROM call_logs WHERE call_sid = ${callSid}
    `;
    return log;
  }
}

export default CallLog;