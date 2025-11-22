# Email Productivity Agent - Backend

## Environment Variables

Create a `.env` file with:
```env
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
NODE_ENV=production
```

## Installation
```bash
npm install
```

## Running
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

- `GET /` - Health check
- `POST /api/emails/load` - Load mock inbox
- `GET /api/emails` - Get all emails
- `POST /api/emails/process-all` - Process all emails
- `POST /api/prompts/initialize` - Initialize default prompts
- `POST /api/agent/query` - Chat with AI agent
- `POST /api/drafts` - Create draft