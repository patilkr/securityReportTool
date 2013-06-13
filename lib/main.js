const {Cc,Ci,Cu} = require("chrome");

const xpcom = require("xpcom");

var errorListener = {
    observe: function(aMessage) {
        let error = aMessage.QueryInterface(Ci.nsIScriptError);
        
        if (error instanceof Ci.nsIScriptError)
            console.log("Message category:  "+error.category +"\n");

        console.log("Message = "+aMessage.message);

       // if (aMessage.message.contains("NS_ERROR"))
          //  dump("NS_ERROR messages");
    }
};

var consoleService = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
consoleService.registerListener(errorListener);

