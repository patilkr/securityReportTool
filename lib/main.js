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
        
        if (error instanceof Ci.nsIScriptError)
            dump("\n Message category:  "+error.category +"\n");
       
        dump("\n Message = "+aMessage.message);

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

// Get Developers Tools 
const { gDevTools } = Cu.import('resource:///modules/devtools/gDevTools.jsm', {}); // We can also use 'null' for {}

const { Toolbox } = Cu.import('resource:///modules/devtools/Toolbox.jsm', {});
const { TargetFactory } = Cu.import('resource:///modules/devtools/Target.jsm', {});


dump("\n\n gDevTools = "+ gDevTools);

var tabs = require('tabs');
let toolbox;

// When "onDOMContentLoaded" event fires on web page, this fun is invoked
tabs.on('ready', function(evtTab) {
    dump("\nTargetFactory =" +TargetFactory);
    let browserWindow = Services.wm.getMostRecentWindow("navigator:browser");
    dump("\n browserWindow = "+ browserWindow);

    dump("\n browserWindow.gBrowser = "+browserWindow.gBrowser);
    let gBrowser = browserWindow.gBrowser;

    let target = TargetFactory.forTab(gBrowser.selectedTab);

    // Show our toolbox when web page is loaded
    gBrowser.selectedBrowser.addEventListener("load", function onLoad(evt) {
        gDevTools.showToolbox(target);
    }, true);

});


gDevTools.registerTool({
     id: "security-report-tool",
     label: "Security Report",
     url:"test.xhtml",
     isTargetSupported: function() true,
     build: function() {}
   });

gDevTools.once("tool-registered", testToolRegistered);

function testToolRegistered(event, toolId) {    
    // let doc = toolbox.frame.contentDocument;
    // let tab = doc.getElementById("toolbox-tab-" + toolId);
    // dump("\n tab = "+ tab); 
    // let panel = doc.getElementById("toolbox-panel-" + toolId);
    // dump("\n Panel = "+ panel);
    // for (let win of getAllBrowserWindows()) {
    //     let command = win.document.getElementById("Tools:" + toolId);
    //     dump("\n Command = "+ command);
    //     let menuitem = win.document.getElementById("menuitem_" + toolId);
    //     dump("\nmenuitem = "+menuitem);
    // }

    //// Unregister Security Report Tool
    //// securityReportToolUnregister();
}
 
 function getAllBrowserWindows() {
   let wins = [];
   let enumerator = Services.wm.getEnumerator("navigator:browser");
   while (enumerator.hasMoreElements()) {
     wins.push(enumerator.getNext());
   }
   return wins;
 }

// UnRegister Security Report Tool from ToolBox
function securityReportToolUnregister() {
    gDevTools.unregisterTool("security-report-tool");
    dump("\n Security Report Tool is unregistered from ToolBox");
}

//-------------------------------------------------------------------------