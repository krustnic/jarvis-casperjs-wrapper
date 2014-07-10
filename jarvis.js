/**
* Created with casperjs.
* User: krustnic
* Date: 2014-05-10
* Time: 03:48 PM
* To change this template use Tools | Templates.
*/

/**
 * NOTE! It is not a NodeJS environment - its PhantomJS
 * So it's a Phantom's modules like "fs"
 * https://github.com/ariya/phantomjs/wiki/API-Reference-FileSystem
 * */

var Jarvis = new (function() {
    var self = this;
    var fs   = require("fs");
    
    // Log's parts
    this.screenshotsLog  = [];
    this.suiteResultsLog = [];
    this.casperLog       = [];
    this.pageLog         = [];
    this.httpStatusLog   = [];
    
    
    
    this.BASE_DIR         = casper.cli.raw.get("base-dir") || ".";
    this.USER_CONFIG_FILE = casper.cli.raw.get("config-file");
    this.RESULT_LOG_FILE  = "result.json";
    
    this.SCREENSHOT_PREFIX = "screen";
    this.SCREENSHOT_EXT    = "png";   
    
    this._screenShotCount  = 0;
    this._currentCommandId = 0;
    
    // Config default values
    // Actual values will be result of merge with file data
    this.config = {
        "RUNNER_ID" : "1"
    };
    
    this.loadConfigFile = function() {
        // By default load jarvis-config.json
        // If it specified load user defined (cli param "config-file") 
        // filePath is relative to the BASE_DIR param
        
        var configFilePath = self.USER_CONFIG_FILE || "jarvis-config.json";
        
        // Create local scope for fs module (PhantomJS)
        var fs = require("fs");
        
        var rawConfig = fs.read( self.BASE_DIR + "/" + configFilePath );   
        var configObj = JSON.parse( rawConfig );
        
        // merge with defualt values
        for( var key in configObj ) {
            self.config[key] = configObj[key];
        }
        
    }
        
    this.getNewScreenshotName  = function() {
        var newName = self.SCREENSHOT_PREFIX + "-" + self._screenShotCount + "." + self.SCREENSHOT_EXT;
        self._screenShotCount += 1;
        
        return newName;
    }
    
    this.getPath = function( localName ) {
        return self.BASE_DIR + "/" + localName;
    }
    
    this.getNewScreenshotPath = function() {
        return self.BASE_DIR + "/" + self.getNewScreenshotName();
    }
    
    this.getScreenResolution = function() {
        return casper.evaluate(function() {
            var D = document;
            return screenResolution = {
                height: Math.max(
                    D.body.scrollHeight, D.documentElement.scrollHeight,
                    D.body.offsetHeight, D.documentElement.offsetHeight,
                    D.body.clientHeight, D.documentElement.clientHeight
                ),
                width: Math.max(
                    D.body.scrollWidth, D.documentElement.scrollWidth,
                    D.body.offsetWidth, D.documentElement.offsetWidth,
                    D.body.clientWidth, D.documentElement.clientWidth
                )
            };
        });
    }
    
    /* 
     * return real value of the sufix
     */
    this.getSufix = function(type){
        if( type == "") {
            return "";
        }
        else if( type == "date") {
			return Jarvis.getCurrentDate();
        }
        else if(type == "unixtime") {
            return new Date().getTime();
        }
        else if(type == "randomString") {
            return Jarvis.getRandomString(8);
        }
        else if(type == "randomInteger") {
            return Jarvis.getRandomInt(0, 100);
        }
        else {
            return "";
        }
    }
    
    //return random string of lenght len with letters and numbers
    this.getRandomString = function(len){
        if(len == undefined || len < 1){
            len = 8;
        }
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for( var i=0; i < len; i++ ){
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text; 
    }
    
    // return random integer between min and max numbers(0 and 100 by default)
    this.getRandomInt = function( min, max ){
        if(!parseInt(min)){
            return "";
        }
        if(!parseInt(max)){
            return "";
        }
        if(min >= max){
            return "";
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    this.getCurrentDate = function(){
            var currentDate = new Date();
            var month 		= currentDate.getMonth() + 1;
            if(month < 10){
                month = "0" + month;
            }
            var day 		= currentDate.getDate();
            if(day < 10){
                day = "0" + day;
            }
            var year 		= currentDate.getFullYear();
            return day + "." + month + "." + year;
    }
    
    //  add http status into log
    this.addHttpStatusLog = function(resource){
        self.httpStatusLog.push(
            {
                commandId   : Jarvis._currentCommandId,
                status      : resource.status,
                redirectURL : resource.redirectURL,
                stage       : resource.end,
                statusText  : resource.statusText,
                time        : resource.time,
                data        : resource.data,
                page        : resource.url,
                contentType : resource.contentType,
                headers     : resource.headers
            })
    }
    
    this.saveLogs = function() {
        var log = self.config;
        log["screenShots"]   = self.screenshotsLog;
        log["suiteResults"]  = self.suiteResultsLog;
        log["casperLog"]     = self.casperLog;
        log["pageLog"]       = self.pageLog;
        log["httpStatusLog"] = self.httpStatusLog;
        
        fs.write( self.getPath( self.RESULT_LOG_FILE ), JSON.stringify( log ) );
    }
    
    // Wrapper for "fs" isExists
    this.exists = function( filePath ) {
        return fs.exists( filePath );
    }
    
    this.wrap = function( target, wrapFunction ) {
        var f = target;
        return function() {
            return wrapFunction( f, arguments );            
        };
    }
    
    this.log = function( msg ) {
        console.log("Jarvis: ", msg);
    }
    
    this.init = function() {
        this.loadConfigFile();
    }
    
    this.init();
    
    
})();

/**
 * Original signature: sendKeys(selector, value, Object options)ж
 * Rewrite "sendKeys" for using prefix and postfix params
 **/
casper.jSendKeys = function(selector, keys, options, prefix, postfix){
	var prefixText  = Jarvis.getSufix(prefix);
    var postfixText = Jarvis.getSufix(postfix);
    var value 		= prefixText + keys + postfixText;
    return casper.sendKeys(selector, value, options);
}


/**
 * Original signature: capture(String targetFilepath, [Object clipRect, Object imgOptions])
 * Rewrite "capture" for making screenshots to the proper server location
 **/
casper.capture = Jarvis.wrap( casper.capture, function( f, args ) {    
    
    // Default params
    var captureParams = {
        top   : 0,
        left  : 0,
        width : Jarvis.getScreenResolution().width,
        height: Jarvis.getScreenResolution().height
    };
    
    // Merge default params with user-defined, if it exist
    if ( typeof args[1] == "object" ) {
        for( var key in args[1] ) {
            captureParams[key] = args[1][key];
        }
    }
    
    // We create screenshot with max demension 4000;
    if ( captureParams["width"]  > 4000 ) captureParams["width"]  = 4000;
    if ( captureParams["height"] > 4000 ) captureParams["height"] = 4000;
    
    var screenshotName = Jarvis.getNewScreenshotName();
    var screenshotPath = Jarvis.getPath( screenshotName );
    var r = f.call( casper, screenshotPath, captureParams );         
    
    // Check is screenshot really created
    var isExist = Jarvis.exists( screenshotPath );
    var pageUrl = casper.getCurrentUrl();
    var title = casper.getTitle();
    
    Jarvis.screenshotsLog.push( {
        commandId  : Jarvis._currentCommandId,
        success    : isExist,
        page       : pageUrl,
        screenName : screenshotName,
        title	   : title,
        width      : captureParams.width,
        height     : captureParams.height
    } );
    
    Jarvis.saveLogs();
    
    return r;
        
});




/**
 * Original signature:  processAssertionResult(Object result))
 * Rewrite "processAssertionResult" for adding information into asserts and failures
 **/
casper.test.processAssertionResult = Jarvis.wrap( casper.test.processAssertionResult  , function( f, args ) {  
    var err = args[0];
    if(!err.url){
        err.url = casper.getCurrentUrl();
    }
    err.commandId = Jarvis._currentCommandId;  
    return f.apply( casper.test, args );  
} );




// on load.fail listener, add failed assertation when cant load resource
casper.on('load.failed', function(msg) {
    var messsge = 'Loading resource failed with status=' + msg.status;
    casper.test.processAssertionResult(    
        {
        success: false,
        type: "uncaughtError",
        file: casper.test.currentTestFile,
        message: messsge,
        url:  msg.url, 
        values: {
            error: new CasperError( messsge),
        }
    });
});




//logging all JavaScript errors on page
casper.on("page.error", function(msg, trace) {
    Jarvis.pageLog.push( {
        commandId   : Jarvis._currentCommandId,
        page        : casper.getCurrentUrl(),
        message     : msg,
        trace       : trace
    } );
});

//logging 401 http status
casper.on('http.status.401', function(resource) {
    Jarvis.addHttpStatusLog(resource);
})
//logging 404 http status
casper.on('http.status.404', function(resource) {
    Jarvis.addHttpStatusLog(resource);
})
//logging 500 http status
casper.on('http.status.500', function(resource) {
    Jarvis.addHttpStatusLog(resource);
})

// on step.start listener, increment commandId counter
casper.on('step.start', function() {
    Jarvis._currentCommandId = Jarvis._currentCommandId + 1;
});


/**
 * Capturing screenshot after each casper.then() function
 **/
casper.then = Jarvis.wrap( casper.then, function( f, args ) {      
    var r = f.apply( casper, args );
    var captArgs = [function() {
        this.capture("");
    }];
    f.apply(casper, captArgs);
} );

/**
 * Saving jarjis Log into JSON file
 **/
casper.test.done = Jarvis.wrap( casper.test.done, function( f, args ) {      
    var r = f.apply( casper.test, args );  
    
    Jarvis.suiteResultsLog         = casper.test.suiteResults;
    Jarvis.suiteResultsLog["time"] = casper.test.suiteResults.calculateDuration();
    Jarvis.casperLog               = casper.result.log;
    
    Jarvis.saveLogs();
} );

/**
 * Disallow user to use download() function  
 **/
casper.download = Jarvis.wrap( casper.download, function( f, args ) {  
    casper.log("Sorry. You have no access to Download() function");
    return this;  
} );


/**
 * Disallow user script access to some modules (e.g. "fs")  
 **/


(function() {
    var _require = require;
    require = Jarvis.wrap( require, function( f, args ) {
        var disallow = {
            "fs" : ""
            }
        if ( args[0] in disallow ) {
            casper.log("Sorry. You have no access to Filesystem.");
            return null;
            }
        return f.apply( patchRequire, args );
        });
    require.cache = _require.cache;
    require.extensions = _require.extensions; 
    require.stubs = _require.stubs;
    require.patched = _require.patched;
})();
