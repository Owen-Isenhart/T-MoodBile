import Twilio from 'twilio';

class CallService {
  constructor() {
    this.client = new Twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    this.fromPhone = process.env.TWILIO_PHONE_NUMBER;
  }

  async makeCall(toPhone, twimlUrl) {
    const call = await this.client.calls.create({
      url: twimlUrl, // Twilio will fetch instructions from this URL
      to: toPhone,
      from: this.fromPhone,
    });

    console.log(`Call initiated to ${toPhone}, SID: ${call.sid}`);
    return call.sid;
  }

  // This function is no longer used in the main flow,
  // but it's fine to keep for debugging.
  async getRecordingUrl(callSid) {
    const recordings = await this.client.recordings.list({ callSid, limit: 1 });
    if (recordings.length > 0) {
      return recordings[0].uri;
    }
    return null;
  }
}

export default CallService;