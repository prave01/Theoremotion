FROM oven/bun:latest

WORKDIR app

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libcairo2-dev \
    pkg-config \
    ffmpeg \
    libpango1.0-dev \
    libglib2.0-dev \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-extra \
    texlive-fonts-recommended \
    && rm -rf /var/lib/apt/lists/*

RUN bun install hono

EXPOSE 8000

CMD ["bun", "server.ts"]
