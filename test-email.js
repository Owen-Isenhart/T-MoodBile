import 'dotenv/config'; // Load .env variables
import NotificationService from './services/NotificationService.js';

// --- IMPORTANT ---
// Set this to your personal email (or any email you can check)
// Since your domain is verified, you can send to ANY address.
const TEST_EMAIL_TO_RECEIVE = "oisenhart.college@gmail.com";
// ---

async function runEmailTest() {
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ Error: RESEND_API_KEY is not set in your .env file.");
    return;
  }
  
  console.log("Initializing Resend email test...");
  
  const notificationService = new NotificationService();
  const testEmails = [TEST_EMAIL_TO_RECEIVE];
  const testSentiment = 0.55; // A failing score

  try {
    console.log(`Sending test email to ${TEST_EMAIL_TO_RECEIVE} via Resend...`);
    
    await notificationService.sendSentimentAlert(testEmails, testSentiment);
    
    console.log("\n✅ Success! Test email sent via Resend.");
    console.log("Check your inbox (and spam folder) for the alert.");

  } catch (error) {
    console.error("\n❌ Error sending email:", error);
  }
}

// Run the test
runEmailTest();