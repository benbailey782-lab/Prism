# Prism

Personal learning and insights engine for sales professionals. Transform call transcripts into searchable institutional memory.

## Features

- **Transcript Ingestion**: Drop .txt, .md, or .json files into the watch folder
- **AI Segmentation**: Automatically segments transcripts into logical chunks with knowledge type tagging
- **Knowledge Browser**: Browse and search through all extracted knowledge
- **Deal Tracking**: Track opportunities with MEDDPICC scorecards
- **People Management**: Maintain contacts and relationships
- **Self-Coaching**: Talk ratio, strong moments, and improvement areas

## Quick Start

### Prerequisites

- Node.js 18+
- Ollama (for AI processing)

### Setup

```bash
# 1. Install dependencies
npm install
cd src/ui && npm install && cd ../..

# 2. Create environment file
cp .env.example .env

# 3. Start Ollama (in a separate terminal)
ollama serve

# 4. Pull the model
ollama pull llama3.1:8b

# 5. Initialize database
npm run db:init

# 6. Start the application
npm run dev
```

### Usage

1. Open http://localhost:3000 in your browser
2. Drop transcript files into the `./transcripts` folder
3. Files are automatically processed and segmented
4. Browse knowledge, track deals, and manage contacts

## Tech Stack

| Component | Technology |
|-----------|------------|
| Database | SQLite (better-sqlite3) |
| Backend | Node.js + Express |
| Frontend | React 18 + Vite + Tailwind CSS |
| AI | Ollama (llama3.1:8b) |
| File Watching | Chokidar |

## Project Structure

```
prism/
├── data/                   # SQLite database
├── transcripts/            # Watch folder (drop files here)
├── src/
│   ├── server.js           # Express API server
│   ├── db/
│   │   ├── schema.js       # Database tables
│   │   └── queries.js      # Query functions
│   ├── ingestion/
│   │   ├── watcher.js      # File watcher
│   │   └── parser.js       # Transcript parser
│   ├── processing/
│   │   └── processor.js    # AI processing
│   └── ui/                 # React frontend
```

## API Endpoints

### Health & Stats
- `GET /api/health` - Health check with AI status
- `GET /api/stats` - Aggregate statistics

### Transcripts
- `GET /api/transcripts` - List all transcripts
- `GET /api/transcripts/:id` - Get transcript details
- `GET /api/transcripts/:id/segments` - Get transcript segments
- `POST /api/transcripts/:id/process` - Reprocess with AI
- `DELETE /api/transcripts/:id` - Delete transcript

### Segments
- `GET /api/segments` - List segments (filterable)
- `GET /api/segments/:id` - Get segment with tags
- `GET /api/segments/search?q=query` - Search segments

### Deals
- `GET /api/deals` - List all deals
- `POST /api/deals` - Create deal
- `GET /api/deals/:id` - Get deal with MEDDPICC
- `PUT /api/deals/:id` - Update deal
- `PUT /api/deals/:id/meddpicc/:letter` - Update MEDDPICC letter

### People
- `GET /api/people` - List people (filterable by relationship_type)
- `POST /api/people` - Create person
- `GET /api/people/:id` - Get person
- `PUT /api/people/:id` - Update person

## Knowledge Types

- `product_knowledge` - Features, capabilities, how things work
- `process_knowledge` - Company procedures, internal processes
- `people_context` - Information about people, roles, relationships
- `sales_insight` - Prospect info, objections, deal discussion
- `advice_received` - Direct guidance from colleagues/mentors
- `decision_rationale` - Why decisions were made
- `competitive_intel` - Information about competitors
- `small_talk` - Casual conversation, greetings
- `unknown` - Cannot be categorized

## License

MIT
