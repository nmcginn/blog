---
layout: post
title: Microsoft.SharePoint.WebControls
navigation: True
categories: Nathan
subclass: 'post tag-2014'
tags: 2014
cover: 'assets/images/banner.png'
---

I was asked to write a custom web part for SharePoint 2013, which seemed like a fun project. Getting started, I've got Visual Studio on a SharePoint sandbox server and I'm ready to get coding. When creating the web part, I come across this dialog:

![Sandboxed or farm dialog](https://i.imgur.com/jeBVdpg.png)

Now my inclination is to check `sandboxed solution` because this is a small project that shouldn't require any major or special permissions. I open up the `VisualWebPart.ascx` file and add a "Hello, World" asp tag to make sure everything is working as expected, and sure enough everything builds, deploys, and runs as expected. Awesome. In the pre-populated tags, there's a line which goes:

    <%@ Register Tagprefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

Now this looks promising, so I go ahead and add

    <SharePoint:ListView ID="MyListView" runat="server" />
    
Expecting this to be a no-brainer, I go ahead and try to build the solution again. I get a following error: `The type or namespace name 'ListView' does not exist in the namespace 'Microsoft.SharePoint.Webcontrols' (are you missing an assembly reference?)`. Wat. The assembly was pulled in before, and ListView was offered to me in IntelliSense, so why in the hell am I getting a reference error? I do some googling, and find that the `Microsoft.SharePoint.WebControls` namespace is inside the standard `Microsoft.SharePoint.dll`. To verify this, I go ahead and open up the reference in Visual Studio:

![Missing classes](https://i.imgur.com/HmbnyGe.png)

Huh. This dll appears to be missing a class or two. I look all over for a dll that may include some other classes, maybe there's a different version or something. I eventually stumble onto a Stack Overflow answer which says to make it a farm solution instead of a sandboxed solution. How could that possible help with a dependency issue? Oh well, let's give it a try.

![Classes are back](https://i.imgur.com/OAxFjUG.png)

Wow, that's a whole lot of classes. Given that it's supposed to be the same namespace, and the same reference, this type of behavior is mind-boggling. At the end of the day, I thought I had every reference I needed, and Visual Studio was **lying** to me. If there are classes or namespaces I can't use due to something like a protection level or configuration, you can't just hide them from me. There needs to be some type of visual indication saying "this class exists and here's why you can't use it right now". Normally I love VS because she's really good about talking to you when something's wrong, but this time she just kept quiet and didn't help at all. Don't worry though, we won't be fighting for long.