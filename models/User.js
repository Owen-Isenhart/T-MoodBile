import sql from '../db.js';

class User {
  static async getAll() {
    // Fetches all T-Mobile employees
    const users = await sql`SELECT * FROM users`;
    return users;
  }
}

export default User;