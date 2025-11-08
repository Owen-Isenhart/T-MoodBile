import TTSService from '../services/TTSService.js';
import CallService from '../services/CallService.js';
import TranscriptionService from '../services/TranscriptionService.js';
import Customer from '../models/Customer.js';
import SurveyResponse from '../models/SurveyResponse.js';

const ttsService = new TTSService(process.env.ELEVENLABS_KEY);
const callService = new CallService();
const transcriptionService = new TranscriptionService(process.env.GEMINI_KEY);

async function callCustomer(req, res) {
  try {
    const { customerId } = req.params;
    const customer = (await Customer.getAll()).find(c => c.id === parseInt(customerId));
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Generate TTS prompt
    const promptFile = await ttsService.generateVoice(
      "Our records indicate that you are currently a T-Mobile customer. Can you please describe how your experience has been?"
    );

    // Make the call
    const callSid = await callService.makeCall(customer.phone, promptFile);

    // Fetch recording URL from Twilio
    const recordingUrl = await callService.getRecordingUrl(callSid);

    // Transcribe customer response
    const transcript = await transcriptionService.transcribeAudio(recordingUrl);

    // Analyze sentiment
    const sentiment = await transcriptionService.analyzeSentiment(transcript);

    // Save to DB
    const saved = await SurveyResponse.create(customer.id, transcript, sentiment);

    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete call' });
  }
}

export { callCustomer };
