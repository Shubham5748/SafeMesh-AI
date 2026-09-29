# SafeMesh AI

SafeMesh AI is an emergency safety prototype built with React, Vite, and Express. It features real-time fall detection using device motion sensors, voice distress detection, and an emergency dispatch system via Twilio.

## Setup Instructions

### 1. Install Dependencies
Make sure you have Node.js installed.
Run the following command to install both frontend and backend dependencies:
```bash
npm install
```

### 2. Configure Twilio (Optional, for real SMS & Calls)
Create a `.env` file in the root directory and add your Twilio credentials:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```
*Note: If these credentials are not provided, the backend will run in **Simulation Mode**, logging the SOS dispatches to the console without making actual API calls.*

### 3. Start the Backend Server
Run the Express server to handle SOS requests:
```bash
npm run start:backend
```
The server will start on `http://localhost:3001`.

### 4. Start the Frontend
In a new terminal window, run the Vite development server:
```bash
npm run dev
```
Open the provided local URL (usually `http://localhost:5173`) in your browser (preferably on a mobile device to test motion sensors).

## Features Implemented
- **Real Fall Detection**: Uses `DeviceMotionEvent` to calculate acceleration magnitude and detect high-impact events followed by stillness.
- **Voice Distress Detection**: Listens for distress keywords (`help`, `emergency`, `bachao`, etc.) using the browser's `SpeechRecognition` API.
- **Emergency Verification**: A 10-second countdown gives the user time to cancel false alarms.
- **GPS Location**: Fetches high-accuracy coordinates when an SOS is dispatched.
- **Emergency Contacts**: Add and manage real contacts via the Profile > Contacts screen (saved locally).
- **Twilio Integration**: Dispatches SMS and automated phone calls to all configured emergency contacts.
