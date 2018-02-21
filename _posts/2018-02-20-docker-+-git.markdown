---
layout: post
title: Docker + Git
navigation: True
categories: Nathan
subclass: 'post tag-2018'
tags:
  - 2018
cover: 'assets/images/banner.png'
---

# Starting with a great article

As someone who loves go, and uses docker as their primarily mechanism,
Pierre's article [The Go Dockerfile](https://medium.com/@pierreprinetti/the-go-dockerfile-d5d43af9ee3c) was very appealing to me.
In recent times, I've been using alpine as my base image for go programs out of convenience.
Prior to this article I wasn't familiar Docker's ability to do multi-stage builds, so this provided a good learning opportunity.
I had 2 differences to his method though, which I had to figure out. Let's take a closer look.

### Glide #1

I don't really have strong opinions about go dependency management,
but I've used [glide](https://github.com/Masterminds/glide) since I started working with go.

### Deploying Static content
