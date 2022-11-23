FROM node:18.12-buster as base

# We don't need the standalone Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
RUN apt-get update && apt-get install gnupg wget -y && \
  wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
  sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
  apt-get update && \
  apt-get install google-chrome-stable -y --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /usr

COPY package.json ./

COPY tsconfig.json ./
COPY babel.config.js ./

COPY src ./src

RUN ls -a

RUN npm install

FROM base AS test
RUN echo "helloaa"
RUN npm run test
RUN echo "hello"

FROM base AS prodbuild

RUN npm run build

CMD ["node", "dist/autotrader.js"]