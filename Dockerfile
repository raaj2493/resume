# Stage 1: Build Go backend binary
FROM golang:1.25-alpine AS go-builder
WORKDIR /src/backend
COPY backend/go.mod ./
COPY backend/cmd ./cmd
COPY backend/internal ./internal
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/server ./cmd/server

# Stage 2: Runtime with Python AI engine + Go binary
FROM python:3.12-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHON_ENGINE_URL=http://127.0.0.1:8001

COPY 01-AI-HIREME/requirements.txt /app/01-AI-HIREME/requirements.txt
RUN pip install --no-cache-dir -r /app/01-AI-HIREME/requirements.txt

COPY 01-AI-HIREME /app/01-AI-HIREME
COPY --from=go-builder /out/server /app/server
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 8081
CMD ["/app/start.sh"]
