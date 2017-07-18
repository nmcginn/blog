---
layout: post
title: A Cheap Home Server
navigation: True
categories: Nathan
subclass: 'post tag-2015'
tags: 2015
cover: 'assets/images/windows.jpg'
---

### Preface

Hello friends. I realize it's been a while since I've written a blog post. Short story actually, I've been playing [Eve Online](https://www.youtube.com/watch?v=AdfFnTt2UT0) and I got a [motorcycle](http://i.imgur.com/Z2RyuJy.jpg). I think I've understandably been distracted. However, I think it's high time for a technical blog post. This weekend, from mostly spare hardware, I created a dope home server.

### Hardware

This build occurred due to spare hardware. My fiance was upgrading his system so we decided to put the spare hardware to good use. Fortunately, he had an AMD FX-8350 which is an 8-core, so we had enough room to put together something pretty decent. Final specs came up as:

- [Antec VSK-4000e Case](http://www.microcenter.com/product/408590/VSK-4000E_ATX_Case) ($30)
- [Thermlaktake 500W Power Supply](http://www.microcenter.com/product/365237/TR2_Series_500_Watt_ATX_Power_Supply) ($45)
- [FX-8350](http://www.microcenter.com/product/401795/FX_8350_4GHz_AM3_Black_Edition_Boxed_Processor) (Free - Recycled)
- [16GB memory](https://pcpartpicker.com/part/gskill-memory-f310666cl9d16gbxl) (Free - Recycled)
- [Crucial MX100 256GB SSD](http://www.microcenter.com/product/434188/MX100_Series_256GB_SATA_III_6Gb-s_25_Internal_Solid_State_Drive_CT256MX100SSD1) ($110)

We also can include an all-in-one single rad cooler and an additional fan, both recycled from the previous build. I ended up spending less than $200 for this guy, and out of it I got several servers. What? Several?

### Software

I wanted to get several servers out of this build, because quite frankly it has ample CPU and memory to run several boxes. I decided to use Windows Server 2012 R2 for the host, and Hyper-V to host the guest virtual machines.

- 2x Windows Server 2012 R2 instances
- 1x Ubuntu 14.04 LTS instance

I gave myself a Windows Server and a Linux instance to faff around with. All of my personal stuff (like this blog) is still hosted off Microsoft Azure, so I wanted a linux VM I could totally trash and not worry about (i.e. a dev machine). The Windows Server is basically so that I can learn Windows Server administration, which has been something I've been thinking about on the side. The second Windows Server is for my partner. He's been wanting to host game servers and the like, and once he was set up with RDP he should be able to figure things out.

### Storage

Because I already have network storage available, I decided to set up dedicated shares for each virtual machine. This has worked out really well so far, I've been saturating my gigabit switch with file transfers. Given the fact that my switch is the bottleneck, I have no problem running SMB locally for multiple clients. This also means that from ZEUS (desktop) I can directly hit the filesystem of every virtual machine, which has made moving files around pretty trivial.

### Final Result

What this looks like in the end is pretty boring actually:

![Remote Desktop Screenshot](https://i.imgur.com/1d3arJ5.png)

The fact that this screenshot is boring makes me really happy. We live in an age where creating a server with multiple virtual servers is trivially easy. The layers of complexity here between the hardware and the software kindof melt away from an end-user perspective and this lets me set something up really quickly. After some updating, hardening, and monitoring, this became a really easy and satisfying setup. I love the fact that we live in an age where I can lie to the hardware (as [Scott Hanselman said](https://www.youtube.com/watch?v=UzyoT4DziQ4)), and do whatever I want virtually. With commodity hardware I can have several enterprise-grade (software wise) servers to play with. Talk about good times to be a techie.