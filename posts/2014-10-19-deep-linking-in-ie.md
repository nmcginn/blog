# 2014 - Deep Linking in IE

A requirement came up for some folks to be able to link directly to a page in my new web app. Of course I had no problem with this, but Internet Explorer sure did. This application is an Angular SPA, which means it actually uses AJAX to populate the page content. After some initial investigation, it turns out that the people downstairs were using the correct URL, but IE was transforming it. When copied into the browser window directly, you get this:

![Good URL](https://i.imgur.com/xpzMQPX.png)

Ignore the failed data binding, that's because I wasn't authenticated when grabbing screenshots. When linked to from somewhere else, say using a normal `href`:

![Bad URL](https://i.imgur.com/dVc6Bas.png)

The second hash was being stripped out. There is no angular routing setup for `/infoheader`, so the majority of the page is big and empty. This of course doesn't work because the whole point is to link directly to the employee's info page.

I tried several things to remediate this problem: putting the `#/info#header` as a GET argument, encoding the URL, using a header redirect, using a URL shortening service... nothing seemed to work. It occurred to me that I could probably put Angular into HTML5 mode and wipe out one of the 2 hashes, eliminating the problem. In fact, there are *a lot* of simple JavaScripty solutions to this little problem. **Problem is** this code needs to be ready for consumption Tuesday night, and the next time I'm allowed to transport code to production is Thursday. Last minute requirement changes are great  (╯°□°）╯︵ ┻━┻.

So why the dual hash marks? One is for angular routing, easy enough. The other is for an `$anchorScroll` which is used to make sure the page scrolls to the top when flipping between pages. So I realized, what if we just remove the stupid `#header` in the URL? As soon as the controller runs, the route kicks in because the `#/info` is still valid, and the controller handles the `#header`. Huzzah! After so much frustration, the solution was to trim the trailing seven characters of the URL.