import { Resend } from 'resend';

class NotificationService {
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  /**
   * Sends a low-sentiment alert to a list of user emails.
   * @param {string[]} userEmails - Array of email addresses to notify.
   * @param {number} sentimentPercentage - The failing sentiment score (e.g., 0.68).
   */
  async sendSentimentAlert(userEmails, sentimentPercentage) {
    const percentageString = (sentimentPercentage * 100).toFixed(1);

    try {
      await this.resend.emails.send({
        // THE FIX: Use your verified domain
        from: 'Alerts <alert@notifications.tmoodbile.biz>', 
        
        // Resend handles arrays for the 'to' field, sending one email per address
        to: userEmails, 
        
        subject: `🚨 SENTIMENT ALERT: T-Mobile sentiment has dropped to ${percentageString}%`,
        html: `
          <div>
            <h1>T-Mobile System Alert</h1>
            <p>This is an automated notification. The overall "good" sentiment across all channels has fallen to <strong>${percentageString}%</strong>, which is below the 70% threshold.</p>
            <p>Please log in to the dashboard to review recent feedback.</p>
          </div>
        `,
      });
      console.log(`Sentiment alert email sent to ${userEmails.length} users via Resend.`);
    } catch (error) {
      console.error('Failed to send email via Resend:', error);
    }
  }
}

export default NotificationService;