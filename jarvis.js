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
    
    
    this.BASE_DIR         = casper.cli.raw.get("base-dir") || ".";
    this.USER_CONFIG_FILE = casper.cli.raw.get("config-file");
    this.RESULT_LOG_FILE  = "result.json";
    
    this.SCREENSHOT_PREFIX = "screen";
    this.SCREENSHOT_EXT    = "png";   
    
    this._screenShotCount  = 0;
    this._currentCommandId  = 0;
    
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
    
    this.saveLogs = function() {
        var log = self.config;
        log["screenShots"]  = self.screenshotsLog;
        log["suiteResults"] = self.suiteResultsLog;
        log["casperLog"]    = self.casperLog;
        
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
    
    Jarvis.screenshotsLog.push( {
        commandId  : Jarvis._currentCommandId,
        success    : isExist,
        page       : pageUrl,
        screenName : screenshotName,
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

// on step.start listener, increment commandId counter
casper.on('step.start', function() {
    Jarvis._currentCommandId = Jarvis._currentCommandId + 1;
});


casper.test.done = Jarvis.wrap( casper.test.done, function( f, args ) {      
    var r = f.apply( casper.test, args );  
    
    Jarvis.suiteResultsLog         = casper.test.suiteResults;
    Jarvis.suiteResultsLog["time"] = casper.test.suiteResults.calculateDuration();
    Jarvis.casperLog               = casper.result.log;
    
    Jarvis.saveLogs();
} );

casper.test.assertEval = Jarvis.wrap( casper.test.assertEval, function( f, args ) {  
    console.log("Assert evel wrapped!");
    return f.apply( casper.test, args );  
} );

/**
 * Disallow user script access to some modules (e.g. "fs")  
 **/

require = Jarvis.wrap( require, function( f, args ) {
    
    var disallow = {
        "fs" : ""
    }
    
    if ( args[0] in disallow ) {
        console.log("Sorry. You have no access to Filesystem.");
        //casper.exit();
        return null;
    }
    
    return f.apply( this, args );
}); 