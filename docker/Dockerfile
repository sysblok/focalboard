### Webapp build
FROM node:20-slim AS nodebuild

ARG FOCALBOARD_ENVIRONMENT
ARG FOCALBOARD_ADMINS
WORKDIR /webapp
ENV NODE_OPTIONS=--max_old_space_size=4096
ENV FOCALBOARD_ENVIRONMENT=$FOCALBOARD_ENVIRONMENT
ENV FOCALBOARD_ADMINS=$FOCALBOARD_ADMINS

COPY webapp/package.json webapp/package-lock.json* ./

RUN npm ci --ignore-scripts && npm cache clean --force

COPY webapp/ /webapp

RUN npm run pack

### Go build
FROM golang:1.22-bookworm AS gobuild

WORKDIR /go/src/focalboard

RUN mkdir server && mkdir -p bin/docker

COPY server/go.mod server/go.sum ./server

RUN cd server && go mod download

COPY . /go/src/focalboard

ARG TARGETOS
ARG TARGETARCH
# BUILD_TAGS controls the SQLite driver:
#   ""              — all 5 backends (postgres, mysql, sqlite3, libsql/Turso, D1) via pure Go (default)
#   "json1 sqlite3" — same, but SQLite uses mattn/go-sqlite3 (CGO required)
ARG BUILD_TAGS=""

RUN --mount=type=cache,target="/root/.cache/go-build" \
    EXCLUDE_PLUGIN=true EXCLUDE_SERVER=true EXCLUDE_ENTERPRISE=true \
    make server-docker BUILD_TAGS="${BUILD_TAGS}" os=${TARGETOS} arch=${TARGETARCH}

## Final image
FROM debian:bookworm-slim

ARG FOCALBOARD_ENVIRONMENT
ARG FOCALBOARD_ADMINS
ENV FOCALBOARD_ENVIRONMENT=${FOCALBOARD_ENVIRONMENT}
ENV FOCALBOARD_ADMINS=${FOCALBOARD_ADMINS}

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /opt/focalboard/data/files
RUN chown -R nobody:nogroup /opt/focalboard

WORKDIR /opt/focalboard

COPY --from=nodebuild --chown=nobody:nogroup /webapp/pack pack/
COPY --from=gobuild --chown=nobody:nogroup /go/src/focalboard/bin/docker/focalboard-server bin/
COPY --from=gobuild --chown=nobody:nogroup /go/src/focalboard/LICENSE.txt LICENSE.txt
COPY --from=gobuild --chown=nobody:nogroup /go/src/focalboard/docker/server_config.json config.json

USER nobody

EXPOSE 8000/tcp 9092/tcp

VOLUME /opt/focalboard/data

CMD ["/opt/focalboard/bin/focalboard-server"]
