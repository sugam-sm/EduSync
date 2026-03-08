# using python 3.12-slim as base image
FROM python:3.12-slim

# setting environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Copying astral/uv image from dockerhub
COPY --from=docker.io/astral/uv:latest /uv /uvx /bin/

# setting working directory
WORKDIR /app

# install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# copying requirements file
COPY requirements.txt .

# installing python dependencies using uv pip
RUN uv pip install --system --no-cache -r requirements.txt

# copying project files
COPY . .

#exposing port 8000 for the application
EXPOSE 8000

# command to run the application using python
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
