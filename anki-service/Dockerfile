FROM python:3.11-slim

WORKDIR /app

# System dependencies needed by the anki package (Rust-based bindings)
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libdbus-1-3 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

ENV ANKI_DB_PATH=/data/collection.anki2

EXPOSE 5000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
