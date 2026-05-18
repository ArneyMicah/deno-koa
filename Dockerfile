# ---- Stage 1: Build ----
FROM denoland/deno:2-debian AS builder

WORKDIR /app

# Copy dependency manifests (leverage Docker layer caching).
COPY deno.json deno.lock ./

# Install dependencies from lockfile.
RUN deno install

# Copy source code
COPY src/ ./src/
COPY cli/ ./cli/

# Copy environment file for build-time config resolution
COPY .env.production ./.env.production

# Compile to a standalone binary
RUN deno compile \
    --allow-net \
    --allow-read \
    --allow-env \
    --output=/app/dist/server \
    ./src/main.ts

# ---- Stage 2: Runtime ----
FROM debian:bookworm-slim

# Install ca-certificates for HTTPS
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash appuser

# Copy the compiled binary (no Deno runtime needed)
COPY --from=builder /app/dist/server /app/server

# Copy environment file for runtime
COPY .env.production /app/.env.production

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

# Use exec form for proper signal handling
CMD ["/app/server"]