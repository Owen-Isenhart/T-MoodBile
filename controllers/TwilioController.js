import Twilio from 'twilio';
import TTSService from '../services/TTSService.js';
import AiAnalysisService from '../services/AiAnalysisService.js';
import SurveyResponse from '../models/SurveyResponse.js';
import CallLog from '../models/CallLog.js';
import Customer from '../models/Customer.js';

const ttsService = new TTSService(process.env.ELEVENLABS_KEY);
const transcriptionService = new AiAnalysisService();

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

    const callLog = await CallLog.findBySid(CallSid);
    if (!callLog) {
      console.error(`Could not find CallLog for CallSid: ${CallSid}`);
      return res.sendStatus(404);
    }
    const customerId = callLog.customer_id;

    // --- Step 1: Transcribe the audio ---
    const transcript = await transcriptionService.transcribeAudio(RecordingUrl);
    if (!transcript) {
      console.log(`Empty transcript for CallSid: ${CallSid}`);
      return res.sendStatus(200); // Acknowledge webhook
    }

    // --- Step 2: Analyze sentiment ---
    const sentiment = await transcriptionService.analyzeSentiment(transcript);

    // --- Step 3 (NEW): Generate insights if needed ---
    let insight = null; // Default to null (for 'good' sentiment)

    if (sentiment === 'bad' || sentiment === 'neutral') {
      console.log(`Sentiment is ${sentiment}, generating improvement insight...`);
      insight = await transcriptionService.generateImprovementInsight(transcript, sentiment);
    } else {
      console.log("Sentiment is 'good', no insight needed.");
    }

    // --- Step 4 (Updated): Save everything to DB ---
    await SurveyResponse.create(customerId, transcript, sentiment, insight);

    res.sendStatus(200); // Success!
  } catch (err) {
    console.error('Error in recording webhook:', err);
    res.sendStatus(500);
  }
}

export { generateTwiML, handleRecordingWebhook };