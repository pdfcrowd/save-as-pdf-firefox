function crowdextAnimation() {
    this.is_active_ = false;
}

crowdextAnimation.prototype.start = function() {
    if (!this.is_active_) {
        document.getElementById("crowdext-toolbar-button").image = "chrome://crowdext/skin/converting.gif";
        this.is_active_ = true;
    }
}

crowdextAnimation.prototype.stop = function() {
    if (this.is_active_) {
        this.is_active_ = false;
        crowdext.showButton();
    }
}


var crowdext = {

    onLoad: function() {
        // initialization code
        this.enableLogging_ = false;
        crowdext.myLog("onLoad()");
        this.initialized = true;
        this.strings = document.getElementById("crowdext-strings");
        this.animation_ = new crowdextAnimation();
        this.loggedIn_ = false;
        this.restricted_ = false;
        this.error_ = '';
        crowdext.installToolbarButton();
    },


    myLog: function(aMessage) {
        if (enableLogging_) {
            var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                .getService(Components.interfaces.nsIConsoleService);
            consoleService.logStringMessage("SaveAsPdf: " + aMessage);
        }
    },
   

    showButton: function() {
        if (animation_.is_active_)
            return;
        
        var img;
        crowdext.myLog(loggedIn_ + ', ' + restricted_);

        if (loggedIn_ && !restricted_)
            img = "button-logged-in";
        else
            img = "button-not-logged-in";

        img = 'chrome://crowdext/skin/' + img + (error_ ? '-error' : '') + '.png';
        document.getElementById("crowdext-toolbar-button").image = img;
    },

    onDataReady: function(xhr, callbacks) {
        return function(data) {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    if (callbacks.onSuccess) {
                        try {
                            var data = JSON.parse(xhr.responseText);
                            callbacks.onSuccess(data);
                        } catch (e) {
                            crowdext.myLog("Conversion failed:" + xhr.responseText);
                        }
                        // temporarily
                        //callbacks.onSuccess(data);
                    }
                } else {
                    crowdext.myLog("Can't connect to Pdfcrowd")
                }
                if (callbacks.onComplete)
                    callbacks.onComplete();
            }
        };
    },

    showError: function(msg) {
        error_ = msg;
        crowdext.updateToolTip();
    },

    clearError: function() {
        error_ = '';
        crowdext.updateToolTip();
    },


    updateToolTip: function() {
        var tooltip;
        if (error_) {
            tooltip = error_;
        } else {
            tooltip = "Save as PDF - by pdfcrowd.com";
        }
        
        document.getElementById("crowdext-toolbar-button").setAttribute('tooltiptext', tooltip);
    },

    updateLoggedIn: function(user) {
        loggedIn_ = user.authenticated;
        if (loggedIn_)
            restricted_ = user.restricted;
        crowdext.myLog("logged in:" + loggedIn_);
        crowdext.showButton();
        crowdext.updateToolTip();
    },

    createPdf: function(url) {
        var rex = /^((?:chrome|file|about):.*$)/i;
        var result = rex.exec(url);
        if (result) {
            crowdext.showError("Conversion of local URLs is not supported (" + result[1] + ").");
            return;
        }
    
        // is there an ongoing conversion?
        if (animation_.is_active_) return;
    
        crowdext.clearError();
    
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = crowdext.onDataReady(xhr, {
            onSuccess: function(data) {
                if (data.status === 'ok') {
                    crowdext.myLog(data.url);
                    content.window.location.href = data.url;
                } else if (data.status === 'error') {
                    crowdext.showError(data.message);
                    crowdext.myLog(data.message);
                } else if (data.status === 'redirect') {
                    // tbd
                }
                crowdext.updateLoggedIn(data.user);
            },
            
            onComplete: function() { 
                animation_.stop(); 
            }
        });
        
        var apiUrl = 'http://pdfcrowd.com/session/json/convert/uri/';
        xhr.open('POST', apiUrl, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.channel.loadFlags |= Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE; 
        xhr.withCredentials = true;
        xhr.send("src="+escape(url));
        animation_.start();
    },

    installToolbarButton: function() {
        var prefManager = Components.classes["@mozilla.org/preferences-service;1"]
            .getService(Components.interfaces.nsIPrefBranch);

        if (prefManager.getBoolPref("extensions.crowdext.toolbarbuttonplaced"))
            return;
        
        try {
            var firefoxnav = document.getElementById("nav-bar");
            var curSet = firefoxnav.currentSet;
            if (curSet.indexOf("crowdext-toolbar-button") == -1)
            {
                var set;
                // Place the button before the urlbar
                if (curSet.indexOf("urlbar-container") != -1)
                    set = curSet.replace(/urlbar-container/, "crowdext-toolbar-button,urlbar-container");
                else  // at the end
                    set = curSet + ",crowdext-toolbar-button";
                firefoxnav.setAttribute("currentset", set);
                firefoxnav.currentSet = set;
                document.persist("nav-bar", "currentset");
                // If you don't do the following call, funny things happen
                try {
                    BrowserToolboxCustomizeDone(true);
                }
                catch (e) { }
            }
        }
        catch(e) { }
        prefManager.setBoolPref("extensions.crowdext.toolbarbuttonplaced", true);
    },
    


    
    onMenuItemCommand: function(e) {
        var url = content.window.location.href;
        crowdext.createPdf(url);
    },

    onToolbarButtonCommand: function(e) {
        crowdext.onMenuItemCommand(e);
    }
};

window.addEventListener("load", crowdext.onLoad, false);
