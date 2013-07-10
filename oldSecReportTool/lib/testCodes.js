/* 
 * This is a test File
 * Code in this file is use for testing. It is not included in main-addon
 */


//---------------------------------------------------------------------------------
//// Get Developers Tools 
//const { gDevTools } = Cu.import('resource:///modules/devtools/gDevTools.jsm', {}); // We can also use 'null' for {}
//
//const { Toolbox } = Cu.import('resource:///modules/devtools/Toolbox.jsm', {});
//const { TargetFactory } = Cu.import('resource:///modules/devtools/Target.jsm', {});
//
//
//dump("\n\n gDevTools = "+ gDevTools);

var data = require("self").data;
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



// gDevTools.once("tool-registered", testToolRegistered);

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

//-------------------------------------------------------------------------