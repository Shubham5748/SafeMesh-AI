import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Initialize Twilio client if credentials are provided
let twilioClient = null;
let isSimulationMode = true;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    isSimulationMode = false;
    console.log('Twilio client initialized.');
  } catch (err) {
    console.error('Failed to initialize Twilio client:', err);
  }
} else {
  console.log('Twilio credentials missing. Running in SIMULATION MODE.');
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', simulationMode: isSimulationMode });
});

app.post('/api/emergency', async (req, res) => {
  const { contacts, reason, userName, location } = req.body;

  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({ error: 'No emergency contacts provided' });
  }

  const name = userName || 'User';
  const emergencyReason = reason || 'Unknown emergency';
  
  let locString = 'Location unavailable.';
  if (location && location.latitude && location.longitude) {
    locString = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  }

  const smsMessage = `🚨 SAFEMESH AI SOS\nEmergency detected for ${name}\nType: ${emergencyReason}\nLocation: ${locString}\nPlease check on them immediately.`;

  let spokenLoc = 'Location unavailable.';
  if (location && location.latitude && location.longitude) {
    spokenLoc = `at latitude ${Number(location.latitude).toFixed(3)} and longitude ${Number(location.longitude).toFixed(3)}`;
  }

  const twimlCall = `<Response><Say voice="alice">Emergency alert from SafeMesh A I. An emergency was detected for ${name}. Reason: ${emergencyReason}. User is located ${spokenLoc}. Please check on them immediately.</Say></Response>`;

  const results = [];
  let smsSent = 0;
  let callsSent = 0;

  if (isSimulationMode) {
    console.log('--- SIMULATION MODE: SOS DISPATCHED ---');
    console.log(`Reason: ${emergencyReason}`);
    console.log(`User: ${name}`);
    console.log(`Location: ${locString}`);
    console.log(`Contacts to notify: ${contacts.map(c => c.phone).join(', ')}`);
    console.log(`SMS Content:\n${smsMessage}`);
    
    for (const contact of contacts) {
      results.push({
        name: contact.name,
        phone: contact.phone,
        smsSID: 'SIMULATED_SMS_SID',
        callSID: 'SIMULATED_CALL_SID',
        error: null
      });
      smsSent++;
      callsSent++;
    }

    return res.json({
      success: true,
      simulated: true,
      smsSent,
      callsSent,
      location: !!location,
      results
    });
  }

  // Real Twilio Dispatch
  for (const contact of contacts) {
    let phone = contact.phone.replace(/[^0-9+]/g, '');
    if (phone.length === 10) {
      phone = `+91${phone}`; // Assume India if 10 digits
    }
    const result = { name: contact.name, phone, error: null };

    try {
      const smsRes = await twilioClient.messages.create({
        body: smsMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });
      result.smsSID = smsRes.sid;
      smsSent++;
    } catch (err) {
      console.error(`SMS failed for ${phone}:`, err.message);
      result.error = (result.error || '') + 'SMS failed. ';
    }

    try {
      const callRes = await twilioClient.calls.create({
        url: process.env.TWILIO_TWIML_URL || 'http://demo.twilio.com/docs/voice.xml',
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });
      result.callSID = callRes.sid;
      callsSent++;
    } catch (err) {
      console.error(`Call failed for ${phone}:`, err.message);
      result.error = (result.error || '') + 'Call failed.';
    }

    results.push(result);
  }

  res.json({
    success: true,
    simulated: false,
    smsSent,
    callsSent,
    location: !!location,
    results
  });
});

app.listen(PORT, () => {
  console.log(`SafeMesh AI Backend running on port ${PORT}`);
});
