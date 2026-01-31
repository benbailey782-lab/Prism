# Sales Brain - Project Handoff Document

## Overview

**Sales Brain** is a personal learning and insights engine for sales professionals. It transforms call transcripts into searchable institutional memory with precomputed intelligence.

**Owner:** Ben (Territory Sales Manager transitioning to Founder AE role)

**Primary Use Case:** Record all sales calls with Plaud Note Pro, feed transcripts into this system, and build an intelligent knowledge base for rapid skill development and pattern recognition.

---

## What This System IS

1. **Self-Coaching Tool** — Track talk ratios, improvement areas, strong moments, discovery questions
2. **Knowledge Accumulation** — Product info, company processes, competitor intel learned from conversations
3. **People & Context Memory** — "What did James tell me about X?" indexed and searchable
4. **Sales Intelligence** — MEDDPICC tracking across deals, objection patterns, what's working

## What This System IS NOT

- Not a CRM
- Not pipeline/deal management
- Not contact management
- Not task/follow-up reminders

---

## Key Design Decisions

### 1. Segment-Level Tagging
A single transcript is NOT a single thing. A 45-minute call might contain:
- Product knowledge discussion
- Advice from a colleague
- Deal-specific sales insight
- Internal process explanation

Each segment gets tagged independently with its own knowledge type, enabling precise retrieval.

### 2. Knowledge Types
```
product_knowledge  — Features, capabilities, how things work
process_knowledge  — Company procedures, how things are done internally
people_context     — Information about people, roles, relationships
sales_insight      — Prospect information, objections, deal-related discussion
advice_received    — Direct guidance or recommendations from others
decision_rationale — Explanations for why decisions were made
small_talk         — Casual conversation, greetings, off-topic
unknown            — Cannot be categorized
```

### 3. Precomputed Intelligence (NOT YET IMPLEMENTED)
The system should NOT analyze from scratch on every query. Instead:
- Background processor continuously updates indices when new transcripts arrive
- Query time = fast retrieval from precomputed structures
- Entities maintained: Deals, People, Products, Patterns, Objections, Processes, Advice, Topics

### 4. Query Interface Vision
User types natural language queries like:
- "Which letters in MEDDPICC have been identified for the Acme Corp deal?"
- "What did James tell me about handling procurement?"
- "Show me my objection handling trends"
- "How does our platform handle SSO?"

System returns synthesized answers with dynamic visualizations and source citations.

---

## Current State (Phase 1 - Partially Complete)

### Completed
- ✅ Database schema (SQLite)
- ✅ Folder watcher service
- ✅ Transcript ingestion pipeline
- ✅ File parsing (txt, md, json)
- ✅ Segmentation logic (stubbed without API key, full implementation with Claude)
- ✅ Express API server
- ✅ React frontend (partially complete)

### In Progress / Incomplete
- ⚠️ SegmentBrowser component was cut off mid-creation
- ⚠️ StatsPanel component not created
- ❌ No Anthropic API key configured yet

### Not Started (Future Phases)
- Phase 2: Entity extraction (deals, people, products)
- Phase 3: Precomputed indices, background processor
- Phase 4: Query interface with Claude
- Phase 5: Dynamic visualizations
- Phase 6: Google Drive integration

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              CONTINUOUS BACKGROUND PROCESSOR            │
│  - Watches for new transcripts                          │
│  - Segments & tags                                      │
│  - Updates all entity profiles                          │
│  - Precomputes metrics                                  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              PRECOMPUTED INTELLIGENCE LAYER             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │  Deals  │ │ People  │ │ Product │ │ Patterns│       │
│  │Profiles │ │ Index   │ │Knowledge│ │& Metrics│       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │Objection│ │ Process │ │ Advice  │ │ Topic   │       │
│  │ Library │ │  Index  │ │  Index  │ │  Graph  │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    QUERY INTERFACE                      │
│  - Retrieves from precomputed structures                │
│  - Claude synthesizes response (fast, focused)          │
│  - Renders visualizations from cached metrics           │
│  - Instant responses                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Database | SQLite (better-sqlite3) |
| Backend | Node.js + Express |
| Frontend | React + Vite + Tailwind |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| File Watching | Chokidar |
| Future: Vector Search | Planned (pgvector or similar) |

---

## Project Structure

```
sales-brain/
├── README.md
├── package.json
├── .env.example
├── .gitignore
├── transcripts/           # Drop transcripts here (watched folder)
├── data/                  # SQLite database lives here
└── src/
    ├── server.js          # Express API server + watcher startup
    ├── db/
    │   ├── schema.js      # Database tables and initialization
    │   ├── queries.js     # All database query functions
    │   └── init.js        # CLI script to initialize DB
    ├── ingestion/
    │   ├── parser.js      # Parse txt/md/json transcripts
    │   └── watcher.js     # Chokidar file watcher
    ├── processing/
    │   └── processor.js   # AI segmentation and analysis (Claude)
    └── ui/
        ├── package.json
        ├── vite.config.js
        ├── tailwind.config.js
        ├── postcss.config.js
        ├── index.html
        └── src/
            ├── main.jsx
            ├── index.css
            ├── App.jsx
            └── components/
                ├── TranscriptList.jsx
                ├── TranscriptDetail.jsx
                ├── SegmentBrowser.jsx  # INCOMPLETE
                └── StatsPanel.jsx      # NOT CREATED
```

---

## Database Schema

### Core Tables
- **transcripts** — Raw source files with metadata
- **segments** — Chunks of transcripts tagged by knowledge type
- **segment_tags** — Multiple tags per segment

### Entity Tables
- **people** — Colleagues, prospects, anyone mentioned
- **deals** — Tracked opportunities
- **deal_meddpicc** — MEDDPICC tracking per deal
- **product_knowledge** — What you've learned about your product
- **objections** — Library of objections encountered
- **objection_responses** — How you've handled each objection

### Relationship Tables
- **segment_people** — Links segments to people mentioned
- **segment_deals** — Links segments to deals

### Metrics Tables
- **transcript_metrics** — Talk ratio, strong moments, etc. per transcript
- **computed_patterns** — Aggregated patterns (rebuilt periodically)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check, AI status |
| GET | /api/stats | Overall statistics |
| GET | /api/transcripts | List all transcripts |
| GET | /api/transcripts/:id | Get single transcript |
| GET | /api/transcripts/:id/segments | Get transcript segments |
| GET | /api/transcripts/:id/metrics | Get transcript metrics |
| POST | /api/transcripts/:id/process | Reprocess with AI |
| GET | /api/segments | List segments (filterable) |
| GET | /api/segments/:id/tags | Get segment tags |
| GET | /api/people | List all people |
| POST | /api/people | Create person |
| GET | /api/deals | List all deals |
| POST | /api/deals | Create deal |
| GET | /api/deals/:id/meddpicc | Get MEDDPICC for deal |

---

## Setup Instructions

```bash
# 1. Clone/navigate to project
cd sales-brain

# 2. Install backend dependencies
npm install

# 3. Install frontend dependencies
cd src/ui && npm install && cd ../..

# 4. Create environment file
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 5. Initialize database
npm run db:init

# 6. Start the application
npm run dev
# This runs both backend (port 3001) and frontend (port 3000)

# 7. Drop transcript files into ./transcripts folder
```

---

## Environment Variables

```
ANTHROPIC_API_KEY=     # Required for AI processing
WATCH_FOLDER=./transcripts
PORT=3001
DB_PATH=./data/sales-brain.db
```

---

## Immediate Next Steps

1. **Complete SegmentBrowser.jsx** — Was cut off, needs closing tags and full implementation
2. **Create StatsPanel.jsx** — Dashboard showing aggregate metrics
3. **Get Anthropic API key** — Required for any AI processing
4. **Test end-to-end** — Drop a real Plaud transcript and verify flow

---

## Future Phases

### Phase 2: Entity Extraction
- Automatically identify deals, people, products from segments
- Build relationship graph
- Create entity profiles

### Phase 3: Background Processor
- Scheduled jobs that continuously update indices
- Pattern detection across all data
- Proactive insights ("You haven't identified economic buyer in 3 deals")

### Phase 4: Query Interface
- Natural language prompt box
- Claude synthesizes from precomputed data
- Source citations with links to specific segments

### Phase 5: Dynamic Visualizations
- MEDDPICC scorecards
- Objection frequency charts
- Talk ratio trends
- Topic clouds
- Deal health indicators

### Phase 6: Google Drive Integration
- Watch a Google Drive folder instead of local
- Auto-sync new Plaud exports
- Workspace separation per job/company

---

## Example Queries (Vision)

These are the types of queries the final system should handle:

```
"Which letters in MEDDPICC have been identified for Acme Corp?"
→ Returns visual scorecard with evidence and source links

"What did James tell me about handling procurement?"
→ Pulls from advice_received index, attributes to James

"What patterns do I see in calls where prospects went cold?"
→ Analyzes across deals, surfaces common factors

"Build me an objection handling playbook"
→ Clusters all objections, shows your responses, rates effectiveness

"How does our platform handle SSO?"
→ Returns accumulated product knowledge from all conversations

"Show me my talk ratio trend over the last month"
→ Renders chart from precomputed metrics
```

---

## Context for AI Assistant

When continuing this project:

1. **Ben's background**: ME degree from UCSB, technical sales experience (Paramount Extrusions, AP Americas, Synack), building FlightForm Labs on the side

2. **Primary input source**: Plaud Note Pro transcripts (exported as txt/json)

3. **Design philosophy**: 
   - This is a LEARNING tool, not a CRM
   - Precompute everything possible
   - Query responses should be instant
   - Every segment can have different knowledge types
   - The system accumulates institutional memory over time

4. **Technical constraints**:
   - Local-first for now (SQLite, runs on Ben's machine)
   - Will need Anthropic API key to enable AI features
   - Future: Google Drive integration, cloud hosting

---

## Files That Need Completion

### 1. SegmentBrowser.jsx (cut off)
Missing: closing of the component, the SegmentCard subcomponent

### 2. StatsPanel.jsx (not created)
Should show:
- Total transcripts, segments, people, deals
- Knowledge type distribution
- Recent activity
- Aggregate metrics (avg talk ratio, etc.)

---

## Contact

This is Ben's personal project for professional development. The system should grow with him as he starts the new Founder AE role, capturing everything he learns and making it searchable.
