---
layout: default
title: Running go on AWS ECS
category: 2017
---

# Running a go service on Amazon Elastic Container Service

My organization has recently moved to Amazon ECS for deploying services, and my team uses go as a backend language. In theory, it seems exceptionally straightforward to deploy a go service to ECS, but there were 2 major hurdles in deploying to this new containerized environment that I've never encountered before. The first was related to deploying a binary directly, and the second dealt with credential management specific to our continuous integration.

### Deploying a go binary to ECS

Our first major service on the new deployment stack was fairly straightforward, the beauty of go is that we can compile our project ahead of time and our dockerfile is dead simple. This was my original Dockerfile:


```
FROM scratch
ENV PORT 8080

ARG DB_PW
ARG DB_HOST
ENV DB_PW=$DB_PW
ENV DB_HOST=$DB_HOST

COPY my-binary /usr/local/bin/

CMD ["my-binary"]
```

Now from my local machine when building the go binary, I got this error when trying to start the service in docker: `standard_init_linux.go:175: exec user process caused "exec format error"`. After doing a little thinking, I realized that the OS X binary wouldn't run in a linux image. This is easy to fix with go's ability to cross-compile. In the shell script that build our go binary, I simply changed `go build` to be `env GOOS=linux GOARCH=amd64 go build`.

However, after trying to run this in docker again, I _still_ couldn't get my app server working. What's worse, I was getting the exact same error. The general consensus of the internet was that I was missing a shebang line for my shell script (which I don't have!). It wasn't until I stumbled across [this stackoverflow question](http://stackoverflow.com/questions/34729748/installed-go-binary-not-found-in-path-on-alpine-linux-docker) that I discovered there was another underlying issue, Cgo. One of the major selling points of go is that it's statically linked, but apparently Cgo still depends on server binaries. Because I don't use Cgo, the simple solution was to change my build commands once again to `env GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build`. With this I could get my go binary running locally and in Amazon ECS. But there was another issue...

### Managing credentials

Typically, my team will use environment variables for for managing credentials. This has the advantage of being easy to set up on both a developer's environment and in deployments. I typically want to supply these to the image I deploy at build time, so it was pretty straightforward to include these in my Dockerfile and fetch them from Amazon KMS in my build script for stashbot & Jenkins to pick up. This is the reason for the ARG & ENV commands in the Dockerfile above.

The issue came about with the unique setup my company has for build automation. They use a custom script to build & package Docker images on Jenkins, which doesn't pass any kind of `--build-arg` flag. This means that my prior approach for passing credentials won't cut it, unless I want to maintain a custom version of their deployment script (and it's _quite_ a script, so I decided to pass on that idea). Once again, I turned to the go toolchain for a solution.

Prior to this, my go code ran a simple `os.Getenv("DB_PW")` as you would expect to fetch the necessary sensitive information. Since this can't be passed to docker though, I decided to bake it directly into the go binary similar to [this cloudflare blog](https://blog.cloudflare.com). Although this is ideally suited for metadata, it could also be applied rather well for this problem. The cheap and cheerful solution was to check if the credentials had already been set when the server starts up, and pull them from the environment if they haven't for the sake of other developers' sanity. This means in automation everything is packaged in the binary, but on a developer's machine they can continue to use environment variables for credentials as they expect.

### The final product

Our Dockerfile is actually simplified from the original environment, given that docker no longer cares about our credentials:

```
FROM scratch
ENV PORT 8080

COPY my-binary /usr/local/bin/

CMD ["my-binary"]
```

Our go build command on the other hand has gotten quite verbose:

```
env CGO_ENABLED=0 go build -ldflags="-X main.DB_HOST=$DB_HOST -X main.DB_PW=$DB_PW" -v
```

These problems are great examples of the love-hate relationship I have with go. Having a statically linked binary that builds incredibly fast is _awesome_, but with Cgo it isn't _really_ statically linked. Little things like that can drive developers crazy. But once I got few the first few hurdles, I have a project that compiles (and _cross-compiles_) within a few seconds and at runtime is exceptionally low-overhead.

If I'm being completely honest... that relationship with go is 90-10 love-hate though. <3
