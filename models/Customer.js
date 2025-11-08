import sql from '../db.js';

class Customer {
  static async getAll() {
    const customers = await sql`SELECT * FROM customers`;
    return customers;
  }

  static async create(name, phone) {
    const [customer] = await sql`
      INSERT INTO customers (name, phone) 
      VALUES (${name}, ${phone}) 
      RETURNING *
    `;
    return customer;
  }
}

export default Customer;
