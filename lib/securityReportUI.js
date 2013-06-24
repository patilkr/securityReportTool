/* 
 * 
 * ToolName: Security Report Tool
 * File Purpose: Regiter ToolBox panel and GCLI commands
 * Author: PATIL Kailas
 * 
 */

const {Cc,Ci,Cu} = require("chrome");

// Get Developers Tools 
const { gDevTools } = Cu.import('resource:///modules/devtools/gDevTools.jsm', {}); // We can also use 'null' for {}
const { Toolbox } = Cu.import('resource:///modules/devtools/Toolbox.jsm', {});
const { TargetFactory } = Cu.import('resource:///modules/devtools/Target.jsm', {});

// dump("\n\n gDevTools = "+ gDevTools);

var data = require("self").data;
var lib = require("self").lib;
let toolbox;


exports.registerSecurityReportTool = function registerSecurityReportTool() {
  let securityToolDefinition = {
    id: "security-report-tool",
    label: "Security Report",
    icon: data.url("images/icon.png"),
    url: data.url("securityReport.xhtml"),
    tooltip: "Security Report Tool",
    isTargetSupported: function() true,
    build: function() {}
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