# Using node 20 alpine image as base image
FROM node:20-alpine

# setting working directory
WORKDIR /app

# copying package.json and package-lock.json files
COPY package*.json ./

# installing dependencies
RUN npm install

# copying project files
COPY . .

# exposing port 3000 for the application
EXPOSE 3000

# command to run the application using npm
CMD ["npm", "run", "dev", "--", "--host"]