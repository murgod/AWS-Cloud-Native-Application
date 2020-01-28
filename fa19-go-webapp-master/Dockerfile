FROM "golang:alpine" as build-env
MAINTAINER "Adv cloud team <murgod.a@husky.neu.edu> <Balani.a@husky.neu.edu> <sahani.p@husky.neu.edu> <yadav.su@husky.neu.edu>"
WORKDIR /go-app
ADD . /go-app
RUN cd /go-app/src && go build -o main
ENV API_KEY "XXXX"

FROM alpine
RUN apk update && apk add ca-certificates && rm -rf /var/cache/apk/*
WORKDIR /go-app
COPY --from=build-env /go-app/src/main /go-app
EXPOSE 11080

ENTRYPOINT ./main
