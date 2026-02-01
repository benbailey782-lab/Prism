# Prism
## Complete Product Specification

**Version:** 1.0  
**Last Updated:** January 2025  
**Owner:** Ben  

---

# Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [Core Concepts](#3-core-concepts)
4. [User Experience](#4-user-experience)
5. [Information Architecture](#5-information-architecture)
6. [Feature Specifications](#6-feature-specifications)
7. [Data Model](#7-data-model)
8. [Technical Architecture](#8-technical-architecture)
9. [Visual Design System](#9-visual-design-system)
10. [Development Phases](#10-development-phases)
11. [Edge Cases & Error Handling](#11-edge-cases--error-handling)
12. [Future Considerations](#12-future-considerations)
13. [Appendices](#13-appendices)

---

# 1. Executive Summary

## What is Prism?

Prism is a **personal intelligence engine for sales professionals**. It transforms conversations, documents, and recordings into searchable institutional memory with precomputed insights that evolve over time.

## The Problem

Sales professionals accumulate knowledge through hundreds of conversations — product details, competitive intel, relationship context, deal history, advice from mentors. This knowledge lives in their heads, scattered notes, and forgotten call recordings. When they need it most (preparing for a call, building strategy, handling an objection), it's inaccessible.

## The Solution

Prism captures everything automatically, extracts knowledge intelligently, organizes it into living documents, and makes it instantly queryable. It's not a CRM. It's not a note-taking app. It's a **second brain that actually thinks**.

## Key Differentiators

| Traditional Tools | Prism |
|-------------------|-------------|
| Store raw data | Extract meaning |
| Static dashboards | Living documents that evolve |
| Manual organization | Automatic classification & routing |
| Search by keyword | Query with natural language |
| Report on what happened | Advise on what to do |

---

# 2. Product Vision

## The North Star

> "Ask anything about your sales world and get an intelligent answer in seconds."

Prism should feel like having a brilliant colleague who has perfect recall of every conversation you've ever had, every document you've ever read, and every piece of advice you've ever received — and can synthesize it all on demand.

## Core Principles

### 1. Capture Everything, Organize Nothing
Users should not have to think about where to put information or how to tag it. Drop it in, let the system figure it out.

### 2. Living Documents, Not Static Pages
Every section of the app should continuously evolve as new information arrives. The Insights page today should be different from yesterday if you had calls yesterday.

### 3. Query First, Browse Second
The primary interaction is asking questions. Browsing is for exploration, not primary retrieval.

### 4. Show Your Work
Every answer should be traceable to sources. Trust requires transparency.

### 5. Local First, Private Always
All processing happens locally where possible. Your sales intelligence is yours alone.

## Target User

**Ben** — Territory Sales Manager transitioning to Founder AE role.

- Records all sales calls with Plaud Note Pro
- Wants to accelerate learning curve at new company
- Needs to track multiple deals simultaneously
- Values pattern recognition and self-coaching
- Technical enough to run local tools
- Primarily desktop/laptop user

## Use Cases (Prioritized)

1. **Deal Strategy** — "Build me a strategy for the Acme deal"
2. **Knowledge Retrieval** — "How does our SSO work?"
3. **People Intelligence** — "What did James tell me about procurement?"
4. **Self-Coaching** — "What patterns do you see in my calls?"
5. **Competitive Intel** — "What do I know about Competitor X?"
6. **Objection Handling** — "How have I handled pricing objections?"

---

# 3. Core Concepts

## 3.1 Sources

A **Source** is any input that contains knowledge. Sources come in multiple types:

| Source Type | Examples | Processing |
|-------------|----------|------------|
| transcript | Plaud recording, in-app recording | Segment → Tag → Extract entities |
| document | Contract, proposal, email | Classify → Extract structured data |
| image | Screenshot, whiteboard photo | OCR → Classify → Extract |
| note | Quick typed note | Classify → Route |

Every piece of knowledge in the system traces back to one or more sources.

## 3.2 Segments

A **Segment** is a chunk of a source that contains a coherent piece of knowledge. A 45-minute call transcript might contain 20+ segments, each with different knowledge types.

### Knowledge Types

| Type | Description | Example |
|------|-------------|---------|
| product_knowledge | Features, capabilities, technical details | "Our SSO supports SAML 2.0" |
| process_knowledge | Internal procedures, how things work | "Legal review takes 2-3 weeks" |
| people_context | Info about people, roles, relationships | "Sarah is the decision maker" |
| sales_insight | Deal-specific information, objections | "They're also evaluating Competitor X" |
| advice_received | Guidance from mentors/colleagues | "Always ask about paper process early" |
| decision_rationale | Why decisions were made | "We went with vendor Y because..." |
| competitive_intel | Info about competitors | "Competitor X dropped prices 15%" |
| small_talk | Casual conversation (low value) | "How was your weekend?" |

## 3.3 Entities

**Entities** are the nouns in your sales world:

- **Deals** — Opportunities being pursued (Acme Corp, TechCorp)
- **People** — Anyone mentioned or interacted with (Sarah Chen, James Wilson)
- **Companies** — Organizations (Acme Corp, Competitor X)
- **Products** — Your products and competitor products

Entities are extracted automatically and linked to segments.

## 3.4 Living Sections

**Living Sections** are pre-generated pages that synthesize knowledge into readable documents. They regenerate automatically as new information arrives.

| Section | Content | Regeneration Trigger |
|---------|---------|---------------------|
| Insights | Activity summary, patterns, coaching | Daily + after every 3 transcripts |
| Product Knowledge | Organized product information | New product_knowledge segment |
| Deals | Deal profiles with MEDDPICC | New segment linked to deal |
| People | Relationship intelligence | New segment mentioning person |

## 3.5 MEDDPICC

MEDDPICC is a sales qualification framework. Prism tracks coverage automatically:

| Letter | Meaning | What We Track |
|--------|---------|---------------|
| M | Metrics | Quantified business impact |
| E | Economic Buyer | Person who controls budget |
| D | Decision Criteria | How they'll evaluate options |
| D | Decision Process | Steps to get to yes |
| P | Paper Process | Legal/procurement timeline |
| I | Identify Pain | The problem they're solving |
| C | Champion | Internal advocate |
| C | Competition | Other options being considered |

---

# 4. User Experience

## 4.1 Primary Navigation

The app has 5 main tabs plus a global capture action:

1. **Ask** — Query interface (primary)
2. **Insights** — Auto-generated coaching report
3. **Product** — Living product knowledge base
4. **Deals** — Deal profiles and MEDDPICC tracking
5. **People** — Relationship intelligence
6. **[+ Capture]** — Quick access to add new information

## 4.2 Tab: Ask (Query Interface)

The primary interaction surface. A prominent prompt box with intelligent response rendering.

**Features:**
- Large query input field with placeholder examples
- Recent queries list
- Rich response rendering with:
  - Prose answers in natural language
  - Data visualizations (MEDDPICC scorecards, charts)
  - Source citations linked to original segments
  - Follow-up query suggestions

**Example queries:**
- "Build me a strategy for the Acme deal"
- "How does our platform handle SSO?"
- "What patterns do you see in my discovery calls?"
- "What did James tell me about handling procurement?"

## 4.3 Tab: Insights (Living Coaching Report)

A scrollable, auto-generated document that provides coaching insights:

**Sections:**
1. This Week's Activity — Call count, talk time, deals touched
2. Talk Ratio Trend — Visualization with coaching advice
3. Patterns I'm Noticing — AI-identified behaviors
4. Deals Needing Attention — Stalled or incomplete deals
5. New Knowledge Captured — Recent extractions
6. Questions You're Asking — Discovery question analysis
7. Advice to Remember — Surfaced mentor guidance

**Regeneration:** Daily at midnight + after every 3 new transcripts

## 4.4 Tab: Product Knowledge (Living Wiki)

Everything learned about your product, organized into a browsable knowledge base:

**Features:**
- Auto-categorized by topic (Security, Integrations, Pricing, etc.)
- Full-text search
- Each entry shows source attribution
- Confidence indicators for uncertain information
- Expandable sections

## 4.5 Tab: Deals

Deal profiles with MEDDPICC tracking, timeline, and intelligence.

**Deal List View:**
- Cards showing company name, MEDDPICC progress bar, status
- Last contact date
- Quick filters (All, Active, Stalled)

**Deal Detail View:**
- Summary paragraph (AI-generated)
- Stats bar (calls, hours, last contact, value)
- MEDDPICC Scorecard with evidence for each letter
- Key People section
- Timeline of interactions
- Documents attached to deal
- Open Questions (auto-generated from gaps)

## 4.6 Tab: People

Relationship intelligence for everyone in your sales world.

**People List View:**
- Filter by type (Prospects, Colleagues, Mentors)
- Search by name
- Cards showing name, company, role, relationship type

**Person Detail View:**
- Relationship summary
- For mentors/colleagues: Advice they've given (organized by topic)
- For prospects: Deal associations, key quotes, role in deals
- Conversation history

## 4.7 Capture Modal

Accessed via the [+ Capture] button. Three input methods:

**Record Mode:**
- Browser-based voice recording
- Real-time waveform visualization
- Optional context (link to deal)
- Transcription via Whisper

**Upload Mode:**
- Drag and drop or file picker
- Supports PDF, DOCX, TXT, MD, CSV, PNG, JPG
- AI classification shows what was detected
- Option to link to deal/person before processing

**Note Mode:**
- Quick text input
- Optional linking to deals/people
- Immediate processing

---

# 5. Information Architecture

## 5.1 Data Flow

```
INPUT LAYER
  Plaud Auto-Sync (Folder Watch / Zapier)
  In-App Recording (Browser MediaRecorder)  
  Document Upload
         ↓
UNIFIED INGESTION
  Detect type → Convert to text → Create Source
         ↓
PROCESSING LAYER
  Transcript Processor: Segment → Tag → Extract entities
  Document Processor: Classify → Extract structured data
  Entity Linker: Match/create entities
         ↓
STORAGE LAYER
  Sources, Segments, Entities, Extracts, Metrics, Pages
         ↓
GENERATION LAYER
  Page Generators (Insights, Product, Deal, Person)
  Query Engine (Parse → Retrieve → Synthesize)
         ↓
PRESENTATION LAYER
  React Web App
```

## 5.2 Section Regeneration Rules

| Section | Trigger | Scope |
|---------|---------|-------|
| Insights | Daily 00:00 + every 3 transcripts | Full page |
| Product Knowledge | New product_knowledge segment | Affected category |
| Deal Page | New segment linked to deal | Full deal page |
| Person Page | New segment mentioning person | Full person page |
| MEDDPICC | New sales_insight for deal | MEDDPICC section |

---

# 6. Feature Specifications

## 6.1 Query Engine

**Capabilities:**
1. Deal Strategy — Synthesize everything known about a deal
2. Knowledge Retrieval — Find specific information
3. Pattern Analysis — Identify trends across data
4. Comparison — Compare deals, people, time periods
5. Coaching — Provide actionable advice

**Processing Pipeline:**
Query → Parse intent/entities → Retrieve relevant segments → Build context → AI synthesis → Render with citations

## 6.2 Transcript Processing

**Segmentation Rules:**
- Minimum segment: 50 words
- Maximum segment: 500 words
- Split on: Topic shift, speaker change, significant pause
- Overlap: 1 sentence between segments for context

**Classification:** AI assigns knowledge type with confidence score

**MEDDPICC Extraction:** AI identifies evidence for each letter when processing sales calls

## 6.3 Document Processing

**Supported Formats:**
- PDF (pdf-parse + OCR fallback)
- DOCX (mammoth)
- TXT/MD (direct read)
- CSV (Papa Parse)
- PNG/JPG (Tesseract OCR)
- XLSX (SheetJS)

**Document Types Detected:**
- Contract/MSA → Extract terms, pricing, parties
- Proposal/Quote → Extract scope, pricing, competitors
- Email thread → Extract context, commitments, people
- Technical spec → Extract features, requirements
- Meeting notes → Extract decisions, action items

## 6.4 Voice Recording

**Technical Approach:**
- Browser MediaRecorder API
- WebM/Opus format
- Whisper transcription (local via whisper.cpp)
- Process same as Plaud transcripts

## 6.5 Plaud Integration

**Primary Method: Zapier**
- Trigger: Plaud transcription complete
- Action: POST to /api/sources/ingest webhook
- Automatic processing

**Fallback: Folder Watch**
- Watch configured local folder
- Detect new .txt, .json files
- Parse and ingest

**Deduplication:** Content hash checked on ingest

---

# 7. Data Model

## 7.1 Core Tables

**sources** — Any input containing knowledge
- id, type, subtype, filename, filepath, raw_content
- content_hash (for deduplication)
- detected_type, duration_seconds
- created_at, processed_at

**segments** — Chunks extracted from sources
- id, source_id, content
- start_time, end_time, speaker
- knowledge_type, summary, confidence
- created_at

**segment_tags** — Tags for segments
- id, segment_id, tag

**deals** — Sales opportunities
- id, company_name, status
- value_amount, expected_close_date
- summary, last_activity_at

**deal_meddpicc** — MEDDPICC tracking per deal
- id, deal_id, letter
- status, evidence, confidence
- source_segment_id

**people** — Contacts and relationships
- id, name, company, role
- relationship_type (prospect, colleague, mentor)
- notes

**segment_entities** — Links segments to entities
- segment_id, entity_type, entity_id, confidence

**document_extractions** — Structured data from documents
- id, source_id, extraction_type, data (JSON)

**source_metrics** — Computed metrics per source
- source_id, talk_ratio, word_count
- strong_moments, improvement_areas, questions_asked

**generated_pages** — Cached page content
- id, page_type, entity_id
- content (JSON), generated_at

---

# 8. Technical Architecture

## 8.1 System Overview

All components run on user's local machine:

- **Frontend:** React 18 + Vite, Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **AI:** Ollama (llama3.1:8b) — free, local, private
- **Transcription:** Whisper.cpp — free, local
- **File Watching:** Chokidar

## 8.2 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React 18 + Vite | Fast dev, modern React |
| Styling | Tailwind CSS | Utility-first, rapid UI |
| Backend | Node.js + Express | JavaScript everywhere |
| Database | SQLite | Local-first, zero config |
| AI | Ollama (llama3.1:8b) | Free, local, private |
| Transcription | Whisper.cpp | Free, local, accurate |
| File Watching | Chokidar | Reliable cross-platform |
| PDF Parsing | pdf-parse | Extract text from PDFs |
| DOCX Parsing | mammoth | Extract text from Word |
| OCR | Tesseract.js | Browser-compatible OCR |

## 8.3 API Endpoints

**Sources:** GET/POST /api/sources, POST /api/sources/ingest
**Segments:** GET /api/segments, GET /api/segments/search
**Query:** POST /api/query, GET /api/query/history
**Pages:** GET /api/pages/{insights|product|deals|people}
**Deals:** CRUD /api/deals, GET /api/deals/:id/meddpicc
**People:** CRUD /api/people
**Upload:** POST /api/upload, POST /api/upload/audio

---

# 9. Visual Design System

## 9.1 Design Philosophy

**Aesthetic Direction: Dark Mode Command Center**
- Professional, focused, high-information-density
- Feels like mission control for sales
- Data is beautiful, not overwhelming
- Minimal chrome, maximum content

**Inspiration:** Linear, Raycast, Stripe Dashboard

## 9.2 Color Palette

**Base Colors:**
- Background: #09090b (deepest), #18181b (surface), #27272a (elevated)
- Text: #fafafa (primary), #a1a1aa (secondary), #71717a (tertiary)
- Primary: #22c55e (green — growth, success)
- Semantic: success/#22c55e, warning/#f59e0b, error/#ef4444, info/#3b82f6

**Knowledge Type Colors:**
- Product: #3b82f6 (blue)
- Process: #a855f7 (purple)
- People: #22c55e (green)
- Sales: #f59e0b (amber)
- Advice: #eab308 (yellow)
- Competitive: #ef4444 (red)

**MEDDPICC Status:**
- Strong (80-100%): #22c55e
- Partial (40-79%): #f59e0b
- Weak (1-39%): #ef4444
- Unknown (0%): #3f3f46

## 9.3 Typography

**Fonts:**
- Display: 'Cal Sans', 'Inter', system-ui
- Body: 'Inter', system-ui
- Mono: 'JetBrains Mono', 'Fira Code'

**Scale:** xs/12px, sm/14px, base/16px, lg/18px, xl/20px, 2xl/24px, 3xl/30px

## 9.4 Motion

**Principles:**
- Subtle — enhance, not distract
- Fast — 150-200ms for micro-interactions
- Purposeful — communicate state changes

---

# 10. Development Phases

## Phase 1: Foundation (Weeks 1-2)
- Database schema
- Folder watcher for Plaud
- Basic transcript parsing
- Ollama integration
- Basic React UI with navigation
- Transcript list and detail views

## Phase 2: Intelligence Layer (Weeks 3-4)
- Knowledge type classification
- Entity extraction (people, companies)
- MEDDPICC extraction
- Segment browser with filtering
- Deal and People creation/linking
- Transcript metrics

## Phase 3: Query Interface (Weeks 5-6)
- Query input UI
- Query parsing and intent detection
- Segment retrieval
- Response synthesis with AI
- Response rendering with citations
- Query history

## Phase 4: Living Sections (Weeks 7-8)
- Page generation infrastructure
- Insights page generator
- Product knowledge generator
- Deal profile generator
- Person profile generator
- Regeneration triggers

## Phase 5: Multi-Input (Weeks 9-10)
- In-app voice recording
- Whisper transcription
- Document upload (PDF, DOCX)
- Document classification and extraction
- Image upload with OCR
- Quick text notes
- Capture modal UI

## Phase 6: Polish & Integration (Weeks 11-12)
- Visual design polish
- Animation and transitions
- Error handling
- Zapier webhook for Plaud
- Deduplication
- Performance optimization
- Documentation

## Future Phases
- Vector search with embeddings
- Google Drive integration
- Mobile PWA
- Team features (if applicable)

---

# 11. Edge Cases & Error Handling

## Ingestion
- Duplicate files: Hash check, prompt user
- Corrupted files: Show error, allow retry
- Unsupported types: Clear message, list supported
- Very large files: Warn, process in chunks
- Non-English: Attempt processing, flag for review

## Processing
- AI unavailable: Queue for later, rule-based fallback
- Low confidence: Tag as "unknown", surface for review
- No entities: Process anyway, manual linking available
- Long transcripts: Split into chunks

## UI
- Empty state: Helpful onboarding
- No results: Suggest alternatives
- Page generation fails: Show cached, retry button
- Slow AI: Streaming response, loading states
- Offline: Show cached data, queue actions

---

# 12. Future Considerations

## Scaling
- PostgreSQL + pgvector for large datasets
- Hybrid SQLite + vector store approach

## Multi-User
- Workspace separation
- Team knowledge bases
- Role-based access

## Cloud Deployment
- Docker container
- Railway/Render/Fly.io
- Self-hosted options

## Mobile
- PWA for install
- Quick capture widget
- Offline access

## Integrations Roadmap
- Google Calendar
- Salesforce/HubSpot
- Slack
- Zoom/Teams
- Email (Gmail/Outlook)

## AI Upgrades
- Larger Ollama models (llama3.1:70b)
- Hybrid: Ollama for bulk + Claude for complex
- Fine-tuned models for sales

---

# 13. Appendices

## A. Sample AI Prompts

Included in codebase:
- Segment classification prompt
- MEDDPICC extraction prompt
- Deal strategy synthesis prompt
- Insights page generation prompt

## B. Database Queries Reference

Common queries for:
- Segments by deal
- MEDDPICC coverage
- Advice by person
- Knowledge type distribution
- Talk ratio trends

## C. Environment Configuration

Full .env template with:
- Server settings
- AI configuration (Ollama/Anthropic)
- Transcription settings
- Integration keys
- Feature flags

## D. Setup Scripts

- setup-ollama.sh — Install and configure Ollama
- setup-whisper.sh — Download Whisper models

---

# Glossary

| Term | Definition |
|------|------------|
| Champion | Internal advocate at prospect company |
| Economic Buyer | Person with budget authority |
| Entity | Noun in sales world: Deal, Person, Company, Product |
| Knowledge Type | Classification category for segments |
| Living Section | Pre-generated page that auto-updates |
| MEDDPICC | Sales qualification framework |
| Segment | Chunk of content extracted from source |
| Source | Any input: transcript, document, recording, note |
| Talk Ratio | Percentage of time spent talking vs listening |

---

*This document is the source of truth for Prism development.*
