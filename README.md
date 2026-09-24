# InterviewGenie

AI-powered mock interview platform built with the MERN stack and Google Gemini AI.

## Features

* AI-generated interview questions based on role and preparation requirements
* Structured interview preparation sessions
* AI-powered Mock Interview mode
* One-question-at-a-time interview experience
* AI evaluation with feedback on submitted answers
* Dashboard to manage interview sessions and preparation
* Markdown support for structured AI responses
* Responsive and interactive React interface

## Tech Stack

**Frontend**

* React.js
* Vite
* Tailwind CSS
* React Router
* Axios
* Framer Motion

**Backend**

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* Multer

**AI**

* Google Gemini API

## Project Structure

```text
InterviewGenie/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   └── server.js
│
└── frontend/
    └── interview-genie/
        └── src/
            ├── components/
            ├── context/
            ├── pages/
            └── App.jsx
```

## Getting Started

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend/interview-genie
npm install
npm run dev
```

Create a `.env` file in the backend and configure the required MongoDB, JWT, and Gemini API credentials.

## Author

**Arpita Maurya**
