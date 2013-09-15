/* 
 * 
 * ToolName: Security Report Tool
 * File Purpose: Regiter ToolBox panel and GCLI commands
 * Author: PATIL Kailas
 * 
 */

/*
 *  TODO List
 *  1. Tab reloading should reset values in reportUI.CSP, Insec_Passwd, etc
 *  2. Tab switching should display correct contents
 *  3. Icon of the Security Report Tool
 *  4. Exit button click doesn't work
 *  5. Improve Developer tools UI of the add-on
 */

const {Cc,Ci,Cu} = require("chrome");

// Get Developers Tools

const {gDevTools} = Cu.import("resource:///modules/devtools/gDevTools.jsm", {}); // We
																																									// can
																																									// also
																																									// use
																																									// 'null'
																																									// for
																																									// {}

let Toolbox;
try {
	// This file doesn't exists in FF23.0a2 or it's path is incorrect.
	Toolbox = Cu.import("resource:///modules/devtools/Toolbox.jsm", null); 
} catch (e) {
	// dump("\n\n\n ERROR in importing Toolbox.jsm file!!!");
}
let TargetFactory;
let tools;
try {
	tools = Cu.import("resource://gre/modules/devtools/Loader.jsm", {}).devtools;
	TargetFactory = tools.TargetFactory; 
} catch (e) { }

// FileUtils for handling files
Cu.import("resource://gre/modules/FileUtils.jsm");

// try {

// // this file doesn't exists in FF 23.0a2 or it's path is incorrect.
// TargetFactory = Cu.import("resource:///modules/devtools/Target.jsm", null);
// } catch (e) {
// // dump("\n\n\n ERROR im importing Target.jsm file!!!");
// }


/* Depending on the version of Firefox, promise module can have different path */
try { Cu.import("resource://gre/modules/commonjs/promise/core.js"); } catch(e) { }
try { Cu.import("resource://gre/modules/commonjs/sdk/core/promise.js"); } catch(e) { }

// Cu.import("resource:///modules/devtools/EventEmitter.jsm");

// dump("\n\n gDevTools = "+ gDevTools);

var data = require("self").data;
const observer = require('observer-service');
var tabs = require("sdk/tabs");
const {URL} = require("url"); 

var observerService = null;

exports.displayErrorMsg = function displayErrorMsg(aError, aMsg) {

	if (!reportUI.panelWin || typeof(reportUI.panelWin) === "undefined") return;

	// dump("\n\n Error Category = " + aError.category);
	// dump ("\n aMsg = " +aMsg.message);

	if (aMsg.message.indexOf("(Error") !== -1) { // ssl error code
		reportUI.SSL += aMsg.message + "\n";
	} else if (aError) {
		  if (aError.category === "Content Security Policy" || aError.category === "CSP") { // csp
																																												// //
																																												// violation
		    reportUI.CSP +=  aMsg.message + "\n";
		  } else if (aError.category === "Mixed Content Blocker") { // mixed-content
		  	reportUI.Mixed_content += aMsg.message + "\n";
		  } else if (aError.category === "Insecure Password Field") { // insecure
																																	// password
																																	// field
		  	reportUI.Insec_Passwd += aMsg.message + "\n";
		  } else if (aError.category === "Invalid HSTS Headers") {
		  	reportUI.HSTS += aMsg.message + "\n";		  	
		  }
	}


	switch (reportUI.uiState) {
		case 1:
			reportUI.panelWin.document.getElementById('logTextarea').value = reportUI.CSP; 
			break;
		case 2:
			reportUI.panelWin.document.getElementById('logTextarea').value = reportUI.Insec_Passwd; 
			break;
		case 3:
			reportUI.panelWin.document.getElementById('logTextarea').value = reportUI.Mixed_content; 
			break;
		case 4:
			reportUI.panelWin.document.getElementById('logTextarea').value = reportUI.SSL; 
			break;
		case 5:
			reportUI.panelWin.document.getElementById('logTextarea').value = reportUI.Sec_headers; 
			break;
	}
	// if (reportUI.panelWin.document.getElementById("csp").className ===
	// "current") {
	// }

};


let reportUI = {
		init: function(iframeWindow, aToolbox) {
			this.toolbox = aToolbox;
			this.panelWin = iframeWindow;

			this.uiState = 1;
			// Error Msg type
			this.CSP = "";
			this.Insec_Passwd = "";
			this.Mixed_content = "";
			this.SSL = "";
			this.Sec_headers = "";
			this.HSTS = "";
			this.domainName = "";
			this.oldDomainName = "";
			
			this.content = this.toolbox.target.tab.linkedBrowser.contentWindow;
			this._window = this.toolbox.target.tab.ownerDocument.defaultView;
			// dump("\n\n\n this.content = "+ this.content);
			// dump("\n this._window = "+ this._window);
			// let parentDoc = iframeWindow.document.defaultView.parent.document;
			// this.test();
			this._window.addEventListener("unload", this.destroy, false);

			// Process change in the active tab
			reportUI.panelWin.document.documentElement.addEventListener("addon-message", function(event) {
				// dump("\n\n KRP1:"+event.detail);
				reportUI.uiState = event.detail;
				switch(event.detail) {
					case 1:
						if (reportUI.CSP === "") {
							reportUI.panelWin.document.getElementById('logTextarea').value = "No CSP violations reported on this web page.";
						} else {
							reportUI.panelWin.document.getElementById('logTextarea').value = reportUI.CSP;
						}
					break;
					case 2: 
						if (reportUI.Insec_Passwd === "") {
							reportUI.panelWin.document.getElementById('logTextarea').value = "No insecure password fields noticed on this web page.";
				    } else {
						  reportUI.panelWin.document.getElementById('logTextarea').value = reportUI.Insec_Passwd;
						}
					break;
					case 3:
						if (reportUI.Mixed_content === "" ) {
							reportUI.panelWin.document.getElementById('logTextarea').value = "No mixed-content observed on this web page";
						} else {
							reportUI.panelWin.document.getElementById('logTextarea').value = reportUI.Mixed_content;
						}
					break;
					case 4: reportUI.panelWin.document.getElementById('logTextarea').value = reportUI.SSL;
					break;
					case 5: reportUI.panelWin.document.getElementById('logTextarea').value = reportUI.Sec_headers;
					break;
				}
			}, false);
			
			// Download complete security report button clicked
			reportUI.panelWin.document.documentElement.addEventListener("downloadReport-message", function(event) {
				reportUI.createAReportFile();
			}, false);			
			
		},
		
		createAReportFile: function() {
			var file = Cc["@mozilla.org/file/directory_service;1"].
			getService(Ci.nsIProperties).
			get("Desk", Ci.nsIFile);
			var filename = "securityReport";
			var currentTime = new Date();
			var date = currentTime.getDate() + "-" + (currentTime.getMonth() + 1) + "-" + currentTime.getFullYear();
			var time = currentTime.getHours() + "-" + currentTime.getMinutes() + "-" + currentTime.getSeconds();
			filename += "--" + date + "--" + time;
			filename+= ".htm";
			file.append(filename);
			file.createUnique(Ci.nsIFile.NORMAL_FILE_TYPE, 0666);
			// dump("\n file path = "+file.path+"\n");
		},
		
		destroy: function() {
			dump("\n\n\ Destroy funciton invoked!!\n\n");
			this._window = null;
			this.content = null;
			return Promise.resolve(null);
		},

}; // end of reportUI function


 // Ready event on Tabs
  tabs.on('ready', function(evtTab){ 
  	try { 
  		if (!reportUI.panelWin || typeof(reportUI.panelWin) === "undefined") return; 
  		
  		dump("\n Ready event fired\n");
  		if (evtTab.url !== "about:blank") {
  			if (!(URL(evtTab.url).host) || URL(evtTab.url).host === null) // if host
																																			// is null
  				return;
  			if (URL(evtTab.url).scheme === "about")
  				return;
  			
  			var hostName = URL(evtTab.url).scheme + "://" + URL(evtTab.url).host;
  			dump("\n READY event - hostName = " + hostName + "\n");
  			
  			if (reportUI.oldDomainName === "") {
  				reportUI.oldDomainName = hostName;
  			}   			
// // Handle Page reload scenario
// reportUI.CSP = "";
// reportUI.Insec_Passwd = "";
// reportUI.Mixed_content = "";
  		}
  	} catch (e) { }
  });
  		
 

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
	addHttpResponseObserver();
	addCommands(); // register GCLI commands
} // end of registerSecurityReportTool() function

function getBrowserFromChannel(aChannel) {
	try {
		var notificationCallbacks = 
			aChannel.notificationCallbacks ? aChannel.notificationCallbacks : aChannel.loadGroup.notificationCallbacks;

		if (!notificationCallbacks)
			return null;

		var domWin = notificationCallbacks.getInterface(Ci.nsIDOMWindow);
		return domWin.document;
		// return gBrowser.getBrowserForDocument(domWin.top.document);
	}
	catch (e) {
		return null;
	}
} // end of getBrowserFromChannel() function


function checkHttpHeaders(httpChannel) {
	var counter = 0;
	try {
		var cspRules = httpChannel.getResponseHeader("Content-Security-Policy");
		if (cspRules) {
			counter += 1;
			reportUI.Sec_headers += counter + ": Using 'Content-Security-Policy' HTTP/S Header \n";
		}
	} catch (e) {
		counter += 1;
		reportUI.Sec_headers += counter + ": Missing 'Content-Security-Policy' HTTP/S Header. For more information about CSP visit: https://developer.mozilla.org/en/docs/Security/CSP \n";
	}
	try {
		var cspRules = httpChannel.getResponseHeader("X-Content-Security-Policy");
		if (cspRules) {
			counter += 1;
			reportUI.Sec_headers += counter + ": Using 'X-Content-Security-Policy' HTTP/S Header. This policy will only work in Firefox/IE but not in Google Chrome. \n   Please use 'Content-Security-Policy' Header.  For more information about CSP visit: https://developer.mozilla.org/en/docs/Security/CSP \n";
		}
	} catch (e) {
		// counter += 1;
		// reportUI.Sec_headers += counter + ": Missing 'Content-Security-Policy'
		// HTTP/S
		// Header \n";
	}
	try {
		var cspRules = httpChannel.getResponseHeader("X-WebKit-CSP");
		if (cspRules) {
			counter += 1;
			reportUI.Sec_headers += counter + ": Using 'X-WebKit-CSP' HTTP/S Header. This policy will only work in Google Chrome and Safari web browsers. \n   Please use 'Content-Security-Policy' Header. For more information about CSP visit: https://developer.mozilla.org/en/docs/Security/CSP \n";
		}
	} catch (e) {
		// counter += 1;
		// reportUI.Sec_headers += ": Missing 'Content-Security-Policy' HTTP/S
		// Header
		// \n";
	}
	try {
		var xFrameOptions = httpChannel.getResponseHeader("X-Frame-Options");
		if (xFrameOptions) {
			counter += 1;
			reportUI.Sec_headers += counter + ": Using 'X-Frame-Options' Header \n";
		}
	} catch (e) {
		counter += 1;
		reportUI.Sec_headers += counter + ": Missing 'X-Frame-Options' Header. Your site can be framed by other websites. For more information visit: https://developer.mozilla.org/en-US/docs/HTTP/X-Frame-Options \n";
	}
	try {
		var HSTS = httpChannel.getResponseHeader("Strict-Transport-Security");
		if (HSTS) {
			counter += 1;
			reportUI.Sec_headers += counter + ": Using 'Strict-Transport-Security' Header. \n";
		}
	} catch (e) {
		counter += 1;
		reportUI.Sec_headers += counter + ": Missing 'Strict-Transport-Security' Header. For more information visit: https://developer.mozilla.org/en-US/docs/Security/HTTP_Strict_Transport_Security\n";
	}
} // end of checkHttpHeader() function

function httpResponseObserver(aSubject, aTopic, aData) {

	var httpChannel = aSubject.QueryInterface(Ci.nsIHttpChannel);

	if (!reportUI.panelWin || typeof (reportUI.panelWin) === "undefined")
		return;

	if (httpChannel.responseStatus === 200) {
		var doc = getBrowserFromChannel(httpChannel);
		if (doc === null) {// if its null then no document available
			return;
		}

		var hostName = doc.location.protocol + "//" + doc.location.host;
		var responseName = httpChannel.URI.scheme + "://" + httpChannel.URI.host;
		// dump("\n\n HTTP Handler; hostName = " + hostName);
		// dump("\n responseName = " + responseName);

		try {
			var contentType = httpChannel.getResponseHeader("Content-Type");
			if (contentType) {
				if (contentType.indexOf("html") != -1) {
					dump("\ncontentType = "+ contentType);
					try {
						if (!reportUI.panelWin || typeof(reportUI.panelWin) === "undefined") return;

						reportUI.domainName = responseName; // Domain of security logs
							if (reportUI.SSL !== "") {
								dump("\n\n SSL error string is not EMPTY!!! \n\n");
								dump("\n httpChannel.URI.host = " + httpChannel.URI.host);
								if ((reportUI.SSL).indexOf(httpChannel.URI.host) === -1) {
									reportUI.SSL = "";
									dump("\n\n SSL errors cleared!!");
								}
							}					
						reportUI.CSP = "";
						reportUI.Insec_Passwd = "";						
						reportUI.Mixed_content = "";
						reportUI.Sec_headers = "";
						reportUI.HSTS =  "";
					} catch (e) {

					}
					checkHttpHeaders(httpChannel);
				}
			}
		} catch (e) {

		}
	} // end of responseStatus == 200 IF loop

} // end of httpResponseObserver() function

// UnRegister Security Report Tool from ToolBox
exports.securityReportToolUnregister = function securityReportToolUnregister() {
	gDevTools.unregisterTool("security-report-tool");
	// dump("\n Security Report Tool is unregistered from ToolBox");
	removeCommands(); // Un-rgister GCLI commands
	removeHttpResponseObserver(); // Un-register HTTP response observer
																// notifications
} // end of securityReportToolUnregister() function

// Add HTTP observer to monitor response
function addHttpResponseObserver() {
	// Register observer service for http events
	observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
	observerService.addObserver(httpResponseObserver, "http-on-examine-response", false);
}

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

} // end of removeCommands() function

// Remove HTTP observer
function removeHttpResponseObserver() {
	if (observerService) {
		observerService.removeObserver(httpResponseObserver, "http-on-examine-response");
	}
}


