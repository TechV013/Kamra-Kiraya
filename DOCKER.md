# Docker build and publish

Build the production image locally:

```bash
docker build -t <your-dockerhub-username>/student-room-booking-platform:latest .
```

Run locally to verify:

```bash
docker run --rm -e NODE_ENV=production -p 3000:3000 <your-dockerhub-username>/student-room-booking-platform:latest
```

Push to Docker Hub:

```bash
docker login
docker push <your-dockerhub-username>/student-room-booking-platform:latest
```

Notes:
- Ensure `package.json` has a `start` script that runs `next start -p 3000` or similar.
- Replace `<your-dockerhub-username>` with your Docker Hub account name.
