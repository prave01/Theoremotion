FROM oven/bun:latest

WORKDIR /usr/src/app

COPY package.json bun.lock ./

# Install system dependencies: TeX Live, Python, pipx, Cairo, etc.
RUN apt-get update && apt-get install -y \
    texlive-base \
    texlive-binaries \
    texlive-latex-extra \
    texlive-fonts-extra \
    texlive-pictures \
    dvisvgm \
    ghostscript \
    make \
    python3 \
    python3-pip \
    pipx \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libglib2.0-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install manim globally with pipx
RUN pipx install manim

# Add pipx binary path
ENV PATH="/root/.local/bin:${PATH}"

# Install Bun deps
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 4000

CMD ["bun", "dev"]
