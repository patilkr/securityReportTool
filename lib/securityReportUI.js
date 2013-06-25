/* 
 * 
 * ToolName: Security Report Tool
 * File Purpose: Regiter ToolBox panel and GCLI commands
 * Author: PATIL Kailas
 * 
 */

/*
 *  TODO List
 *  1. Tab reloading should reset values in reportUI.CSP, CORS, etc
 *  2. Tab switching should display correct contents
 */

const {Cc,Ci,Cu} = require("chrome");

// Get Developers Tools 
const { gDevTools } = Cu.import('resource:///modules/devtools/gDevTools.jsm', {}); // We can also use 'null' for {}
const { Toolbox } = Cu.import('resource:///modules/devtools/Toolbox.jsm', {});
const { TargetFactory } = Cu.import('resource:///modules/devtools/Target.jsm', {});

/* Depending on the version of Firefox, promise module can have different path */
try { Cu.import("resource://gre/modules/commonjs/promise/core.js"); } catch(e) {}
try { Cu.import("resource://gre/modules/commonjs/sdk/core/promise.js"); } catch(e) {}

Cu.import("resource:///modules/devtools/EventEmitter.jsm");

// dump("\n\n gDevTools = "+ gDevTools);

var data = require("self").data;

exports.displayErrorMsg = function displayErrorMsg(aError, aMsg) {
    
    if (!reportUI.panelWin || typeof(reportUI.panelWin) === "undefined") return;
        
    dump("\n Error Category = " + aError.category);
   
    if (aError.category === "Content Security Policy" || aError.category === "CSP") {
        reportUI.CSP =  reportUI.CSP + aMsg.message + "\n";
    }        
    
    if (reportUI.panelWin.document.getElementById("csp").className === "current") {
        reportUI.panelWin.document.getElementById('logTextarea').value = reportUI.CSP; 
    }
    
    
    
};

let reportUI = {
    init: function(iframeWindow, aToolbox) {
        this.toolbox = aToolbox;
        this.panelWin = iframeWindow;
        
        // Error Msg type
        this.CSP = "";
        this.CORS = "";
        this.Mixed_content = "";
        
        this.content = this.toolbox.target.tab.linkedBrowser.contentWindow;
        this.chrome = this.toolbox.target.tab.ownerDocument.defaultView;
        dump("\n\n\n this.content = "+ this.content);
        dump("\n this.chrome = "+ this.chrome);
        // let parentDoc = iframeWindow.document.defaultView.parent.document;
        // this.test();
    },
   
}; // end of reportUI function

exports.registerSecurityReportTool = function registerSecurityReportTool() {
  let securityToolDefinition = {
    id: "security-report-tool",
    label: "Security Report",
    icon: data.url("images/icon.png"),
    url: data.url("securityReport.xhtml"),
    tooltip: "Security Report Tool",
    isTargetSupported: function(target) {
       return !target.isRemote;
    },
    build: function(iframeWindow, toolbox) {
        reportUI.init(iframeWindow, toolbox);
        return Promise.resolve(iframeWindow.reportUI);
    }
  };

  gDevTools.registerTool(securityToolDefinition); // register ToolBox
  addCommands(); // register GCLI commands
} // end of registerSecurityReportTool() function


// UnRegister Security Report Tool from ToolBox
exports.securityReportToolUnregister = function securityReportToolUnregister() {
    gDevTools.unregisterTool("security-report-tool");
    //dump("\n Security Report Tool is unregistered from ToolBox");
    removeCommands();
} // end of securityReportToolUnregister() function


// Register GCLI commands for our tool
function addCommands() {
    Cu.import("resource:///modules/devtools/gcli.jsm");
    
  /*
   * 'security-report' command.
   */
  gcli.addCommand({
    name: "security-report",
    description: "Control the security report tool using the following commands:"
  });
  // TODO --- Add more commands here
  
} // end of addCommands() function

// Unregister GCLI commands of Our tool
function removeCommands() {
  gcli.removeCommand("security-report");
  // TODO --- unregister of more GCLI commands goes here
  
} //end of removeCommands() function

let myVariable = {
    
};
