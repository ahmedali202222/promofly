Promofly
Promofly is a promotional campaign management app with real-time status updates and automated email notifications.
Built with React, Vite, and TailwindCSS for the frontend, and Firebase Functions for backend automation.

Features
React + Vite powered frontend with routing and charts (Recharts)

Firebase Functions backend to send status update emails triggered by Firestore changes

Email sending via Resend API integration

TailwindCSS for styling

Firebase Emulator support for local development

Project Structure
bash
Copy
Edit
promofly/
├── functions/          # Firebase Functions backend code  
├── public/             # Static assets for frontend  
├── src/                # React frontend source code  
├── package.json        # Project configuration & scripts  
├── vite.config.js      # Vite configuration  
└── README.md           # This file  
Getting Started
Prerequisites
Node.js v18 or higher

npm

Firebase CLI (npm install -g firebase-tools)

Firebase project with Firestore enabled

Resend API key for sending emails

Installation
Clone the repo

bash
Copy
Edit
git clone https://github.com/yourusername/promofly.git
cd promofly
Install frontend dependencies

bash
Copy
Edit
npm install
Install backend dependencies

bash
Copy
Edit
cd functions
npm install
cd ..
Add your Resend API key in functions/index.js

js
Copy
Edit
const resend = new Resend("YOUR_RESEND_API_KEY_HERE");
Login to Firebase and select your project

bash
Copy
Edit
firebase login
firebase use your-project-id
Running Locally
Start the Firebase Functions shell:

bash
Copy
Edit
npm run shell
Start the frontend development server:

bash
Copy
Edit
npm run dev
Open http://localhost:5173 in your browser.

Deployment
Deploy Firebase Functions:

bash
Copy
Edit
npm run deploy
(Optional) Deploy frontend to Firebase Hosting:

bash
Copy
Edit
firebase deploy --only hosting
Useful Commands
Command	Description
npm run dev	Start frontend dev server (Vite)
npm run shell	Start Firebase Functions shell
npm run deploy	Deploy Firebase Functions
firebase emulators:start	Start Firebase emulators locally

Technologies Used
React

Vite

Tailwind CSS

Firebase Functions

Firestore

Resend API

License
MIT © Promofly

