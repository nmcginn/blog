---
layout: post
title: Learning to debug SharePoint
navigation: True
categories: Nathan
subclass: 'post tag-2014'
tags:
  - 2014
cover: 'assets/images/banner.png'
---

### The Problem

When I came to my current job roughly 9 months ago, I had just graduated college. I told my supervisor that I loved C#, which is absolutely true. That got me labeled as the "SharePoint guy", which is a bit scary because I've never worked with SharePoint.

I, with the help of some support folks at Microsoft, wrote a little bit of custom code for our new SharePoint 2013 environment. It was a claims provider to resolve email addresses for our external users, because out of the box SharePoint wouldn't send notification emails to these folks. I thought I had a working solution and it was an open and shut case, until I got an email with the following bit taken from the ULS logs: 

	An exception occurred in Graybar Customer Claim Provider claim provider
		...
	ClaimsProvider.FindUserClaims(String keySearch)
		ClaimsProvider.search(String keyWord)
		ClaimsProvider.FillResolve(Uri context, String[] entityTypes, SPClaim resolveInput, List`1 resolved)


My first instinct is "well shit what did I do". A failure in SharePoint would occur when DocAve tried to create a new site collection, and of course my code is being implicated. A few code tweaks and a ton of emails later, this issue is still plaguing us, even though my exceptions have disappeared. The nice folks at AvePoint were convinced that my code was problematic, seeing as it was being called out from DocAve's logs. The problem I had with this theory is the fact that the stacktrace referenced a method whose implementation goes something like this:

{% highlight C# %}
// this is where we need to query AD and grab whatever users we need
public static List<string[]> FindUserClaims(string keySearch)
{
	//Assemble the returning info
	List<string[]> results = new List<string[]>();
	try
	{
		// some junk
	}
	catch (Exception ex)
	{
		CustomLogger.Log("Exception thrown: " + ex.Message);
	}
	return results;
}
{% endhighlight %}
		
Now in this code snippet, I find it hard to fathom *where* exactly this exception is being thrown and not handled. Having stumped AvePoint, we go back to the Microsoft folks. We dig through the ULS logs and DocAve's logs until we finally find something of interest:

		GAObjectBase 0- An error occurred while ensure user and create site collection.
		Microsoft.SharePoint.SPException: A user name or an e-mail address must be specified.
		
			 at Microsoft.SharePoint.SPSecurity.ResolveUser
			 at Microsoft.SharePoint.Administration.SPPolicy..ctor
			 at Microsoft.SharePoint.Administration.SPPolicyCollection.Add
			 at AOS.Graybar.Templates._Shared.Application.ExecuteSharedClientSiteTemplateActions
			 at AOS.Graybar.Templates.Commercial.Application.Provision
			 at AOS.Graybar.Templates.TemplateProvisioningProvider.<>c__DisplayClass1.<Provision>b__0
			 at Microsoft.SharePoint.SPSecurity.<>c__DisplayClass5.<RunWithElevatedPrivileges>b__3
			 at Microsoft.SharePoint.Utilities.SecurityContext.RunAsProcess
			 at Microsoft.SharePoint.SPSecurity.RunWithElevatedPrivileges
			 ...
			 
When we say "A user name or e-mail address must be specified" we thought this confirmed our issue was related to the claims provider. Long story short, the "AOS.Graybar" namespace was being used by some consultants who wrote a SharePoint web app for us, on the same farm but a completely different site. This code was off the radar for this issue, because it was a completely separate web app. However, after reflecting into the DLL, we found the following line: 
`SPPolicy sPPolicy = web.Site.WebApplication.Policies.Add("", "");`

This line seemed fine to me, until we reflected into Microsoft.SharePoint and followed down the method calls to the inside of Microsoft.SharePoint.SPSecurity.ResolveUser, which began with something along the lines of:
`if (arg0.IsNullOrEmpty()) throw new SPException();`

Well there's your problem.

### What I Learned From All This

#### In a complex environment, not everything is straightforward
Just because there was custom code in the environment relating to authentication, and it appeared to be an authentication issue, doesn't mean that custom code was the culprit. We spent well over a week of back and forth trying to solve an issue in the claims provider, when there wasn't an issue with the claims provider. We should've gone straight to the DocAve logs instead of the ULS logs, because the issue only occurred in DocAve.

#### DLLs are not black boxes
The issue was finally solved when we examined the stacktrace from the DocAve logs and found a failure coming from the `AOS.Graybar` namespace, which was outside of the scope of everything we had been looking at. Rather than waste a day of back and forth with the consultants, we reflected into the assembly and followed the trace down to find the root cause quickly. (This was cool because as a junior dev I still find disassembling DLLs to be awesome black magic)

#### Sometimes you just need to ask the right person for help
Bringing the M$ consultant in solved this problem within an hour. Why? A combination of 2 factors. One is simply the expertise and familiarity with SharePoint, but the other is the fact that he came into this issue with no bias. To him, this was just another SharePoint install, so he was able to take a step back and break our tunnel vision.