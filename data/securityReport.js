/*
 *
 * ToolName: Security Report Tool
 * File Purpose: Regiter ToolBox panel and GCLI commands
 * Author: PATIL Kailas
 *
 */


// Supplimentary function to change class of tab
function changeDirectiveClass(id, flag) {
    switch (id) {
        case 1:
            if (!flag)
                document.getElementById("csp").className = "";
            else
                document.getElementById("csp").className = "current";
            break;
        case 2:
            if (!flag)
                document.getElementById("cors").className = "";
            else
                document.getElementById("cors").className = "current";
            break;
        case 3:
            if (!flag)
                document.getElementById("mixed-content").className = "";
            else
                document.getElementById("mixed-content").className = "current";
            break;
    }
} // end of changeDirectiveClass() function

// Change log of tab contents
function changeReportLogs(evt, curTabId) {
    if (previousTabId === curTabId) return; 
        
    // Remove "current" class from oldDirective
    changeDirectiveClass(previousTabId, false);
    // Set "current" class to currently selected tab
    changeDirectiveClass(curTabId, true);
    // Store curTabID for next reference
    previousTabId = curTabId;    

    // Set textarea value to Empty
    document.getElementById('logTextarea').value = "";
    
} // end of changeReportLogs() function



