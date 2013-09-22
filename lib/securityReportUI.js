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
var ss = require("sdk/simple-storage"); // persistent data store APIs

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
		    reportUI.secReport[tabs.activeTab.url][3].webPageCSPViolations = true;
				reportUI.secReport[tabs.activeTab.url][4] += 1;
		  } else if (aError.category === "Mixed Content Blocker") { // mixed-content
		  	reportUI.Mixed_content += aMsg.message + "\n";
		  	// record into a detailed report
		  	reportUI.secReport[tabs.activeTab.url][1].webPageMixed_Content = true;
				reportUI.secReport[tabs.activeTab.url][4] += 1;
		  } else if (aError.category === "Insecure Password Field") { // insecure
																																	// password
																																	// field
		  	reportUI.Insec_Passwd += aMsg.message + "\n";
		  	// record into a detailed report
		  	reportUI.secReport[tabs.activeTab.url][0].webPageInsecurePwd = true;
				reportUI.secReport[tabs.activeTab.url][4] += 1;
		  } else if (aError.category === "Invalid HSTS Headers") {
		  	// add to user UI
		  	reportUI.HSTS += aMsg.message + "\n";
		  	// record in a detailed report
		  	reportUI.secReport[tabs.activeTab.url][1].webPageInvalidHSTS = true;
				reportUI.secReport[tabs.activeTab.url][4] += 1;
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


// High level error boolean variable object (index value 0)
function highErrorsState() {
	this.webPageCSP = false;
	this.webPageInsecurePwd =  false;
}

// Medium level error boolean variable object (index value 1)
function mediumErrorsState() {
	this.webPageSSLSelf_Signed = false;
	this.webPageSSLInvalid = false;
	this.webPageMixed_Content = false;
	this.webPageInvalidHSTS = false; 
	this.webPageReportOnlyCSP = false;
}

// Low level boolean variable object (index value 2)
function lowErrorsState() {
	this.webPageDepricatedCSP = false;
	this.webPageDepricatedReportOnlyCSP = false;
	this.webPageInlineScriptInCSP = false;
	this.webPageInlineStyleInCSP = false;
	this.webPageEvalInCSP = false;
	this.webPageDepricateInlineScriptCSP = false;
	this.webPageDepricateEvalCSP = false;
	this.webPageNonStdXhrDirCSP = false;
	this.webPageNonStdAncesDirCSP = false;
	this.webPageCookieSec = false;
	this.webPageCookieHttpOnly = false;
}

// Log level boolean variable object (index value 3)
function logErrorsState() {
	this.webPageMissingHTTPS = false;
	this.webPageMissingHSTS = false;
	this.webPageMissingX_Frame_Options = false;
	this.webPageSSLUnknownIssuer = false;
	this.webPageSSLMissingChain = false;
	this.webPageSSLCaInvalid = false;
	this.webPageSSLIssuer = false;
	this.webPageSSLSignatureAlgorithmDisabled = false;
	this.webPageSSLExpiredIssuer = false;
	this.webPageSSLUntrusted = false;
	this.webPageSSLcertErrorMismatch = false;
	this.webPageSSLcertErrorExpiredNow = false;
	this.webPageSSLcertErrorNotYetValidNow = false;
	this.webPageSSLNotACACert = false;
	this.webPageSSLNotImportingUnverifiedCert = false;
	this.webPageSSLBad_Key = false;
	this.webPageSSLBad_Signature = false;
	this.webPageSSLRevoked_Certificate = false;
	this.webPageSSLUsageNotAllowed = false;
	this.webPageCSPViolations = false;
}


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
			
			this.domainName = ""; // ???
			this.oldDomainName = ""; // ?? need to check usage
			
			// A detailed security report is stored here.
			// It's array structure is as follows:
			// reportUI.secReport[WEBPAGEURL][highErrorsFlag]
			// reportUI.secReport[WEBPAGEURL][mediumErrorsFlag]
			// reportUI.secReport[WEBPAGEURL][lowErrorsFlag]
			// reportUI.secReport[WEBPAGEURL][logErrorsFlag]
			// reportUI.secReport[WEBPAGEURL][errorCount]
			this.secReport = {};
			
			// // variable to store count of number of results;
			// this.errorCount = 0;
			
			// a list of web pages visited
			this.webpageList = new Array();	
			
			
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
				// Create a detailed securityreport file ofr a web page
				var file = reportUI.createAReportFile();
				
			// open fileOutputStream to write data to a file
				var foStream = Cc["@mozilla.org/network/file-output-stream;1"].
											 createInstance(Ci.nsIFileOutputStream);
				foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);
				
				var converter = Cc["@mozilla.org/intl/converter-output-stream;1"].
					              createInstance(Ci.nsIConverterOutputStream);
				converter.init(foStream, "UTF-8", 0, 0);
				
				 // text to write to a file is a string that contains HTML code
				// converter.writeString("This is a test text!!!");
				reportUI.writeAReportFile(converter);
				
				converter.close(); // this closes foStream
				
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
			// record date and time for future use
			reportUI.date = date;
			reportUI.time = currentTime.getHours() + ":" + currentTime.getMinutes() + ":" + currentTime.getSeconds();
			
			return file;
			// dump("\n file path = "+file.path+"\n");
		},
		
		writeAReportFile: function(converter) {
			// Create and store const strings into simple-storage to
			// avoid creating those strs each time this tool is invoked.
			checkOrCreateConstStrs();
			
			// Write General Summary of security report tool
			try {
				converter.writeString(ss.storage.secReportToolStrs["reportSummaryGeneral"]);
				converter.writeString(" <b>" + reportUI.date + " </b>");
				converter.writeString("  Time: <b>" + reportUI.time + " </b>");
				converter.writeString(ss.storage.secReportToolStrs["reportSummaryGeneral1"]);

				// Write summary of a web page errors
				var tempWebPageUrl = "";
				dump("\n reportUI.webpageList.length = " + reportUI.webpageList.length);
				for (var i = 0; i < reportUI.webpageList.length; i++) {
					converter.writeString(ss.storage.secReportToolStrs["reportWebPage"]);
					converter.writeString(reportUI.webpageList[i]);
					converter.writeString(ss.storage.secReportToolStrs["reportWebPage1"]);
					converter.writeString(reportUI.date);
					converter.writeString("  Time: " + reportUI.time);
					converter.writeString(ss.storage.secReportToolStrs["reportWebPage2"]);
					// write number of errors found on this web page
					converter.writeString(reportUI.secReport[reportUI.webpageList[i]][4]);
					converter.writeString(ss.storage.secReportToolStrs["reportWebPage3"]);
					converter.writeString(ss.storage.secReportToolStrs["webPageURL"]);
					converter.writeString(reportUI.webpageList[i]);
					converter.writeString(ss.storage.secReportToolStrs["webPageURL1"]);
					
					tempWebPageUrl = reportUI.webpageList[i];
					dump("\n tempWebPageUrl = " + tempWebPageUrl);
					
					// Write High Severity errors
					// index value 0
					if (reportUI.secReport[tempWebPageUrl][0].webPageCSP)
						converter.writeString(ss.storage.secReportToolStrs["webPageCSP"]);
					if (reportUI.secReport[tempWebPageUrl][0].webPageInsecurePwd)
						converter.writeString(ss.storage.secReportToolStrs["webPageInsecurePwd"]);


					// Write Medium severity errors
					// index value 1
					if (reportUI.secReport[tempWebPageUrl][1].webPageSSLSelf_Signed)
						converter.writeString(ss.storage.secReportToolStrs["webPageSSLSelf_Signed"]);
					if (reportUI.secReport[tempWebPageUrl][1].webPageSSLInvalid)
						converter.writeString(ss.storage.secReportToolStrs["webPageSSLInvalid"]);
					if (reportUI.secReport[tempWebPageUrl][1].webPageMixed_Content)
						converter.writeString(ss.storage.secReportToolStrs["webPageMixed_Content"]);
					if (reportUI.secReport[tempWebPageUrl][1].webPageInvalidHSTS)
						converter.writeString(ss.storage.secReportToolStrs["webPageInvalidHSTS"]);
					if (reportUI.secReport[tempWebPageUrl][1].webPageReportOnlyCSP)
						converter.writeString(ss.storage.secReportToolStrs["webPageReportOnlyCSP"]);


					// Write Low severity errors
					// index value 2
					if (reportUI.secReport[tempWebPageUrl][2].webPageDepricatedCSP)
						converter.writeString(ss.storage.secReportToolStrs["webPageDepricatedCSP"]);
					if (reportUI.secReport[tempWebPageUrl][2].webPageDepricatedReportOnlyCSP)
						converter.writeString(ss.storage.secReportToolStrs["webPageDepricatedReportOnlyCSP"]);
					if (reportUI.secReport[tempWebPageUrl][2].webPageInlineScriptInCSP)
						converter.writeString(ss.storage.secReportToolStrs["webPageInlineScriptInCSP"]);
					if (reportUI.secReport[tempWebPageUrl][2].webPageInlineStyleInCSP)
						converter.writeString(ss.storage.secReportToolStrs["webPageInlineStyleInCSP"]);
					if (reportUI.secReport[tempWebPageUrl][2].webPageEvalInCSP)
						converter.writeString(ss.storage.secReportToolStrs["webPageEvalInCSP"]);
					if (reportUI.secReport[tempWebPageUrl][2].webPageDepricateInlineScriptCSP)
						converter.writeString(ss.storage.secReportToolStrs["webPageDepricateInlineScriptCSP"]);
					if (reportUI.secReport[tempWebPageUrl][2].webPageDepricateEvalCSP)
						converter.writeString(ss.storage.secReportToolStrs["webPageDepricateEvalCSP"]);
					if (reportUI.secReport[tempWebPageUrl][2].webPageNonStdXhrDirCSP)
						converter.writeString(ss.storage.secReportToolStrs["webPageNonStdXhrDirCSP"]);
					if (reportUI.secReport[tempWebPageUrl][2].webPageNonStdAncesDirCSP)
						converter.writeString(ss.storage.secReportToolStrs["webPageNonStdAncesDirCSP"]);
					if (reportUI.secReport[tempWebPageUrl][2].webPageCookieSec)
						converter.writeString(ss.storage.secReportToolStrs["webPageCookieSec"]);
					if (reportUI.secReport[tempWebPageUrl][2].webPageCookieHttpOnly)
						converter.writeString(ss.storage.secReportToolStrs["webPageCookieHttpOnly"]);
					
					
					// Write Log Level errors
					// index value 3
					if (reportUI.secReport[tempWebPageUrl][3].webPageMissingHTTPS)
						converter.writeString(ss.storage.secReportToolStrs["webPageMissingHTTPS"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageMissingHSTS)
						converter.writeString(ss.storage.secReportToolStrs["webPageMissingHSTS"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageMissingX_Frame_Options)
						converter.writeString(ss.storage.secReportToolStrs["webPageMissingX_Frame_Options"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageSSLUnknownIssuer)
						converter.writeString(ss.storage.secReportToolStrs["webPageSSLUnknownIssuer"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageSSLMissingChain)
						converter.writeString(ss.storage.secReportToolStrs["webPageSSLMissingChain"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageSSLCaInvalid)
						converter.writeString(ss.storage.secReportToolStrs["webPageSSLCaInvalid"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageSSLIssuer)
						converter.writeString(ss.storage.secReportToolStrs["webPageSSLIssuer"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageSSLSignatureAlgorithmDisabled)
						converter.writeString(ss.storage.secReportToolStrs["webPageSSLSignatureAlgorithmDisabled"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageSSLExpiredIssuer)
						converter.writeString(ss.storage.secReportToolStrs["webPageSSLExpiredIssuer"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageSSLUntrusted)
						converter.writeString(ss.storage.secReportToolStrs["webPageSSLUntrusted"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageSSLcertErrorMismatch)
						converter.writeString(ss.storage.secReportToolStrs["webPageSSLcertErrorMismatch"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageSSLcertErrorExpiredNow)
						converter.writeString(ss.storage.secReportToolStrs["webPageSSLcertErrorExpiredNow"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageSSLcertErrorNotYetValidNow)
						converter.writeString(ss.storage.secReportToolStrs["webPageSSLcertErrorNotYetValidNow"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageSSLNotACACert)
						converter.writeString(ss.storage.secReportToolStrs["webPageSSLNotACACert"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageSSLNotImportingUnverifiedCert)
						converter.writeString(ss.storage.secReportToolStrs["webPageSSLNotImportingUnverifiedCert"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageSSLBad_Key)
						converter.writeString(ss.storage.secReportToolStrs["webPageSSLBad_Key"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageSSLBad_Signature)
						converter.writeString(ss.storage.secReportToolStrs["webPageSSLBad_Signature"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageSSLRevoked_Certificate)
						converter.writeString(ss.storage.secReportToolStrs["webPageSSLRevoked_Certificate"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageSSLUsageNotAllowed)
						converter.writeString(ss.storage.secReportToolStrs["webPageSSLUsageNotAllowed"]);
					if (reportUI.secReport[tempWebPageUrl][3].webPageCSPViolations)
						converter.writeString(ss.storage.secReportToolStrs["webPageCSPViolations"]);						
					
				} // end of For loop for web page list

				// complete HTML tag
				converter.writeString("</body></html>");
			} catch (err) {
				converter.writeString ("<html><body> Error in writing security report to a file. <br /> Error message: " + err + "</body></html>");
			}
			
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


  	var cookieMgr = Cc["@mozilla.org/cookiemanager;1"].getService(Ci.nsICookieManager2);
  	var cookieList = cookieMgr.getCookiesFromHost(URL(evtTab.url).host);
  	try {
  		if (cookieList) {
  			if (!reportUI.panelWin || typeof(reportUI.panelWin) === "undefined") return;

  			dump("\n\n\n CookieLst = " + cookieList);

  			if (URL(evtTab.url).scheme == "https") {
  				// Assume "secure" flag is missing
  				reportUI.secReport[evtTab.url][2].webPageCookieSec = true; 
  				reportUI.secReport[evtTab.url][4] += 1;
  			}
  			// Assume "HttpOnly" flag is missing
  			reportUI.secReport[evtTab.url][2].webPageCookieHttpOnly = true; 
  			reportUI.secReport[evtTab.url][4] += 1;

  			while(cookieList.hasMoreElements()) {
  				var cookie = e.getNext().QueryInterface(Ci.nsICookie2);
  				if (cookie.isSecure) {
  					// no need to report sec error.
  					// Our assumption was incorrect.
  					reportUI.secReport[evtTab.url][2].webPageCookieSec = false; 
  					reportUI.secReport[evtTab.url][4] = reportUI.secReport[evtTab.url][4] - 1;  							
  				}
  				if (cookie.isHttpOnly) {
  					// no need to report sec error.
  					// Our assumption was incorrect.
  					reportUI.secReport[evtTab.url][2].webPageCookieHttpOnly = false; 
  					reportUI.secReport[evtTab.url][4] = reportUI.secReport[evtTab.url][4] - 1;
  					// dump("\n\n isHTTPOnly flag found!!!\n");
  				}
  			} // end of While Loop
  		}
  	} catch (e) {}
 
  });
  		
 

exports.registerSecurityReportTool = function registerSecurityReportTool() {
	let securityToolDefinition = {
			id: "security-report-tool",
			label: "Security Report",
			icon: data.url("images/sec_report_icon.png"),
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


// Used by HTTP observer to match requests to open tabs in the web browser
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
	var cspPolicy = "";
	
	// check std and non-std CSP headers
	try {
		var cspRules = httpChannel.getResponseHeader("Content-Security-Policy");
		if (cspRules) {
			counter += 1;
			reportUI.Sec_headers += counter + ": Using 'Content-Security-Policy' HTTP/S Header \n";
			cspPolicy = cspRules;
		}
	} catch (e) {
		counter += 1;
		reportUI.Sec_headers += counter + ": Missing 'Content-Security-Policy' HTTP/S Header. For more information about CSP visit: https://developer.mozilla.org/en/docs/Security/CSP \n";
		reportUI.secReport[httpChannel.URI.spec][0].webPageCSP = true;
		reportUI.secReport[httpChannel.URI.spec][4] += 1;
	}
	try {
		var cspRules = httpChannel.getResponseHeader("X-Content-Security-Policy");
		if (cspRules) {
			counter += 1;
			reportUI.Sec_headers += counter + ": Using 'X-Content-Security-Policy' HTTP/S Header. This policy will only work in Firefox/IE but not in Google Chrome. \n   Please use 'Content-Security-Policy' Header.  For more information about CSP visit: https://developer.mozilla.org/en/docs/Security/CSP \n";
			dump("\n\n X-CSP USED \n ");
			reportUI.secReport[httpChannel.URI.spec][2].webPageDepricatedCSP = true;
			reportUI.secReport[httpChannel.URI.spec][4] += 1;
			cspPolicy = cspRules;
		}
	} catch (e) {
	}
	try {
		var cspRules = httpChannel.getResponseHeader("X-WebKit-CSP");
		if (cspRules) {
			counter += 1;
			reportUI.Sec_headers += counter + ": Using 'X-WebKit-CSP' HTTP/S Header. This policy will only work in Google Chrome and Safari web browsers. \n   Please use 'Content-Security-Policy' Header. For more information about CSP visit: https://developer.mozilla.org/en/docs/Security/CSP \n";
			reportUI.secReport[httpChannel.URI.spec][2].webPageDepricatedCSP = true;
			reportUI.secReport[httpChannel.URI.spec][4] += 1;
			cspPolicy = cspRules;
			}
	} catch (e) {
	}
	
	// CSP Report-Only mode header check
	try {
		var cspRules = httpChannel.getResponseHeader("Content-Security-Policy-Report-Only");
		if (cspRules) {
			counter += 1;
			reportUI.Sec_headers += counter + ": Using 'Content-Security-Policy-Report-Only' HTTP/S Header. This policy will only report violation to web server.\n";
			reportUI.secReport[httpChannel.URI.spec][1].webPageReportOnlyCSP = true;
			reportUI.secReport[httpChannel.URI.spec][4] += 1;
			cspPolicy = cspRules;
			}
	} catch (e) {		
	}
	try {
		var cspRules = httpChannel.getResponseHeader("X-Content-Security-Policy-Report-Only");
		if (cspRules) {
			counter += 1;
			reportUI.Sec_headers += counter + ": Using 'X-Content-Security-Policy-Report-Only' HTTP/S Header. This policy will only work in Firefox/IE but not in Google Chrome. \n   Please use 'Content-Security-Policy' Header.  For more information about CSP visit: https://developer.mozilla.org/en/docs/Security/CSP \n";
			reportUI.secReport[httpChannel.URI.spec][2].webPageDepricatedReportOnlyCSP = true;
			reportUI.secReport[httpChannel.URI.spec][4] += 1;
			cspPolicy = cspRules;
		}
	} catch (e) {
	}
	try {
		var cspRules = httpChannel.getResponseHeader("X-WebKit-CSP-Report-Only");
		if (cspRules) {
			counter += 1;
			reportUI.Sec_headers += counter + ": Using 'X-WebKit-CSP-Report-Only' HTTP/S Header. This policy will only work in Google Chrome and Safari web browsers. \n   Please use 'Content-Security-Policy' Header. For more information about CSP visit: https://developer.mozilla.org/en/docs/Security/CSP \n";
			reportUI.secReport[httpChannel.URI.spec][2].webPageDepricatedReportOnlyCSP = true;
			reportUI.secReport[httpChannel.URI.spec][4] += 1;
			cspPolicy = cspRules;
			}
	} catch (e) {
	}
	
	// If cspPolicy is present then check it for various security errors
	if (cspPolicy !== "") {
		if (cspPolicy.indexOf("unsafe-inline") != -1) {
			reportUI.secReport[httpChannel.URI.spec][2].webPageInlineScriptInCSP = true;
			reportUI.secReport[httpChannel.URI.spec][4] += 1;
		}
		if (cspPolicy.indexOf("unsafe-eval") != -1) {
			reportUI.secReport[httpChannel.URI.spec][2].webPageEvalInCSP = true;
			reportUI.secReport[httpChannel.URI.spec][4] += 1;
		}
		// Depricated (non-std) usage of inline-script and inline-eval
		if (cspPolicy.indexOf("inline-script") != -1) {
			reportUI.secReport[httpChannel.URI.spec][2].webPageDepricateInlineScriptCSP = true;
			reportUI.secReport[httpChannel.URI.spec][4] += 1;
		}
		if (cspPolicy.indexOf("eval-script") != -1) {
			reportUI.secReport[httpChannel.URI.spec][2].webPageDepricateEvalCSP = true;
			reportUI.secReport[httpChannel.URI.spec][4] += 1;
		}
		// non-std or depricated directive usage
		if (cspPolicy.indexOf("xhr-src") != -1) {
			reportUI.secReport[httpChannel.URI.spec][2].webPageNonStdXhrDirCSP = true;
			reportUI.secReport[httpChannel.URI.spec][4] += 1;
		}
		if (cspPolicy.indexOf("frame-ancestors") != -1) {
			reportUI.secReport[httpChannel.URI.spec][2].webPageNonStdAncesDirCSP = true;
			reportUI.secReport[httpChannel.URI.spec][4] += 1;
		}
		
	} // end of IF cspPolicy loop
	
	// check other security related headers
	try {
		var xFrameOptions = httpChannel.getResponseHeader("X-Frame-Options");
		if (xFrameOptions) {
			counter += 1;
			reportUI.Sec_headers += counter + ": Using 'X-Frame-Options' Header \n";
		}
	} catch (e) {
		counter += 1;
		reportUI.Sec_headers += counter + ": Missing 'X-Frame-Options' Header. Your site can be framed by other websites. For more information visit: https://developer.mozilla.org/en-US/docs/HTTP/X-Frame-Options \n";
		reportUI.secReport[httpChannel.URI.spec][3].webPageMissingX_Frame_Options = true;
		reportUI.secReport[httpChannel.URI.spec][4] += 1;
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
		reportUI.secReport[httpChannel.URI.spec][3].webPageMissingHSTS = true;
		reportUI.secReport[httpChannel.URI.spec][4] += 1;
	}
	
} // end of checkHttpHeader() function

function searchStringInArray(hostName) {
  if (!reportUI.webpageList) {
  	reportUI.webpageList = new Array ();
  	return false;
  }

  for (var j = 0; j < reportUI.webpageList.length; j++) {
      if (reportUI.webpageList[j].match(hostName))
          return true;
  }
  return false;
} // end of "searchStringInArray"


function httpResponseObserver(aSubject, aTopic, aData) {

	var httpChannel = aSubject.QueryInterface(Ci.nsIHttpChannel);

	if (!reportUI.panelWin || typeof (reportUI.panelWin) === "undefined")
		return;
		
	if (httpChannel.responseStatus === 200) {
		// var loadFlags = getStringArrayOfLoadFlags(httpChannel.loadFlags);
		// if(loadFlags.indexOf("LOAD_DOCUMENT_URI") != -1 &&
		// loadFlags.indexOf("LOAD_INITIAL_DOCUMENT_URI") != -1){
		var doc = getBrowserFromChannel(httpChannel);
		if (doc === null) {// if its null then no document available
			return;
		}

		var hostName = doc.location.protocol + "//" + doc.location.host;
		var responseName = httpChannel.URI.scheme + "://" + httpChannel.URI.host;
		// dump("\n\n HTTP Handler; hostName = " + hostName);
		// dump("\n responseName = " + responseName);

		// dump("\n\n Web page load request:" + responseName + "\n");

		try {
			var contentType = httpChannel.getResponseHeader("Content-Type");
			if (contentType) {
				if (contentType.indexOf("html") != -1) {
					dump("\n\n contentType = "+ contentType);
					try {
						if (!reportUI.panelWin || typeof(reportUI.panelWin) === "undefined") return;

						// Add web page to list
						if (!searchStringInArray(httpChannel.URI.spec)) {
							// Not found, so insert it in array
	            reportUI.webpageList.push(httpChannel.URI.spec);
						}
						
						// Record all observed errors into a detailed security report object
						reportUI.secReport[httpChannel.URI.spec] = new Array(5);
						reportUI.secReport[httpChannel.URI.spec][0] = new highErrorsState();
						reportUI.secReport[httpChannel.URI.spec][1] = new mediumErrorsState(); 
						reportUI.secReport[httpChannel.URI.spec][2] = new lowErrorsState();
						reportUI.secReport[httpChannel.URI.spec][3] = new logErrorsState();
						reportUI.secReport[httpChannel.URI.spec][4] = 0;
						
						// reset result count if new web page is loaded.
						// Need to check result when Iframes are present in website.
						// reportUI.errorCount = 0;
			
						dump("\n\n httpChannel.URI.spec = " + httpChannel.URI.spec);
						
						// Check for SSL and SSL certificate details
						if (httpChannel.URI.scheme === "https") {
							// var channel = aSubject.QueryInterface(Ci.nsIChannel);
							var channel = httpChannel;
							if (channel instanceof Ci.nsIChannel) {
								var secInfo = channel.securityInfo;
								
								// Check SSL certificate details
								if (secInfo instanceof Ci.nsISSLStatusProvider) {
									var sslStatus = secInfo.QueryInterface(Ci.nsISSLStatusProvider).
	                												SSLStatus.QueryInterface(Ci.nsISSLStatus);

									
									// check nsISSLStatus constants
									if (sslStatus.isDomainMismatch) {
										// dump("\n SSL Domain mismatch ");
										reportUI.secReport[httpChannel.URI.spec][3].webPageSSLcertErrorMismatch = true;
										reportUI.secReport[httpChannel.URI.spec][4] += 1;
									}
									if (sslStatus.isNotValidAtThisTime) {
										// dump("\n cert is not valid ");
										reportUI.secReport[httpChannel.URI.spec][1].webPageSSLInvalid = true;
										reportUI.secReport[httpChannel.URI.spec][4] += 1;
									}
									if (sslStatus.isUntrusted) {
										 // dump("\n cert is untrusted ");
										reportUI.secReport[httpChannel.URI.spec][3].webPageSSLUntrusted = true;
										reportUI.secReport[httpChannel.URI.spec][4] += 1;
									}
									
									// Get nsIX509Cert SSL certificate
									var cert = sslStatus.serverCert;
									
			            // Check for self-signed certificate
			            if (cert instanceof Ci.nsIX509Cert3) {
			            	// dump("\n cert.isSelfSigned = " + cert.isSelfSigned);
			            	if (cert.isSelfSigned) {
			            		reportUI.secReport[httpChannel.URI.spec][1].webPageSSLSelf_Signed = true;
			            		reportUI.secReport[httpChannel.URI.spec][4] += 1;
			            	}
			            }
			            
			            
			            // check various SSL error constants from nsIX509Cert.idl
			            var usages = {};
			            var verified = {};
			            // get SSL certificate verification result
			            cert.getUsagesString(true, verified, usages);
			            
			            switch (verified.value) {
			                case Ci.nsIX509Cert.VERIFIED_OK:
			                     // dump("\n\n Ci.nsIX509Cert.VERIFIED_OK\n");
			                    break;
			                case Ci.nsIX509Cert.NOT_VERIFIED_UNKNOWN:
			                	// dump("\n\n Ci.nsIX509Cert.NOT_VERIFIED_UNKNOWN\n");
			                	reportUI.secReport[httpChannel.URI.spec][3].webPageSSLNotImportingUnverifiedCert = true;
			                	reportUI.secReport[httpChannel.URI.spec][4] += 1;			                	
			                    break;
			                case Ci.nsIX509Cert.CERT_REVOKED:
			                	// dump("\n\n Ci.nsIX509Cert.CERT_REVOKED\n");
			                	reportUI.secReport[httpChannel.URI.spec][3].webPageSSLRevoked_Certificate = true;
			                	reportUI.secReport[httpChannel.URI.spec][4] += 1;			                	
			                    break;
			                case Ci.nsIX509Cert.CERT_EXPIRED:
			                	 dump("\n\n Ci.nsIX509Cert.CERT_EXPIRED\n");
			                	 reportUI.secReport[httpChannel.URI.spec][3].webPageSSLcertErrorExpiredNow = true;
			                	 reportUI.secReport[httpChannel.URI.spec][4] += 1;
			                    break;
			                case Ci.nsIX509Cert.CERT_NOT_TRUSTED:
			                	// dump("\n\n Ci.nsIX509Cert.CERT_NOT_TRUSTED\n");
			                	if (!reportUI.secReport[httpChannel.URI.spec][3].webPageSSLUntrusted) {
			                		reportUI.secReport[httpChannel.URI.spec][3].webPageSSLUntrusted = true;
			                		reportUI.secReport[httpChannel.URI.spec][4] += 1;
			                	}
			                    break;
			                case Ci.nsIX509Cert.ISSUER_NOT_TRUSTED:
			                	// dump("\n\n Ci.nsIX509Cert.ISSUER_NOT_TRUSTED \n");
			                	reportUI.secReport[httpChannel.URI.spec][3].webPageSSLIssuer = true;
			                	reportUI.secReport[httpChannel.URI.spec][4] += 1;
			                	break;
			                case Ci.nsIX509Cert.ISSUER_UNKNOWN:
		                    // dump("\n\n Ci.nsIX509Cert.ISSUER_UNKNOWN\n");
			                	reportUI.secReport[httpChannel.URI.spec][3].webPageSSLUnknownIssuer = true;
			                	reportUI.secReport[httpChannel.URI.spec][4] += 1;
		                    break;
			                case Ci.nsIX509Cert.INVALID_CA:
			                	// dump("\n\n Ci.nsIX509Cert.INVALID_CA\n");
			                	reportUI.secReport[httpChannel.URI.spec][3].webPageSSLCaInvalid = true;
			                	reportUI.secReport[httpChannel.URI.spec][4] += 1;
		                    break;
			                case Ci.nsIX509Cert.USAGE_NOT_ALLOWED:
			                	// dump("\n\n Ci.nsIX509Cert.USAGE_NOT_ALLOWED \n");
			                	reportUI.secReport[httpChannel.URI.spec][3].webPageSSLUsageNotAllowed = true;
			                	reportUI.secReport[httpChannel.URI.spec][4] += 1;
			                	break;
			                case Ci.nsIX509Cert.SIGNATURE_ALGORITHM_DISABLED:
			                	// dump("\nCi.nsIX509Cert.SIGNATURE_ALGORITHM_DISABLED");
			                	reportUI.secReport[httpChannel.URI.spec][3].webPageSSLSignatureAlgorithmDisabled = true;
			                	reportUI.secReport[httpChannel.URI.spec][4] += 1;
			                	break;
			            } // end of switch loop
								} // end of Ci.nsISSLStatusProvider test
							}
						} else if (httpChannel.URI.scheme === "http") { // http only web
																														// page
							 dump("\n\n Insecure web page (HTTP only) previous flag = " + reportUI.secReport[httpChannel.URI.spec][3].webPageMissingHTTPS);	
							 reportUI.secReport[httpChannel.URI.spec][3].webPageMissingHTTPS = true;
							 reportUI.secReport[httpChannel.URI.spec][4] += 1;
						}
						
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
					} catch (e) {	}
					
					// Check presence of various security related HTTP headers in the web
					// page response
					checkHttpHeaders(httpChannel);	
					// // record number of security errors found so far
					// reportUI.secReport[httpChannel.URI.spec][4] = reportUI.errorCount;
				}
			}
		} catch (e) {		}
		
		// } // end of loadFalgs IF loop
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


// ------------------------------------------------------------------------------------
// Strings to write to a file
// Simple-storage APIs
// create persistent store for constant strings of security report
function checkOrCreateConstStrs() {
	if (!ss.storage.secReportToolStrs) {
		ss.storage.secReportToolStrs = {};
	}
	
	if (!ss.storage.secReportToolStrs["reportSummaryGeneral"]) {
		ss.storage.secReportToolStrs["reportSummaryGeneral"] = "<!DOCTYPE html PUBLIC \"-//W3C//DTD HTML 4.01//E\" \"http://www.w3.org/TR/html4/strict.dtd\"> <html><head> " +
		"<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">" +
		"<title>Security Scan Report</title> " +
		"</head>" +
		"<body style=\"background-color: #FFFFFF; margin: 0px; font: small Verdana, sans-serif; font-size: 12px; color: #1A1A1A;\">" +
		"<div style=\"width: 98%; width:700px; align: center; margin-left: auto; margin-right: auto;\">" +
		"<table style=\"width: 100%;\" cellpadding=\"3\" cellspacing=\"0\"><tr><td valign=\"top\">" +
		"<h1>Summary</h1>" +
		"<p>" +
		"          This document reports on the results of an automatic security scan on a web page.     The report first summarises the results found.  Then, for each web page," +
		"          the report describes every issue found.  Please consider the" +
		"          advice given in each description, in order to rectify the issue." +
		"        </p>" +
		"<p>" +
		"          Notes are included in the report. This security report is for reference only and  might not show details of all issues." +
		"      </p>" +
		" <p>Results of this security report are given below:</p>" +
		"<table>" +
		"<tr>" +
		" <td>Security Scan performed on:</td>" +
		"<td>";
	}


	if (!ss.storage.secReportToolStrs["reportSummaryGeneral1"]) {
		ss.storage.secReportToolStrs["reportSummaryGeneral1"] = " </td> </tr> </table> " +
				" <h1>Results per Web Page</h1>";
	}

	
	if (!ss.storage.secReportToolStrs["reportWebPage"]) {
		ss.storage.secReportToolStrs["reportWebPage"] = " <table style=\"width: 300px;\" cellpadding=\"0\" cellspacing=\"0\"> <tr> <td> <h2>Web Page: ";
	}

	if (!ss.storage.secReportToolStrs["reportWebPage1"]) {
		ss.storage.secReportToolStrs["reportWebPage1"] = "</h2> </td> </tr> </table> " +
		"<table> " +
		"<tr>" +
		"<td>Scanning of this host started at:</td>" +
		" <td> ";
	}

	if (!ss.storage.secReportToolStrs["reportWebPage2"]) {
		ss.storage.secReportToolStrs["reportWebPage2"] = " </td>" +
		"</tr>" +
		"<tr>" +
		"<td>Number of results:</td>" +
		"<td> <b>";		
	}
	
	if (!ss.storage.secReportToolStrs["reportWebPage3"]) {
		ss.storage.secReportToolStrs["reportWebPage3"] = " </b> </td>" +
	"</tr>" +
	"</table>";
	}

	if (!ss.storage.secReportToolStrs["webPageURL"]) {
		ss.storage.secReportToolStrs["webPageURL"] = "<table style=\"width: 300px;\" cellpadding=\"0\" cellspacing=\"0\"> <tr> <td> <h3>Security Issues for web page: ";
	}

	if (!ss.storage.secReportToolStrs["webPageURL1"]) {
		ss.storage.secReportToolStrs["webPageURL1"] = " </h3> </td> </tr> </table> ";
	}

// ------------------------------------------------------------------------------------
// High Severity Errors Should go here
	if (!ss.storage.secReportToolStrs["webPageCSP"]) {
		ss.storage.secReportToolStrs["webPageCSP"] = " <div style=\"background:#cb1d17; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Severity Level: High</div>" +
		"<b>Content Security Policy (CSP)</b>" +
		"                  <div style=\"width: 100%\">" +
		"     </div>" +
		"</div> " +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"Overview: This web page is missing to use <i>Content-Security-Policy</i> header." +
		"<p>Vulnerability Insight:</p>" +
		" &nbsp;- Lack of normal behavior policy for content loaded  and executed by the web page and can" +
		" <br /> be exploited by attackers to load or execute malicious injected content." +
		"<p>Impact: </p>" +
		" Successful exploitation will allow remote attackers to execute arbitrary code or <br /> steal sensitive information such as cookies, authentication token, etc., or <br /> bypass the authentication mechanism." +
		"<p>Fix: </p>" +
		" Use Content Security Policy header to protect your web site's users from content injection attacks. " +
		"<br /> The UserCSP extension of Firefox is useful tool to find most compatible policy for a web page" +
		"</pre></div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\">" +
		"<b>References</b><br><table>" +
		"<tr valign=\"top\">" +
		"		<td><u>W3C Standard:</u></td></tr>" +
		"<tr valign=\"top\"> <td> &nbsp;CSP 1.0 W3C Candidate Recommendation (http://www.w3.org/TR/CSP/)</td></tr>" +
		"<tr valign=\"top\"> <td> &nbsp;CSP 1.1 Editor's Draft (https://dvcs.w3.org/hg/content-security-policy/raw-file/tip/csp-specification.dev.html)</td>" +
		"	</tr>" +
		"	  <tr valign=\"top\"><td><u>Other:</u></td></tr>" +
		"<tr valign=\"top\">" +
		"<td> &nbsp;URL:https://people.mozilla.org/~bsterne/content-security-policy/</td>" +
		"</tr>" +
		"<tr valign=\"top\">" +
		"<td> &nbsp;URL:https://developer.mozilla.org/en-US/docs/Security/CSP/Introducing_Content_Security_Policy</td>" +
		"</tr>" +
		"<tr valign=\"top\"> " +
		" <td> &nbsp;URL:http://en.wikipedia.org/wiki/Content_Security_Policy</td>" +
		"</tr>" +
		"</tr>" +
		"<tr valign=\"top\"> " +
		" <td> &nbsp;URL:https://addons.mozilla.org/en-us/firefox/addon/newusercspdesign/</td>" +
		"</tr>" +
		"</table>" +
		"</div>";
	}

	if (!ss.storage.secReportToolStrs["webPageInsecurePwd"]) {
		ss.storage.secReportToolStrs["webPageInsecurePwd"] = " <div style=\"background:#cb1d17; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Severity Level: High</div>" +
		"<b>Insecure Password </b>" +
		"                  <div style=\"width: 100%\">" +
		"     </div>" +
		"</div> " +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"Overview: This web page contains insecure password field." +
		"<p>Vulnerability Insight:</p>" +
		" &nbsp;- Passwords are vulnerable to interception (i.e., \"snooping\") while being transmitted to the server. "+
		"<p>Impact: </p>" +
		" Successful exploitation will allow remote attackers to steal password in plaintext format." +
		"<p>Fix: </p>" +
		" Use password fields only on HTTPS web page." +
		"</pre></div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\">" +
		"<b>References</b><br><table>" +
		"<tr valign=\"top\">" +
		"<td> &nbsp;URL:https://bugzilla.mozilla.org/show_bug.cgi?id=762593</td>" +
		"</tr>" +
		"<tr valign=\"top\"> " +
		" <td> &nbsp;URL:http://en.wikipedia.org/wiki/Password</td>" +
		"</tr>" +
		"</table>" +
		"</div>";
	}

// ------------------------------------------------------------------------------------
// Medium Severity errors should go here
	if (!ss.storage.secReportToolStrs["webPageSSLInvalid"]) {
		ss.storage.secReportToolStrs["webPageSSLInvalid"] = " <div style=\"background:#f99f31; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Severity Level: Medium</div>" +
		"<b>Invalid SSL Certificate</b>" +
		"  <div style=\"width: 100%\">" +
		"     </div>" +
		"</div> " +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"Summary:" +
		" &nbsp; The web page is using invalid SSL certificate and  is prone to man-in-the middle attacks." +
		"<p>Vulnerability Insight:</p>" +
		" &nbsp;- The web page is using an Invalid Certificate that allows an attacker to <br /> perform man-in-the-middle (MITM) attack." +
		"<p>Fix: </p>" +
		" Use a valid certificate from a trusted certificate authority (CA)." +
		"</pre></div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\">" +
		"<b>References</b><br><table>" +
		"<tr valign=\"top\">" +
		"<td> &nbsp;URL:https://developer.mozilla.org/en-US/docs/NSS/SSL_functions/sslerr.html</td>" +
		"</tr>" +
		"<tr valign=\"top\"> " +
		" <td> &nbsp;URL:http://en.wikipedia.org/wiki/Comparison_of_SSL_certificates_for_web_servers</td>" +
		"</tr>" +
		"<tr valign=\"top\"> " +
		" <td> &nbsp;URL:http://en.wikipedia.org/wiki/Secure_Socket_Layer</td>" +
		"</tr>" +
		"</table>" +
		"</div>";
	}

	if (!ss.storage.secReportToolStrs["webPageSSLSelf_Signed"]) {
		ss.storage.secReportToolStrs["webPageSSLSelf_Signed"] = " <div style=\"background:#f99f31; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Severity Level: Medium</div>" +
		"<b>Self-signed SSL Certificate</b>" +
		"  <div style=\"width: 100%\">" +
		"     </div>" +
		"</div> " +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"Summary:" +
		" &nbsp; The web page is using self-signed SSL certificate. <br /> Hence, the certificate is not trusted and is prone to man-in-the middle attacks." +
		"<p>Vulnerability Insight:</p>" +
		" &nbsp;- The web page is using a self-signed certificate that allows an attacker to <br /> perform man-in-the-middle (MITM) attack." +
		"<p>Fix: </p>" +
		" Use a valid certificate from a trusted certificate authority (CA)." +
		"</pre></div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\">" +
		"<b>References</b><br><table>" +
		"<tr valign=\"top\"> " +
		" <td> &nbsp;URL:http://en.wikipedia.org/wiki/Comparison_of_SSL_certificates_for_web_servers</td>" +
		"</tr>" +
		"<tr valign=\"top\"> " +
		" <td> &nbsp;URL:http://en.wikipedia.org/wiki/Secure_Socket_Layer</td>" +
		"</tr>" +
		"</table>" +
		"</div>";
	}

	if (!ss.storage.secReportToolStrs["webPageMixed_Content"]) {
		ss.storage.secReportToolStrs["webPageMixed_Content"] = " <div style=\"background:#f99f31; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Severity Level: Medium</div>" +
		"<b>Mixed Content</b>" +
		"  <div style=\"width: 100%\">" +
		"     </div>" +
		"</div> " +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"Summary:" +
		" &nbsp; The web page is using third-party non secure (http) content on secure (HTTPS) web site." +
		"<p>Vulnerability Insight:</p>" +
		" &nbsp;- The web page has embedded non-secure content from third-party domain in its web page." +
		"<p>Fix: </p>" +
		" Avoid mixed content. <br />" +
		"If you want to include third-party content into your secure website then <br /> serve all the content as HTTPS instead of HTTP." +
		"</pre></div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\">" +
		"<b>References</b><br><table>" +
		"<tr valign=\"top\"> " +
		" <td> &nbsp;URL:http://ie.microsoft.com/testdrive/Browser/MixedContent/Default.html?o=1</td>" +
		"</tr>" +
		"<tr valign=\"top\"> " +
		" <td> &nbsp;URL:https://developer.mozilla.org/en-US/docs/Security/MixedContent</td>" +
		"</tr>" +
		"<tr valign=\"top\"> " +
		" <td> &nbsp;URL:https://developer.mozilla.org/en-US/docs/Security/MixedContent/fix_website_with_mixed_content</td>" +
		"</tr>" +
		"</table>" +
		"</div>";
	}

	if (!ss.storage.secReportToolStrs["webPageInvalidHSTS"]) {
		ss.storage.secReportToolStrs["webPageInvalidHSTS"] = " <div style=\"background:#f99f31; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Severity Level: Medium</div>" +
		"<b>HTTP Strict Transport Security (HSTS)</b>" +
		"  <div style=\"width: 100%\">" +
		"     </div>" +
		"</div> " +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"Summary:" +
		" &nbsp; The web page is using invalid HTTP Strict Transport Security (HSTS) format." +
		"<p>Vulnerability Insight:</p>" +
		" &nbsp;- The web page is using an invalid HTTP Strict Transport Security (HSTS) format. <br />Thus, it fails to instruct browser HTTPS enforcemnet on non-secure links." +
		"<p>Fix: </p>" +
		" Strict-Transport-Security headers must be sent via HTTPS responses only. " +
		"<br /> Browsers may not respect STS headers sent over non-HTTPS responses, or " +
		"<br /> over HTTPS responses which are not using properly configured, trusted certificates." +
		"<br /> Use a valid certificate from a trusted certificate authority (CA)." +
		"</pre></div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\">" +
		"<b>References</b><br><table>" +
		"<tr valign=\"top\"> " +
		" <td> &nbsp;URL:http://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security</td>" +
		"</tr>" +
		"<tr valign=\"top\"> " +
		" <td> &nbsp;URL:https://developer.mozilla.org/en-US/docs/Security/HTTP_Strict_Transport_Security</td>" +
		"</tr>" +
		"<tr valign=\"top\"> " +
		" <td> &nbsp;URL:http://hacks.mozilla.org/2010/08/firefox-4-http-strict-transport-security-force-https/</td>" +
		"</tr>" +
		"</table>" +
		"</div>";
	}

	if (!ss.storage.secReportToolStrs["webPageReportOnlyCSP"]) {
		ss.storage.secReportToolStrs["webPageReportOnlyCSP"] = " <div style=\"background:#f99f31; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Severity Level: Medium</div>" +
		"<b>Report-only CSP</b>" +
		"  <div style=\"width: 100%\">" +
		"     </div>" +
		"</div> " +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"Summary:" +
		" &nbsp; The web page is using Content Security Policy (CSP) in report-only mode." +
		"<p>Vulnerability Insight:</p>" +
		" &nbsp;- The web page is using CSP in report only mode. <br />Thus, it only reports violations to web server but doesn't enforce content restriction. <br>" +
		"  If site is infected by content injection then malicious code will be executed. " +
		"<p>Fix: </p>" +
		" As a user you can use the UserCSP extension of Firefox to enforce CSP policy on the web page." +
		"</pre></div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\">" +
		"<b>References</b><br><table>" +
		"<tr valign=\"top\"> " +
		" <td> &nbsp;URL:https://addons.mozilla.org/en-us/firefox/addon/newusercspdesign/</td>" +
		"</tr>" +
		"</table>" +
		"</div>";
	}


// ------------------------------------------------------------------------------------
// Low severity errors should go here
	if (!ss.storage.secReportToolStrs["webPageDepricatedCSP"]) {
		ss.storage.secReportToolStrs["webPageDepricatedCSP"] = " <div style=\"background:#539dcb; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Severity Level: Low</div>" +
		"<b>Non-Standard CSP Header</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The web page is using non-standard Content-Security-Policy (CSP) policy enforcement header. " +
		"<br /> Non-standard headers are not comptible with all web browsers. <br /> According to W3C recommendation, <br /> you must use a standard header (i.e Content-Security-Policy) for CSP enforcement." +
		"<br /><br /> URL:http://www.w3.org/TR/CSP/" +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageDepricatedReportOnlyCSP"]) {
		ss.storage.secReportToolStrs["webPageDepricatedReportOnlyCSP"] = " <div style=\"background:#539dcb; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Severity Level: Low</div>" +
		"<b>Non-Standard Report-only CSP Header</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The web page is using non-standard Report-only header of Content-Security-Policy (CSP) policy. " +
		"<br /> Non-standard headers are not comptible with all web browsers. <br /> According to W3C recommendation, <br /> you must use a standard header (i.e Content-Security-Policy-Report-Only)." +
		"<br /><br /> URL:http://www.w3.org/TR/CSP/" +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageInlineScriptInCSP"]) {
		ss.storage.secReportToolStrs["webPageInlineScriptInCSP"] = " <div style=\"background:#539dcb; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Severity Level: Low</div>" +
		"<b>Inline Scripts Allowed</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The web page allows inline scripts. Thus, it is vulnerable to content injection attacks and <br /> can allow remote attacker to execute malicious code." +
		"<br /> According to W3C CSP recommendation, inline scripts execution should be prevented in web pages." +
		"<br /> Use script-hash directive in CSP to whitelist inline scripts in web pages" +
		"<br /><br /> URL:http://www.w3.org/TR/CSP/" +
		"<br /><br /> URL:https://dvcs.w3.org/hg/content-security-policy/raw-file/tip/csp-specification.dev.html" +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageInlineStyleInCSP"]) {
		ss.storage.secReportToolStrs["webPageInlineStyleInCSP"] = " <div style=\"background:#539dcb; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Severity Level: Low</div>" +
		"<b>Inline Style Sheets Allowed</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The web page allows inline style. Thus, it can allow remote attacker to execute malicious code." +
		"<br /> According to W3C CSP recommendation, inline style must be moved to external file and <br /> execution of inline-style should be prevented in web pages." +
		"<br /><br /> URL:http://www.w3.org/TR/CSP/" +
		"<br /><br /> URL:https://dvcs.w3.org/hg/content-security-policy/raw-file/tip/csp-specification.dev.html" +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageEvalInCSP"]) {
		ss.storage.secReportToolStrs["webPageEvalInCSP"] = " <div style=\"background:#539dcb; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Severity Level: Low</div>" +
		"<b>Eval Allowed</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The web page allows dangerous Eval() function. <br /> Eval function evaluates a string of JavaScript code at run-time." +
		"<br /> Eval executes the code it's passed with the privileges of the caller. <br /> If you run eval() with a string that could be affected by a malicious party, <br /> you may end up running malicious code on the user's machine with the permissions of the web page. " +
		"<br /> According to W3C CSP recommendation, Eval() function execution should be prevented in web pages." +
		"<br /><br /> URL:http://www.w3.org/TR/CSP/" +
		"<br /><br /> URL:https://dvcs.w3.org/hg/content-security-policy/raw-file/tip/csp-specification.dev.html" +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageDepricateInlineScriptCSP"]) {
		ss.storage.secReportToolStrs["webPageDepricateInlineScriptCSP"] = " <div style=\"background:#539dcb; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Severity Level: Low</div>" +
		"<b>Non-Standard CSP Directive for Inline Scripts</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The web page is using non-standard Content-Security-Policy (CSP) policy directive to allow <br /> inline scripts in the web page. " +
		" Non-standard directives are not comptible with all web browsers. <br />According to W3C recommendation, <br /> you must use a standard directive to allow inline script (i.e unsafe-inline)." +
		"<br /><br /> URL:http://www.w3.org/TR/CSP/" +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageDepricateEvalCSP"]) {
		ss.storage.secReportToolStrs["webPageDepricateEvalCSP"] = " <div style=\"background:#539dcb; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Severity Level: Low</div>" +
		"<b>Non-Standard CSP Directive for Eval</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The web page is using non-standard Content-Security-Policy (CSP) policy directive to allow <br /> execution of eval() function in the web page. " +
		"<br />  Non-standard directives are not comptible with all web browsers. <br />According to W3C recommendation, <br /> you must use a standard directive to allow eval() (i.e unsafe-eval)." +
		"<br /><br /> URL:https://dvcs.w3.org/hg/content-security-policy/raw-file/tip/csp-specification.dev.html#script-src" +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageNonStdXhrDirCSP"]) {
		ss.storage.secReportToolStrs["webPageNonStdXhrDirCSP"] = " <div style=\"background:#539dcb; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Severity Level: Low</div>" +
		"<b>Non-Standard xhr-src CSP Directive Used</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The web page is using non-standard Content-Security-Policy (CSP) policy directive (i.e xhr-src) <br /> to regulate XMLHttpRequest (XHR) requests generated by the web page. " +
		"<br /> Non-standard directives are not comptible with all web browsers. <br />According to W3C recommendation, <br /> you must use a standard directive to control XMLHttpRequest(XHR) and WebSocket requests (i.e connect-src)." +
		"<br /><br /> URL:http://www.w3.org/TR/CSP/#connect-src" +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageNonStdAncesDirCSP"]) {
		ss.storage.secReportToolStrs["webPageNonStdAncesDirCSP"] = " <div style=\"background:#539dcb; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Severity Level: Low</div>" +
		"<b>Non-Standard frame-ancestor CSP Directive Used</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The web page is using non-standard Content-Security-Policy (CSP) policy directive (i.e frame-ancestors) to <br /> control who (which sites) can embed it in their web pages." +
		"<br /> Use \"X-Frame-Options\" HTTP header to control who can embed your web page into their websites." +
		"<br /><br /> URL:http://blogs.msdn.com/b/ieinternals/archive/2010/03/30/combating-clickjacking-with-x-frame-options.aspx" +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageCookieSec"]) {
		ss.storage.secReportToolStrs["webPageCookieSec"] = " <div style=\"background:#539dcb; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Severity Level: Low</div>" +
		"<b>Insecure Cookies On Secure Web Page</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The secured web page contains insecure cookies." +
		"<br /> Hence, cookies are allowed to be send to HTTP site." +
		"<br /> Therefore, malicious injected code into the web page would be able to steal your web site's cookies." +
		"</pre></div>";
	}
	
	if (!ss.storage.secReportToolStrs["webPageCookieHttpOnly"]) {
		ss.storage.secReportToolStrs["webPageCookieHttpOnly"] = " <div style=\"background:#539dcb; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Severity Level: Low</div>" +
		"<b>Cookies Are Not Set To HttpOnly</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The web page cookies are not set with HttpOnly flag." +
		"<br /> Hence, JavaScript code running in the web page can access cookies." +
		"<br /> Therefore, malicious injected code into the web page would be able to steal your web site's cookies." +
		"</pre></div>";
	}
	

// ------------------------------------------------------------------------------------
// Log level errors should go here
	if (!ss.storage.secReportToolStrs["webPageMissingHTTPS"]) {
		ss.storage.secReportToolStrs["webPageMissingHTTPS"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>Missing HTTPS Version</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"Web page is not using HTTPS version or <br /> fails to redirect to HTTPS when users visited non-secure (HTTP) version." +
		"<br /> That is, the web page is not secure and vulnerable to various active network attacks <br /> such as information stealing during transit, content-injection during transit, etc." +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageMissingHSTS"]) {
		ss.storage.secReportToolStrs["webPageMissingHSTS"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>Missing HTTP Strict Transport Security (HSTS) Enforcement</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"Web page is not enforcing HSTS using <i>Strict-Transport-Security</i> header. " +
		"<br /> That is, if web site has https version but users access it through http then " +
		"<br /> browsers will talk to HTTP version of the wesbsite before they can be redirected to HTTPS. " +
		"<br /> This behavior could be exploited by attackers to run man-in-the-middle (MITM) attack." +
		"<br /><br />URL:https://developer.mozilla.org/en-US/docs/Security/HTTP_Strict_Transport_Security" +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageMissingX_Frame_Options"]) {
		ss.storage.secReportToolStrs["webPageMissingX_Frame_Options"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>Missing X-Frame-Options Header</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The X-Frame-Options HTTP response header can be used to indicate <br /> whether or not a browser should be allowed to render a page in a &lt frame &gt or &lt iframe &gt . " +
		"<br /> Sites can use this to avoid Clickjacking attacks, <br /> by ensuring that their content is not embedded into other sites." +
		"<br /><br /> URL:http://blogs.msdn.com/b/ieinternals/archive/2010/03/30/combating-clickjacking-with-x-frame-options.aspx" +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageSSLUnknownIssuer"]) {
		ss.storage.secReportToolStrs["webPageSSLUnknownIssuer"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>SSL Certificate: Unknown Issuer</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The certificate used by this web site is not trusted because <br /> the issuer certificate is unknown." +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageSSLMissingChain"]) {
		ss.storage.secReportToolStrs["webPageSSLMissingChain"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>SSL Certificate: Missing Issuer Chain</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The certificate used by this web site is not trusted because <br /> no issuer chain was provided." +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageSSLCaInvalid"]) {
		ss.storage.secReportToolStrs["webPageSSLCaInvalid"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>SSL Certificate: Invalid CA</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The certificate used by this web site is not trusted because <br /> it was issued by an invalid Certificate Authority (CA) certificate." +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageSSLIssuer"]) {
		ss.storage.secReportToolStrs["webPageSSLIssuer"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>SSL Certificate: Untrusted Issuer</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The certificate used by this web site is not trusted because <br /> the issuer certificate is not trusted." +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageSSLSignatureAlgorithmDisabled"]) {
		ss.storage.secReportToolStrs["webPageSSLSignatureAlgorithmDisabled"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>SSL Certificate: Unsecure Signature Algorithm</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The certificate used by this web site is not trusted because <br /> it was signed using a signature algorithm that was disabled because that algorithm is not secure." +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageSSLExpiredIssuer"]) {
		ss.storage.secReportToolStrs["webPageSSLExpiredIssuer"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>SSL Certificate: Expired Issuer Certificate</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The certificate used by this web site is not trusted because <br /> the issuer certificate has expired." +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageSSLUntrusted"]) {
		ss.storage.secReportToolStrs["webPageSSLUntrusted"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>SSL Certificate: Untrusted Certificate</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The certificate does not come from a trusted source." +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageSSLcertErrorMismatch"]) {
		ss.storage.secReportToolStrs["webPageSSLcertErrorMismatch"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>SSL Certificate: Domain Mismatch</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The certificate is not valid for this web site." +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageSSLcertErrorExpiredNow"]) {
		ss.storage.secReportToolStrs["webPageSSLcertErrorExpiredNow"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>SSL Certificate: Expired Certificate</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The certificate is not valid because it has expired." +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageSSLcertErrorNotYetValidNow"]) {
		ss.storage.secReportToolStrs["webPageSSLcertErrorNotYetValidNow"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>SSL Certificate: Future Certificate</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The certificate is not yet valid because <br /> the start date of certificate is higher than today's date." +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageSSLNotACACert"]) {
		ss.storage.secReportToolStrs["webPageSSLNotACACert"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>SSL Certificate: Invalid CA Certificate</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"This is not a certificate authority certificate, <br /> so it can't be imported into the certificate authority list." +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageSSLNotImportingUnverifiedCert"]) {
		ss.storage.secReportToolStrs["webPageSSLNotImportingUnverifiedCert"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>SSL Certificate: Unverified Certificate</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"This certificate can't be verified and will not be imported. " +
		"<br /> The certificate issuer might be unknown or untrusted, <br /> the certificate might have expired or been revoked, or <br /> the certificate might not have been approved." +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageSSLBad_Key"]) {
		ss.storage.secReportToolStrs["webPageSSLBad_Key"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>SSL Certificate: Invalid Public Key</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The certificate is not valid because, it uses invalid public key." +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageSSLBad_Signature"]) {
		ss.storage.secReportToolStrs["webPageSSLBad_Signature"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>SSL Certificate: Invalid Signature</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The certificate is not valid because, it has invalid signature." +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageSSLRevoked_Certificate"]) {
		ss.storage.secReportToolStrs["webPageSSLRevoked_Certificate"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>SSL Certificate: Revoked Certificate</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The certificate is not valid because, certificate has been revoked." +
		"</pre></div>";
	}
	
	if (!ss.storage.secReportToolStrs["webPageSSLUsageNotAllowed"]) {
		ss.storage.secReportToolStrs["webPageSSLUsageNotAllowed"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>SSL Certificate: Usage Not Allowed</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		"The certificate usage is not allowed because it is not a valid certificate." +
		"</pre></div>";
	}

	if (!ss.storage.secReportToolStrs["webPageCSPViolations"]) {
		ss.storage.secReportToolStrs["webPageCSPViolations"] = " <div style=\"background:#d5d5d5; padding:4px; margin:3px; margin-bottom:0px; color: #FFFFFF; border: 1px solid #CCCCCC; border-bottom: 0px;\">" +
		"<div style=\"float:right; text-align:right\">Log</div>" +
		"<b>CSP Violations</b>" +
		"                  <div style=\"width: 100%\">" +
		"          </div>" +
		"</div>" +
		"<div style=\"padding:4px; margin:3px; margin-bottom:0px; margin-top:0px; border: 1px solid #CCCCCC; border-top: 0px;\"><pre>" +
		" CSP policy violation occured on this web page. <br /> Please refer to web console error/warning logs to see more details in Firefox web browser." +
		" </pre></div>";
	}
	

} // end of checkOrCreateConstStr() function
