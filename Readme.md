# CommandMail Backend API

AI-powered Email Productivity Agent backend built with Node.js, Express, MongoDB, and Google Gemini AI.

## Features

*  Email ingestion and processing
*  AI-powered email categorization (Important, To-Do, Newsletter, Spam)
*  Action item extraction from emails
*  Automated reply generation
*  Intelligent email agent chat
*  Draft management
*  Customizable AI prompts

## Tech Stack

* **Runtime:** Node.js v18+
* **Framework:** Express.js
* **Database:** MongoDB (Atlas)
* **AI:** Google Gemini AI API
* **CORS:** Enabled for Vercel deployments

## Prerequisites

Before you begin, ensure you have:

* Node.js v18 or higher installed
* MongoDB Atlas account (free tier works)
* Google Gemini API key ([Get it here](https://aistudio.google.com/app/apikey))
* Git installed

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/commandmail-backend.git
cd commandmail-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
touch .env
```

Add the following variables:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/emailagent?retryWrites=true&w=majority

# Google Gemini API Key
GEMINI_API_KEY=AIzaSy...your_api_key_here

# Server Port
PORT=5000

# Environment
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

#### How to Get MongoDB URI:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password
6. Replace `<dbname>` with `emailagent`

#### How to Get Gemini API Key:

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

### 4. Initialize Default Prompts (Optional)

The app will automatically create default prompts, but you can customize them in the database.

## Running the Backend

### Development Mode (with auto-reload)

```bash
npm run dev
```

The server will start at `http://localhost:5000`

### Production Mode

```bash
npm start
```

## Testing the API

### Health Check

```bash
curl http://localhost:5000/
```

Expected response:

```json
{
  "message": "CommandMail API - Email Productivity Agent",
  "status": "running",
  "version": "1.0.0",
  "endpoints": {
    "emails": "/api/emails",
    "prompts": "/api/prompts",
    "agent": "/api/agent",
    "drafts": "/api/drafts"
  }
}
```

## API Endpoints

### Emails

* `POST /api/emails/load` - Load 20 mock emails into database
* `GET /api/emails` - Get all emails (supports filtering)
* `GET /api/emails/:id` - Get single email by ID
* `POST /api/emails/process/:id` - Process single email with AI
* `POST /api/emails/process-all` - Process all unprocessed emails
* `PUT /api/emails/:emailId/action-items/:itemIndex/toggle` - Toggle action item completion

**Example: Load Mock Inbox**

```bash
curl -X POST http://localhost:5000/api/emails/load
```

**Example: Get All Emails**

```bash
curl http://localhost:5000/api/emails
```

**Example: Process Single Email**

```bash
curl -X POST http://localhost:5000/api/emails/process/EMAIL_ID_HERE
```

### Prompts

* `GET /api/prompts` - Get all prompts
* `POST /api/prompts/initialize` - Initialize default prompts
* `POST /api/prompts` - Create/update prompt
* `PUT /api/prompts/:id` - Update specific prompt
* `DELETE /api/prompts/:id` - Delete prompt

**Example: Initialize Default Prompts**

```bash
curl -X POST http://localhost:5000/api/prompts/initialize
```

### Agent (AI Chat)

* `POST /api/agent/query` - Ask the AI agent a question
* `POST /api/agent/chat` - Chat with conversation history
* `POST /api/agent/generate-reply` - Generate reply for an email
* `POST /api/agent/summarize` - Summarize an email
* `POST /api/agent/urgent-summary` - Get summary of urgent emails

**Example: Ask Agent**

```bash
curl -X POST http://localhost:5000/api/agent/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How many urgent emails do I have?"}'
```

**Example: Generate Reply**

```bash
curl -X POST http://localhost:5000/api/agent/generate-reply \
  -H "Content-Type: application/json" \
  -d '{"emailId": "EMAIL_ID_HERE"}'
```

### Drafts

* `GET /api/drafts` - Get all drafts
* `GET /api/drafts/:id` - Get single draft
* `POST /api/drafts` - Create new draft
* `PUT /api/drafts/:id` - Update draft
* `DELETE /api/drafts/:id` - Delete draft

**Example: Create Draft**

```bash
curl -X POST http://localhost:5000/api/drafts \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Re: Meeting Request",
    "body": "Thank you for your email...",
    "emailId": "ORIGINAL_EMAIL_ID"
  }'
```

## 🔧 Configuring Prompts

The system uses three main prompts that control AI behavior:

### 1. Categorization Prompt

Controls how emails are categorized into: Important, To-Do, Newsletter, or Spam.

**Default:**

```
You are an email categorization system. Categorize the following email into EXACTLY ONE category.

Categories:
- Important: Urgent or from key stakeholders
- To-Do: Contains a direct request requiring user action
- Newsletter: Marketing or informational content
- Spam: Unsolicited or suspicious content

Respond with ONLY ONE WORD - the category name. No explanation, no punctuation, just the category.
```

### 2. Action Item Extraction Prompt

Extracts tasks and deadlines from emails.

**Default:**

```
Extract actionable tasks from the email below.

Return ONLY a valid JSON array in this exact format:
[{"task": "description of task", "deadline": "date or null"}]

If no tasks exist, return: []

Do not include any markdown formatting, code blocks, or explanations. Only return the JSON array.
```

### 3. Auto-Reply Prompt

Generates professional email replies.

**Default:**

```
You are drafting a professional email reply.

Instructions:
- If it's a meeting request, ask for an agenda
- Keep tone polite and concise
- Be professional but friendly
- Include appropriate greeting and closing

Draft the complete email reply:
```

### Customizing Prompts via API

```bash
# Update categorization prompt
curl -X PUT http://localhost:5000/api/prompts/PROMPT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Your custom prompt here..."
  }'
```

## Usage Examples

### Complete Workflow Example

```bash
# 1. Initialize prompts
curl -X POST http://localhost:5000/api/prompts/initialize

# 2. Load mock emails
curl -X POST http://localhost:5000/api/emails/load

# 3. Get all emails
curl http://localhost:5000/api/emails

# 4. Process all emails (takes ~30 seconds)
curl -X POST http://localhost:5000/api/emails/process-all

# 5. Ask agent about urgent emails
curl -X POST http://localhost:5000/api/agent/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me all urgent emails"}'

# 6. Generate reply for an email
curl -X POST http://localhost:5000/api/agent/generate-reply \
  -H "Content-Type: application/json" \
  -d '{"emailId": "EMAIL_ID_FROM_STEP_3"}'

# 7. Create draft
curl -X POST http://localhost:5000/api/drafts \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Re: Meeting",
    "body": "Thanks for reaching out...",
    "emailId": "EMAIL_ID"
  }'
```

## Troubleshooting

### MongoDB Connection Issues

**Error:** `MongoServerError: bad auth`

* Check username and password in connection string
* Verify database user has read/write permissions

**Error:** `MongooseServerSelectionError: connect ETIMEDOUT`

* Whitelist your IP address in MongoDB Atlas (Network Access)
* Check if connection string is correct

### Gemini API Issues

**Error:** `API_KEY_INVALID`

* Verify API key is correct in `.env`
* Check if API key is active in Google AI Studio

**Error:** `Model not found`

* Update `llmService.js` to use a valid model name
* Current working models: `gemini-1.5-flash`, `gemini-1.5-pro`

### Server Won't Start

**Error:** `Port 5000 is already in use`

```bash
# Kill process on port 5000
# Mac/Linux:
lsof -ti:5000 | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

## Project Structure

```
backend/
├── models/           # MongoDB schemas
│   ├── Email.js
│   ├── Prompt.js
│   └── Draft.js
├── routes/           # API routes
│   ├── emails.js
│   ├── prompts.js
│   ├── agent.js
│   └── drafts.js
├── services/         # Business logic
│   ├── llmService.js
│   └── emailProcessor.js
├── data/             # Mock data
│   └── mockInbox.json
├── server.js         # Entry point
├── .env              # Environment variables
└── package.json      # Dependencies
```

## Deployment

### Deploy to Render.com

1. Push code to GitHub
2. Go to [Render.com](https://render.com)
3. Create new "Web Service"
4. Connect GitHub repository
5. Configure:

   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
6. Add environment variables (MONGODB_URI, GEMINI_API_KEY)
7. Deploy!

**Live Backend:** [https://commandmail-backend.onrender.com](https://commandmail-backend.onrender.com)

## Environment Variables Reference

| Variable         | Description               | Required | Example                 |
| ---------------- | ------------------------- | -------- | ----------------------- |
| `MONGODB_URI`    | MongoDB connection string | Yes      | `mongodb+srv://...`     |
| `GEMINI_API_KEY` | Google Gemini API key     | Yes      | `AIzaSy...`             |
| `PORT`           | Server port               | No       | `5000`                  |
| `NODE_ENV`       | Environment mode          | No       | `development`           |
| `FRONTEND_URL`   | Frontend URL for CORS     | No       | `http://localhost:5173` |

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Author

Ayush Gupta

## Acknowledgments

* Google Gemini AI for powerful language models
* MongoDB Atlas for database hosting
* Express.js community
