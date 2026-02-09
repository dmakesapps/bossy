#!/bin/bash
echo "Checking Docker..."
counter=0
max_attempts=60

while ! docker info >/dev/null 2>&1; do
    echo "Waiting for Docker to start... ($counter/$max_attempts)"
    sleep 2
    counter=$((counter+1))
    if [ $counter -ge $max_attempts ]; then
        echo "Error: Docker failed to start within timeout."
        exit 1
    fi
done

echo "Docker is ready!"
echo "Starting Application..."
docker compose up -d --build
