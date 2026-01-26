# Chicken Disease Diagnosis System

AI-powered chicken disease detection and diagnosis system using YOLOv8/YOLOv11 and RAG.

## Features

- 🎥 **Real-time Camera Monitoring**: WebSocket-based live chicken health monitoring
- 🔍 **Disease Detection**: Detect sick chickens using YOLOv11n (95% mAP@50)
- 🔬 **Disease Classification**: Classify diseases from fecal images using YOLOv8n-cls (97.27% accuracy)
- 💬 **AI Chatbot**: RAG-powered treatment consultation using Gemini API

## Quick Start with Docker

### Prerequisites
- Docker & Docker Compose installed
- Trained YOLO models in `ai_model/` directory

### 1. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your Gemini API key
# GOOGLE_API_KEY=your_actual_key_here
```

### 2. Run with Docker
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### 3. Access API
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Root**: http://localhost:8000/

## Project Structure

```
Chicken_Disease_System/
├── ai_model/                    # AI models & training
│   ├── 01_classification/       # Disease classification (97.27%)
│   └── 02_detection/            # Chicken detection (95% mAP)
├── backend/                     # FastAPI backend
│   ├── app/
│   │   ├── main.py             # FastAPI app
│   │   ├── config.py           # Configuration
│   │   ├── services/           # Business logic
│   │   └── api/v1/endpoints/   # API routes
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml
└── .env
```

## Development

### Without Docker (Local)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## API Endpoints

### Health & Info
- `GET /` - API information
- `GET /health` - Health check

### Detection (Coming soon)
- `WS /ws/camera-stream` - Real-time camera stream
- `POST /api/v1/detect/classify` - Classify disease from image

### Chat (Coming soon)
- `POST /api/v1/chat/ask` - Ask treatment advice

## Models

- **Detection Model**: YOLOv11n (6.2MB) - 95% mAP@50
- **Classification Model**: YOLOv8n-cls - 97.27% accuracy
- **Classes**: Coccidiosis, Salmonella, Newcastle Disease, Healthy

## Tech Stack

- **Backend**: FastAPI, Python 3.11
- **AI/ML**: Ultralytics YOLO, LangChain, Gemini API
- **Database**: PostgreSQL, ChromaDB
- **Deployment**: Docker, Docker Compose

## License

MIT
