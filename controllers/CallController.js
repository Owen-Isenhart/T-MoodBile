import CallService from '../services/CallService.js';
import Customer from '../models/Customer.js';
import CallLog from '../models/CallLog.js'; // New model to track calls

const callService = new CallService();

async function callCustomer(req, res) {
  try {
    const { customerId } = req.params;
    const customer = (await Customer.getAll()).find(c => c.id === parseInt(customerId));
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // This is the URL Twilio will request to get TwiML instructions
    // We pass customerId so the TwiML endpoint knows who it's calling
    const twimlUrl = `${process.env.BASE_URL}/api/twilio/twiml/${customerId}`;

    // Make the call
    const callSid = await callService.makeCall(customer.phone, twimlUrl);

    // Log the call so we can link the CallSid to the customer later
    await CallLog.create(customer.id, callSid);

    res.json({ message: 'Call initiated successfully', callSid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to initiate call' });
  }
}

export { callCustomer };