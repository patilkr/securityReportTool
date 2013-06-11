const {Cc,Ci,Cu} = require("chrome");

const xpcom = require("xpcom");

var errorListener = {
    observe: function(aMessage) {
        console.log("Message = "+aMessage.message);
        if (aMessage.message.contains("NS_ERROR"))
            dump("NS_ERROR messages");
    }
};

var consoleService = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
consoleService.registerListener(errorListener);

