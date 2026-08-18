FROM eclipse-temurin:21-jdk-jammy
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 g++ curl ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && npm install -g tsx typescript \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY server.mjs .
EXPOSE 2000
USER nobody
CMD ["node", "server.mjs"]
