/*
 *
 * ToolName: Security Report Tool
 * File Purpose: Register ToolBox panel and GCLI commands
 * Author: PATIL Kailas
 *
 */

function downloadSecurityReport() {
	// var event = document.createEvent('CustomEvent');
	// event.initCustomEvent("downloadReport-message", true, true, "");
	var event = new CustomEvent("downloadReport-message");
	// dump("\n\n About to dispatch custom event");
	document.documentElement.dispatchEvent(event);
} // end of downloadSecurityReport() function

function openSecurityReport() {
	var event = new CustomEvent("openSecReport-msg");
	document.documentElement.dispatchEvent(event);
}