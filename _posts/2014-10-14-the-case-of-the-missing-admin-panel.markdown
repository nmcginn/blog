---
layout: default
title: The Case of the Missing Admin Panel
category: 2014
---

I was in developer training some weeks ago for Oracle WebCenter Sites, also known as OWS (or "Fatwire"). We went through the process of downloading and installing the OWS Jump Start Kit (JSK). At this point, we thought everyone was ready for training. We open up the web admin interface and log in, at which point the instructor made us all aware of a glaring problem: we were missing the admin panel.

![Missing OWS admin panel](https://i.imgur.com/epYb7cg.jpg)

The admin panel is a Java Applet (thanks, Oracle). First remediation step is obviously to update the JDK to the latest version so it will stop complaining about the security issue. No dice there. After telling the browser (IE10, Chrome, AND FireFox) that yes we were sure, nobody was seeing an admin panel. So what can cause a Java Applet to fail? Everyone seemed pretty fixated on the browser and trying to fix things there, but what if Java itself was causing the failure? Sure enough, what I tried was to go to the start menu and type in Java. The `Configure Java` entry sounded awfully tantalizing. Sure enough, it had a relevant section for "Security".

This:
![No exceptions](https://i.imgur.com/b6KZi8X.png)

Became this:
![Localhost 8080 exception added](https://i.imgur.com/X9OVb8x.png)

And Voila!
![Working admin panel](https://i.imgur.com/pntKCM5.png)

This was a fun little bit of troubleshooting. Why? Because it's a simple problem. There are only two parties involved here, the browser and Java itself. Most people just think `browser browser browser...` but when multiple browsers show the same story, you have to think that maybe something else is going on.