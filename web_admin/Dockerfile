# Sử dụng Node.js làm base image
FROM node:18-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy toàn bộ source code
COPY . .

# Mở port 5173 (Port mặc định của Vite)
EXPOSE 5173

# Chạy server development với host 0.0.0.0 để truy cập từ ngoài container
CMD ["npm", "run", "dev", "--", "--host"]
