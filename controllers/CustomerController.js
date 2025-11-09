import Customer from '../models/Customer.js';

async function getOrCreateCustomer(req, res) {
  try {
    const { name, phone } = req.body || {};
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'phone is required' });
    }
    const safeName = name && typeof name === 'string' ? name : 'Unknown';
    const customer = await Customer.getOrCreateByPhone(safeName, phone);
    return res.json(customer);
  } catch (err) {
    console.error('getOrCreateCustomer error:', err);
    return res.status(500).json({ error: 'Failed to upsert customer' });
  }
}

export { getOrCreateCustomer };


