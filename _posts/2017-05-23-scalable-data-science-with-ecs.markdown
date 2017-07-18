---
layout: post
title: Scalable Data Science - Running R on AWS ECS
navigation: True
categories: Nathan
subclass: 'post tag-2017'
tags: 2017
cover: 'assets/images/servers.jpg'
---

As part of the data science work I do at my company, we run several computationally expensive processes. Most of these processes, like [lsmeans](https://cran.r-project.org/web/packages/lsmeans/lsmeans.pdf), grow dramatically in terms of runtime with larger and larger datasets. As we would like to be able to run a large number of models at once to accelerate our development, we need a way of running these in a scalable fashion. The startup time of new EC2 instances can be slow, so we need a way that we can have very bursty, on-demand compute.

### Limitations of AWS Lambda

The initial idea for this implementation was to use AWS Lambda as a large pool of compute. This was inspired by [this blog post on analyzing genomic data](https://aws.amazon.com/blogs/compute/analyzing-genomics-data-at-scale-using-r-aws-lambda-and-amazon-api-gateway/).

There's an [outstanding issue on the repository](https://github.com/station-x/lambda-r-survival-stats/issues/2) that has the code for that blog post, due to changes to the amazon linux image. During my exploration of their build process, I was frustrated with the idea of having to run an EC2 instance just to get linux binaries. As amazon linux does have an image in Docker Hub, it was easy enough to replicate the process and solve the binary issue on my local machine:

{% highlight bash %}
from amazonlinux:latest

RUN yum -y update && yum -y upgrade
RUN yum install -y python27-devel python27-pip gcc gcc-c++ readline-devel libgfortran.x86_64 R.x86_64 zip

RUN R -e 'options(repos=structure(c(CRAN="http://cran.wustl.edu/")));install.packages("lsmeans")' # and more R!
RUN pip install virtualenv awscli

ENV AWS_ACCESS_KEY_ID=""
ENV AWS_SECRET_ACCESS_KEY=""
ENV S3_URL=""

RUN mkdir -p /lambda/lib
COPY script.sh /
COPY lambda/handler.py /lambda/

CMD ["/script.sh"]
{% endhighlight %}

You can then run a [fairly straightforward build script in your container](https://github.com/nmcginn/lambda-r/blob/master/script.sh) which uploads your packaged lambda-ready R & python code to S3.

While this was very promising, there are some pretty strict limitations on AWS Lambda that limit its viability for our purposes. The 300 second execution time would limit our datasets to sizes that are too small for the goals we want to accomplish, and the maximum memory of 1.5GB is restrictive as well.

### What a solution with fewer limits looks like

As our infrastructure already heavily leverages Elastic Container Service for web services (as I mentioned in my [previous blog post](/2017/2017/04/13/running-go-on-aws.html)), this docker-based build approach started steering me in the right direction. It's relatively straightforward to take your favorite base docker image and install R on it, so why not just run the process directly on an ECS cluster?

The docker image looks very similar to the one above, but our script instead invokes the R process directly. We already store results to S3, so when the model run is completed the results simply appear in our dashboard. Because the cluster is rather large and always-on, we can deploy multiple models to already-running EC2 instances and allow them to all execute independently.

It's simple enough to include a script in the repository that starts the ECS task with overridable environment variables which R uses to drive the modeling behavior. The relevant bits being [ecs.run_task](https://boto3.readthedocs.io/en/latest/reference/services/ecs.html#ECS.Client.run_task) with [cloudformation.describe_stack_resources](https://boto3.readthedocs.io/en/latest/reference/services/cloudformation.html#CloudFormation.Client.describe_stack_resources) to get your cluster (this can probably be accomplished only using the ECS client, but ¯\\\_(ツ)\_/¯):

{% highlight python %}
#!/usr/bin/env python
# ... some scaffolding & arguments handling, then:
ECS = boto3.client('ecs')
response = ECS.run_task(
  cluster=cluster,
  taskDefinition='model-definition',
  overrides={
    'containerOverrides': [
      {
        'environment': [
          {
            'name': 'MODEL_CONFIG',
            'value': model_config
          }
        ],
        'name': 'model-definition'
      }
    ]
  }
)
print response.get('tasks', [])
{% endhighlight %}

Notice the `environment` override. That environment variable is passed into the R script which references a model configuration, allowing us to have many models that can happily coexist in 1 framework ☺
