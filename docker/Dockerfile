### Webapp build
FROM node:16.3.0@sha256:ca6daf1543242acb0ca59ff425509eab7defb9452f6ae07c156893db06c7a9a4 as nodebuild

WORKDIR /webapp
ENV NODE_OPTIONS=--max_old_space_size=4096

COPY webapp/package.json webapp/package-lock.json* ./

RUN npm ci && npm cache clean --force

COPY webapp/ /webapp

RUN npm run pack

### Go build
FROM golang:1.18.3@sha256:b203dc573d81da7b3176264bfa447bd7c10c9347689be40540381838d75eebef AS gobuild

WORKDIR /go/src/focalboard
ADD . /go/src/focalboard

# Get target architecture 
ARG TARGETOS
ARG TARGETARCH  

RUN --mount=type=cache,target="/root/.cache/go-build" EXCLUDE_PLUGIN=true EXCLUDE_SERVER=true EXCLUDE_ENTERPRISE=true make server-docker os=${TARGETOS} arch=${TARGETARCH}

## Final image
FROM debian:buster-slim@sha256:5b0b1a9a54651bbe9d4d3ee96bbda2b2a1da3d2fa198ddebbced46dfdca7f216

RUN mkdir -p /opt/focalboard/data/files
RUN chown -R nobody:nogroup /opt/focalboard

WORKDIR /opt/focalboard

COPY --from=nodebuild --chown=nobody:nogroup /webapp/pack pack/
COPY --from=gobuild --chown=nobody:nogroup /go/src/focalboard/bin/docker/focalboard-server bin/
COPY --from=gobuild --chown=nobody:nogroup /go/src/focalboard/LICENSE.txt LICENSE.txt
COPY --from=gobuild --chown=nobody:nogroup /go/src/focalboard/docker/server_config.json config.json

USER nobody

EXPOSE 8000/tcp

EXPOSE 8000/tcp 9092/tcp

VOLUME /opt/focalboard/data

CMD ["/opt/focalboard/bin/focalboard-server"]
