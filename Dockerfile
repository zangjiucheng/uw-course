# Stage 1: build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Python backend + built frontend
FROM python:3.12-slim
WORKDIR /app

# Install Python dependencies
COPY pyproject.toml ./
COPY uw_course/ ./uw_course/

# Copy the React build into Flask's static directory
COPY --from=frontend-builder /app/frontend/dist/ ./uw_course/web/static/

RUN pip install --no-cache-dir .

EXPOSE 31415

ENV UW_COURSE_HOST=0.0.0.0
ENV UW_COURSE_PORT=31415

CMD ["uw-course"]
