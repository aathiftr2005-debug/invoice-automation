# Invoice Automation Tool

[![Live Demo](https://img.shields.io/badge/live-demo-6366F1?style=for-the-badge)](#) [![GitHub](https://img.shields.io/badge/github-repository-0F172A?style=for-the-badge)](#)

Production-grade invoice ingestion, AI extraction, ledger management, CSV export, and spend analytics.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Data Viz | Recharts |
| Feedback | react-hot-toast |
| Backend | Python Flask, SQLAlchemy, Flask-CORS |
| Extraction | pdfplumber, Claude `claude-sonnet-4-20250514` |
| Database | PostgreSQL / Supabase session pooler |
| Runtime | Docker, docker-compose, Gunicorn |

## Architecture

```text
+------------------+        HTTPS/JSON        +----------------------+
| React + Vite UI  |  ---------------------->  | Flask REST API       |
| Upload/Ledger/BI |                          | Routes + Services    |
+------------------+                          +----------+-----------+
                                                        |
                                                        | SQLAlchemy ORM
                                                        v
                                                +-------+--------+
                                                | PostgreSQL     |
                                                | invoices table |
                                                +-------+--------+
                                                        ^
                                                        |
                         PDF text + structured prompt   |
                         +------------------------------+
                         |
                 +-------+--------+
                 | Claude API     |
                 | JSON extract   |
                 +----------------+
```

## Local Setup

### Docker Compose

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
export ANTHROPIC_API_KEY=your_claude_api_key
docker compose up --build
```

The backend runs on `http://localhost:5000`. Start the frontend separately:

```bash
cd frontend
npm install
npm run dev
```

### Manual Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
flask --app app run --host 0.0.0.0 --port 5000
```

For Supabase, use the session pooler connection string on port `6543`:

```text
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

### Manual Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string. Use Supabase session pooler port `6543` in production. |
| `ANTHROPIC_API_KEY` | Yes | Claude API key. |
| `ANTHROPIC_MODEL` | No | Defaults to `claude-sonnet-4-20250514`. |
| `FRONTEND_URL` | Yes | Allowed CORS origin, for example `http://localhost:5173`. |
| `UPLOAD_FOLDER` | No | Temporary PDF storage path. |
| `MAX_CONTENT_LENGTH` | No | Upload limit in bytes, defaults to 10MB. |
| `VITE_API_BASE_URL` | Yes | Frontend API base URL, for example `http://localhost:5000/api`. |

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/upload` | Upload and process one PDF invoice. |
| `GET` | `/api/invoices` | Paginated invoice list with vendor and date filters. |
| `GET` | `/api/invoices/<id>` | Single invoice detail. |
| `DELETE` | `/api/invoices/<id>` | Delete an invoice. |
| `GET` | `/api/export/csv` | Download invoice CSV. |
| `GET` | `/api/analytics` | Monthly totals, top vendors, and summary metrics. |

## Screenshots

Add screenshots here after deployment:

```text
screenshots/upload.png
screenshots/invoices.png
screenshots/detail.png
screenshots/analytics.png
```

## Deployment

### Render Backend

1. Create a new Web Service from the repository.
2. Set root directory to `backend`.
3. Use Docker deployment or set build command `pip install -r requirements.txt`.
4. Set start command `gunicorn --bind 0.0.0.0:$PORT app:app`.
5. Add `DATABASE_URL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, and `FRONTEND_URL`.
6. Point `DATABASE_URL` to Supabase session pooler port `6543`.

### Vercel Frontend

1. Import the repository in Vercel.
2. Set root directory to `frontend`.
3. Set build command `npm run build`.
4. Set output directory `dist`.
5. Add `VITE_API_BASE_URL=https://your-render-service.onrender.com/api`.
6. Update Render `FRONTEND_URL` to your Vercel URL.

## Security Notes

- Secrets are read only from environment variables.
- `.env` files are ignored by git.
- Uploads are restricted to PDF files up to 10MB.
- SQL queries use SQLAlchemy ORM.
- CORS is restricted to the configured frontend origin.
