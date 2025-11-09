import Twilio from 'twilio';
import TTSService from '../services/TTSService.js';
import TranscriptionService from '../services/TranscriptionService.js';
import SurveyResponse from '../models/SurveyResponse.js';
import CallLog from '../models/CallLog.js';
import Customer from '../models/Customer.js';

const ttsService = new TTSService(process.env.ELEVENLABS_KEY);
const transcriptionService = new TranscriptionService();

// 1. Generate TwiML instructions for Twilio
async function generateTwiML(req, res) {
  try {
    const { customerId } = req.params;
    const customer = await Customer.getById(parseInt(customerId)); // Assumes getById exists
    
    const promptText = `Hi ${customer.name}, this is T-Mobile. Our records indicate that you are currently a T-Mobile customer. Can you please describe how your experience has been?`;

    // Generate audio and get a public URL
    const promptUrl = await ttsService.generateVoice(promptText, customerId);

    const twiml = new Twilio.twiml.VoiceResponse();
    
    // Play the generated audio prompt
    twiml.play(promptUrl);

    // Record the customer's response
    twiml.record({
      action: `${process.env.BASE_URL}/api/twilio/recording-webhook`, // Send recording to this URL
      method: 'POST',
      maxLength: 60,
      finishOnKey: '#',
    });

    // Hang up if they don't say anything
    twiml.hangup();

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (err) {
    console.error(err);
    res.status(500).type('text/xml').send('<Response><Hangup/></Response>');
  }
}

// 2. Handle the finished recording from Twilio
async function handleRecordingWebhook(req, res) {
  try {
    const { RecordingUrl, CallSid } = req.body;
    if (!RecordingUrl) {
      return res.status(400).json({ error: 'No RecordingUrl provided.' });
    }

    // Find which customer this call belonged to
    const callLog = await CallLog.findBySid(CallSid);
    if (!callLog) {
      console.error(`Could not find CallLog for CallSid: ${CallSid}`);
      return res.sendStatus(404);
    }
    const customerId = callLog.customer_id;

    // Transcribe the audio
    const transcript = await transcriptionService.transcribeAudio(RecordingUrl);
    if (!transcript) {
      console.log(`Empty transcript for CallSid: ${CallSid}`);
      return res.sendStatus(200); // Acknowledge webhook
    }

    // Analyze sentiment with Gemini
    const sentiment = await transcriptionService.analyzeSentiment(transcript);

    // Save to DB
    await SurveyResponse.create(customerId, transcript, sentiment);

    res.sendStatus(200); // Success!
  } catch (err) {
    console.error('Error in recording webhook:', err);
    res.sendStatus(500);
  }
}

export { generateTwiML, handleRecordingWebhook };