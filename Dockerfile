FROM node:24-bookworm-slim AS frontend

WORKDIR /build
RUN npm install --global pnpm@11.19.0
COPY web/package.json web/pnpm-lock.yaml web/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY web/ ./
RUN pnpm build

FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt requirements-api.txt ./
RUN pip install --no-cache-dir -r requirements-api.txt
COPY tracerx/ ./tracerx/
COPY ml/ ./ml/
COPY benchmark_data/ ./benchmark_data/
COPY --from=frontend /build/dist ./web/dist

RUN useradd --create-home appuser
USER appuser

ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn tracerx.api:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
