# 2014 - REST in the SAP Portal

### The Problem

The paradigm for developing internal portal applications in my team was a conventional approach: JSP DynPage web applications. Although this works well for some things, a lot of more modern features (HTML5/CSS3) did not work with this type of application. Out of frustration, I wanted to come up with a new approach for developing portal applications. Wanting to stick with a rough MVC structure, I decided that the best approach would be to serve static content (HTML/CSS/JavaScript) and have the JavaScript call a RESTful web service for serverside duties. Sadly, the SAP portal doesn't have an easy mechanism for creating RESTful web services.

### The Solution

#### Getting modern features to work properly
When serving static HTML, even the most basic modern features would stop working. After some investigation, it turned out the reason for this was that the portal sets a header in the response forcing IE into EmulateIE7 mode (and of course our company-approved browser is IE). The solution to this was to create a URL iView instead of a conventional iView pointing directly to the HTML:

![URL iView](https://i.imgur.com/7K1HkdB.png)

#### Creating the web service

To create the web service, the best approach appeared to be using an `AbstractPortalComponent`:

```java
public class NewHomePageWs extends AbstractPortalComponent
{
  @SuppressWarnings("unchecked")
  @Override
  protected void doContent(IPortalComponentRequest req, IPortalComponentResponse res) {
    IPortalComponentSession session = req.getComponentSession();
    HttpServletRequest request = req.getServletRequest();
    HttpServletResponse response = req.getServletResponse(true);
      
  // do whatever here to make beautiful JSON

  // response output
  try {
    PrintWriter writer = (PrintWriter) response.getWriter();
    response.setHeader("Content-Type","application/json; charset=UTF-8");
    writer.write(json.toJSONString());
    writer.close();
  } catch (Exception ex) {
    ex.printStackTrace();
  }
}
```
    
Initially this worked rather well, except for 1 hiccup. The component properties weren't editable because the *master language of this object is not the same as your user language*:

![Uneditable Service](https://i.imgur.com/NN59Ltp.png)

The problem with this is component properties are used to set variables that are environment-specific, so they need to be modifiable. As it turns out, this problem was fixable by creating an iView for the service (yes I realize that seems silly). In Content Administration, copying the application and using the `Paste as PCD Object` option will create the iView for our service, which we can package alongside the URL iView from before:

![Web Service iView](https://i.imgur.com/pZICtFq.png)

![Web Service Response](https://i.imgur.com/GTorTXf.png)

And now the web service is callable from our JavaScript:

![Chrome Dev Tools](https://i.imgur.com/VFaK79P.png)

WooHoo! Last bit of helpful information, although this works really well for simple web services, anything more complicated should really only use this URL iView for routing & setup. On a more complex project I created an interface called `IJSONService` which has a few methods that make them easily callable from the `AbstractPortalComponent` itself:

```java
public abstract JSONObject performGet(String[] components);
public abstract JSONObject performPut(String[] components, Map<String,String[]> params);
public abstract JSONObject performPost(String[] components, Map<String,String[]> params);
public abstract JSONObject performDelete(String[] components);
```
    
### Perceived Advantages

The SAP Portal has a gigantic scary framework with multiple ways of writing applications. Sometimes, it seems like none of those ways does what you want, and you have to be a little *creative*. So what exactly are the advantages of this whole approach?

#### MVCish separation of duties

The views are for viewing, and the service handles all the heavy lifting. Java classes representing the data all implement an interface with deserializes from a `JSONObject` and serializes to a `JSONObject` which makes shuffling objects from Java and JavaScript a breeze. Having the views just be static content makes them shorter, simpler, and a lot easier to edit without worry.

#### Performance

After profiling my RESTful service, even with calls to Active Directory & SQL, I rarely saw a response take more than 25ms. From the user perspective, the old *no one's used it in a while so let's twiddle our thumbs while the JSP compiles* problem is gone. The longest I've seen a page populate with data using this approach is a fraction of a second, which is a huge improvement over the often multi-second page load.

#### Not having to use SOAP

I believe this is clear enough.
