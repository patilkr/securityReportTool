const {Cc,Ci,Cu} = require("chrome");

const xpcom = require("xpcom");

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");

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
* ConsoleMessage interception code Ends here
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

// Include our custom Modules
const securityReportUI = require("securityReportUI");

// Register ToolBox Panel
securityReportUI.registerSecurityReportTool();


// ----------------------------------------------------------------------------------
// Add-on Unload Routine
require("unload").when(function() { 
    // Unregister security report tool
    securityReportUI.securityReportToolUnregister();
});
// ----------------------------------------------------------------------------------

