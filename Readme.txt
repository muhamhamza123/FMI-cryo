# FMI Map Application - Docker Setup

## Prerequisites
- Docker installed on your system
- Docker Compose (optional, for easier management)

## Project Structure
```
fMI_map_app/
├── app.py
├── locations.json
├── requirements.txt
├── Dockerfile
├── .dockerignore
├── docker-compose.yml
├── templates/
│   └── index.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── map.js
```

## Building and Running with Docker

### Option 1: Using Docker directly

1. **Build the Docker image:**
```bash
docker build -t fmi-map-app .
```

2. **Run the container:**
```bash
docker run -d -p 5000:5000 --name fmi-map-app fmi-map-app
```

3. **Access the application:**
Open your browser and go to: `http://localhost:5000`

4. **View logs:**
```bash
docker logs fmi-map-app
```

5. **Stop the container:**
```bash
docker stop fmi-map-app
```

6. **Remove the container:**
```bash
docker rm fmi-map-app
```

### Option 2: Using Docker Compose (Recommended)

1. **Start the application:**
```bash
docker-compose up -d
```

2. **Access the application:**
Open your browser and go to: `http://localhost:5000`

3. **View logs:**
```bash
docker-compose logs -f
```

4. **Stop the application:**
```bash
docker-compose down
```

5. **Rebuild after changes:**
```bash
docker-compose up -d --build
```

## Configuration

### Port Configuration
To change the port, modify the port mapping in:
- **Docker command:** `-p YOUR_PORT:5000`
- **docker-compose.yml:** `"YOUR_PORT:5000"`

### Environment Variables
You can set additional environment variables in `docker-compose.yml` or pass them with `-e` flag:
```bash
docker run -d -p 5000:5000 -e FLASK_ENV=production --name fmi-map-app fmi-map-app
```

## Updating locations.json

If you need to update the `locations.json` file:

1. **Mount it as a volume:**
```bash
docker run -d -p 5000:5000 -v $(pwd)/locations.json:/app/locations.json --name fmi-map-app fmi-map-app
```

Or in `docker-compose.yml`:
```yaml
volumes:
  - ./locations.json:/app/locations.json
```

2. **Restart the container to apply changes:**
```bash
docker restart fmi-map-app
```

## Health Check

The container includes a health check that verifies the application is running:
```bash
docker inspect --format='{{json .State.Health}}' fmi-map-app
```

## Troubleshooting

### Container won't start
```bash
docker logs fmi-map-app
```

### Port already in use
Change the port mapping:
```bash
docker run -d -p 8080:5000 --name fmi-map-app fmi-map-app
```

### Permission issues
The application runs as a non-root user (appuser) for security. If you encounter permission issues with mounted volumes, check file ownership.

## Production Deployment

The application uses **Gunicorn** as a production WSGI server with:
- 4 worker processes (adjustable)
- 120 second timeout
- Runs as non-root user for security

### Adjusting Gunicorn Workers

Edit the `Dockerfile` CMD line to change worker count:
```dockerfile
CMD ["gunicorn", "-b", "0.0.0.0:5000", "-w", "8", "--timeout", "120", "app:app"]
```

Recommended workers: `(2 x CPU cores) + 1`

For production deployment, also consider:

1. **Using environment variables for secrets**
2. **Setting up HTTPS with a reverse proxy (nginx)**
3. **Enabling Docker secrets for sensitive data**
4. **Monitoring and logging**

## Cleaning Up

Remove all related Docker resources:
```bash
docker-compose down --rmi all --volumes
```

Or manually:
```bash
docker stop fmi-map-app
docker rm fmi-map-app
docker rmi fmi-map-app
```