# Use the official Node.js image as a base
FROM node:23.3.0 as build

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the project files and build the app
COPY . ./
RUN npm run build

# Serve the app with an Nginx server
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
