const {Cc,Ci,Cu} = require("chrome");

const xpcom = require("xpcom");

try { Cu.import("resource://gre/modules/Services.jsm"); } catch (e) { }
try { Cu.import("resource://gre/modules/XPCOMUtils.jsm"); } catch (e) { }
try { Cu.import("resource://gre/modules/NetUtil.jsm"); } catch (e) { }

// Include our custom Modules
const securityReportUI = require("securityReportUI");

/*
* Code to intercept messages sent to Error Console (aka. Browser Console)
*/
var errorListener = {
    observe: function(aMessage) {
        // Get nsIScriptError object to retrieve "category" info of msg
        let error = aMessage.QueryInterface(Ci.nsIScriptError);
        
        if (error instanceof Ci.nsIScriptError) {
         //   dump("\n Message category:  "+error.category +"\n");
         // Send captured message data for display in UI
         securityReportUI.displayErrorMsg(error, aMessage);

         //  dump("\n Content Script- Message category:  "+error.category +"\n");

        }
       
        // dump("\n Message = "+aMessage.message);

       // if (aMessage.message.contains("NS_ERROR"))
          //  dump("NS_ERROR messages");
    }
};

// Register event listener for console message service to captrue msg
 var consoleService = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
 consoleService.registerListener(errorListener);

/*
 * Observer registration on Security Errors and Warnings
 * CSP observer event = "csp-on-violate-policy"
 * mixed-content observer event =  ""
 * SSL observer event =  ""
 * CORS observer event =  ""
 */
var ConsoleAPIObserver = {
  init: function init() {
   dump("\n Init invoked!! \n");   
   Services.obs.addObserver(this, "csp-on-violate-policy", false);
   // Services.obs.addObserver(this, "ssl-errors-or-warnings", false);
  },  

    observe: function observe(aSubject, aTopic, aData) {
        if (aTopic === "csp-on-violate-policy") {
            dump("\n\n aTopic = " + aTopic);
            dump("\n aData = " + aData);

            try {
                var uri = aSubject.QueryInterface(Ci.nsIURI);
                if (uri instanceof Ci.nsIURI) {
                    dump("\n aSubject.data = " + uri.asciiSpec);
                }
            } catch (e) {
                //if that fails, the aSubject is probably a string
                var str = aSubject.QueryInterface(Ci.nsISupportsCString);
                dump("\n aSubject is a STRING!!! str = " + str + "\n");
            }

        } // end of "csp-on-violate-policy" topic
        
        if (aTopic === "ssl-errors-or-warnings") {
            dump("\n\n aTopic = " + aTopic);
            dump("\n aData = " + aData);
        } //end of "" topic

    } // end of observer function
  
}; // end of consoleAPIObserver object
ConsoleAPIObserver.init();




/*
* ConsoleMessage and observer notification interception code Ends here
*/
// -----------------------------------------------------------------------



/*
* Code to add "Security Report" to Developer Tools Toolbox
*
* Code References:
*  https://developer.mozilla.org/en-US/docs/Tools/DevToolsAPI
*  https://developer.mozilla.org/en-US/docs/Social_API_Devtools
*  http://mxr.mozilla.org/mozilla-aurora/source/browser/devtools/framework/test/browser_toolbox_dynamic_registration.js
*/


// Register ToolBox Panel
securityReportUI.registerSecurityReportTool();


// ----------------------------------------------------------------------------------
// Add-on Unload Routine
require("unload").when(function() { 
    // Unregister security report tool
   securityReportUI.securityReportToolUnregister();
});
// ----------------------------------------------------------------------------------

