---
layout: default
title: Testing Scalability
category: 2015
---

I was inspired by [this Youtube video](http://www.youtube.com/watch?v=FJrs0Ar9asY) to learn how to do a little benchmarking. All the servers are running on Microsoft Azure. The benchmark server is in US-Central while the web servers are all in US-East, because honestly most end users aren't sitting in our data center are they? Note: I'm just diving into tests and writing this blog post as I go. I'm not an expert, I'm just playing around and discovering as I go.

### Test 1: Simple local caching
The [first test](https://github.com/odstderek/nginxtest/tree/aa4d9109a0cbd63f154a19f39af80edb4a2cbddc) was the simplest possible setup: everything on 1 server, no caching, simple passthrough from nginx to a single node server.

    Percentage of the requests served within a certain time (ms)
      50%    113
      66%    127
      75%    141
      80%    154
      90%    181
      95%    208
      98%    240
      99%    260
     100%    304 (longest request)

For 100 concurrent requests, that actually makes me pretty happy. Our longest request was just barely over 300ms. However, a [slight tweak](https://github.com/odstderek/nginxtest/commit/4ec501f97da7af1c214f1b399da282276f4afb66) to the nginx config yields the following:

    Percentage of the requests served within a certain time (ms)
      50%    116
      66%    129
      75%    137
      80%    142
      90%    159
      95%    168
      98%    191
      99%    207
     100%    209 (longest request)

Wow. The tiniest bit of local caching made a significant difference. The test took 1.247 seconds, compared to the 1.765 seconds of the first test. Now this is a small file which is easy to process, but that little bit of caching on nginx made a huge difference. Awesome.

### Test 2: Let's give our server some muscle

My little Azure server for test 1 was a Standard D1 instance, which translates to 1 CPU core, 4gb of memory, and SSD-backed storage. Although this is enough for my personal web server, what if I was may more popular? I might need a bigger server. So we, as Scott Hanselman put it, will attempt to "slider bar our way to glory". I made the server a D3 instance, which gives us 4 cpu cores and 14gb of memory. We're also going to bump up our benchmark's oomph, because we expect more from the system now. We're going to leave caching on, still 1 node process, and just run a more demanding test to hit our more capable hardware:

    Percentage of the requests served within a certain time (ms)
      50%     98
      66%    112
      75%    116
      80%    120
      90%    132
      95%    143
      98%   1095
      99%   5284
     100%   5939 (longest request)

Something interesting happens here, processing the requests is still rather snappy with 10,000 requests but the client seems to have some issues connecting. Maybe nginx can't handle the connections quickly enough? But nginx already had 4 worker processes, but we only have 1 node server here. Let's rerun the test with top and see if anything interesting pops up:

![Node struggling](https://i.imgur.com/d1KNoX3.png)

Oh yeah, that's what I'm talking about. It makes sense though, nginx has several processes which means it can spread the work out a little more evenly, but node only has the one. We have four cores, so let's try it with four node instances!

    Percentage of the requests served within a certain time (ms)
      50%     97
      66%    113
      75%    113
      80%    114
      90%    132
      95%   1095
      98%   2371
      99%   5444
     100%   6029 (longest request)

Ouch. Despite the high CPU usage of node, it actually wasn't the thing slowing us down. The test actually took longer to complete with 4 node processes. I had the thought that maybe the benchmarking client was slowing things down so I beefed up his resources, but that didn't make a significant difference. It looks like there's only 1 way to go from here.

### Test 3: Let's give our server some buddies

My next approach was to create 3 node servers, all D1 instances, and have the D3 nginx server act as a load balancer and forward requests to the 3 nodes. After benchmarking this, I became frustrated by the lack of improvement. I thought node and nginx were supposed to be crazy scalable. Then I had a thought, maybe my single client combined with network latency of going across the country is what's bogging everything down. There are two options here.

    1. Spin up a bunch more benchmarking servers.
    2. Move the benchmarking server closer.

For simplicity's sake, I went with option number 2. All the servers are now running in East-US. I reran the benchmarks, and tried it with 1 or 3 nodes, and my test is still struggling by with 10,000 requests taking about 30 seconds. Moving regions cut down the connection time by half, but the test is still bumming me out.

### Test 4: I don't understand how to benchmark

It always seemed to be that the issue was with getting the connection. After the client got the connection, everything was processed rather quickly. I decided, for my last test, that I needed to give my test a little help. My test changed from

    ab -n 10000 -c 100 http://nginxtest.nmcginn.com/ > test

to

    ab -k -n 10000 -c 100 http://nginxtest.nmcginn.com/ > test
    
The `-k` option for ab turns on keep-alive, which should remove the connection-grabbing issue. I'm still not sure what's causing this issue, but my test results finally gleaned that performance and scalability I've heard so much about.

1 node:

    Time taken for tests:   7.208 seconds
    Complete requests:      10000
    Failed requests:        0
    Keep-Alive requests:    9903
    Total transferred:      4459515 bytes
    HTML transferred:       1290000 bytes
    Requests per second:    1387.38 [#/sec] (mean)
    Time per request:       72.079 [ms] (mean)
    Time per request:       0.721 [ms] (mean, across all concurrent requests)
    Transfer rate:          604.20 [Kbytes/sec] received

3 nodes:

    Time taken for tests:   2.793 seconds
    Complete requests:      10000
    Failed requests:        0
    Keep-Alive requests:    9929
    Total transferred:      4462977 bytes
    HTML transferred:       1290000 bytes
    Requests per second:    3579.79 [#/sec] (mean)
    Time per request:       27.935 [ms] (mean)
    Time per request:       0.279 [ms] (mean, across all concurrent requests)
    Transfer rate:          1560.21 [Kbytes/sec] received

By load balancing our requests from 1 node server to 3, we cut the test time down from 7.208 seconds to 2.793 seconds, which means the 1 node test took 2.58x longer than the 3 node test. Finally, some sanity!

### This was stupidly fun

With minimal time investment, I was able to perform testing and benchmarking involving 5 servers. I didn't have to set up the network, or route any cables. I simply told Azure what I wanted and I got it. As someone who's never worked with load balancers or setting up a simple multi-server infrastructure, this was a really cool test. I would like to revisit the test and look into moving things back to 1 beefy server versus several smaller ones, and trying different load balancing tools, but this blog post is already eye-shatteringly long. The full test results are [available on GitHub](https://github.com/odstderek/nginxtest/tree/master/tests). Later taters.