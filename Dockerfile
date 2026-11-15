# Multi-stage Dockerfile for AMAL Full-Stack Platform (.NET 10 + React 19)

# Stage 1: Build Frontend (Vite + React 19)
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npx vite build

# Stage 2: Build Backend (.NET 10)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /app
COPY backend/ ./backend/
WORKDIR /app/backend/AMAL.Api
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Copy published .NET backend
COPY --from=backend-build /app/publish ./

# Copy built frontend into wwwroot for ASP.NET Static Files serving
COPY --from=frontend-build /app/frontend/dist ./wwwroot

# Expose port (Render sets $PORT dynamically)
ENV ASPNETCORE_URLS=http://+:8080
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "AMAL.Api.dll"]
