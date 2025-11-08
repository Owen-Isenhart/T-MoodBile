import Twilio from 'twilio';
import fs from 'fs';
import path from 'path';

class CallService {
  constructor() {
    this.client = new Twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    this.fromPhone = process.env.TWILIO_PHONE_NUMBER; // your Twilio number
  }

  async makeCall(toPhone, promptFile) {
    // Convert audio file to URL or host it somewhere accessible to Twilio
    // For hackathon, we can use TwiML Bin or a temporary public URL

    // For simplicity, we'll assume we have a URL for Twilio to play
    const twimlUrl = process.env.TWIML_PROMPT_URL; // could host on S3

    const call = await this.client.calls.create({
      url: twimlUrl, // Twilio will fetch this XML to play prompt + record
      to: toPhone,
      from: this.fromPhone,
      record: true,  // record the customer response
    });

    // Wait until call completes (or use webhook)
    // For hackathon, we can simulate wait
    console.log(`Call initiated to ${toPhone}, SID: ${call.sid}`);
    
    // Twilio will store recording URL; fetch it after call ends
    return call.sid;
  }

  async getRecordingUrl(callSid) {
    // Fetch recordings for a specific call
    const recordings = await this.client.recordings.list({ callSid });
    if (recordings.length > 0) {
      return recordings[0].mediaUrl; // URL to audio
    }
    return null;
  }
}

export default CallService;
