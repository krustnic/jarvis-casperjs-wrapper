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
    this._currentCommandId = 0;
    this._pageLoaded       = false;
    this._isPageError      = false;
    casper.options.exitOnError = false;
    
    
    
    // Config default values
    // Actual values will be result of merge with file data
    this.config = {
        "RUNNER_ID"    : "1"
//         "STEP_CAPTURE" : true,         //if true - capture screenshot after each step  
//         "IN_FRAME"     : false         //if true - do not capture autamaticly
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
            var height = Math.max(
                D.body.scrollHeight, D.documentElement.scrollHeight,
                D.body.offsetHeight, D.documentElement.offsetHeight,
                D.body.clientHeight, D.documentElement.clientHeight
            ) || 0;
            var width = Math.max(
                D.body.scrollWidth, D.documentElement.scrollWidth,
                D.body.offsetWidth, D.documentElement.offsetWidth,
                D.body.clientWidth, D.documentElement.clientWidth
            ) || 0; 
            return screenResolution = {
                height: height,
                width: width
            }



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
    
    
    this.saveLogs = function() {
        var log = self.config;
        var isSuccess = true;
        for(var suiteIndex in self.suiteResultsLog){
            var suite = self.suiteResultsLog[suiteIndex];
            if(suite.failed != 0 ){
                isSuccess = false;
            }
        }
        if(isSuccess){
            for(var i = 0; i < self.screenshotsLog.length - 1; i++){            
                fs.remove(self.screenshotsLog[i].screenPath);                
            }
            self.screenshotsLog.splice(0, self.screenshotsLog.length - 1);
        }    
        
        log["screenShots"]   = self.screenshotsLog;
        log["suiteResults"]  = self.suiteResultsLog;
        log["casperLog"]     = self.casperLog;
       
        fs.write( self.getPath( self.RESULT_LOG_FILE ), JSON.stringify( log ) );
    }
       
    this.addHttpStatusFail = function(resource){
        casper.test.processAssertionResult(    
            {
                success: false,
                type: "assertHttpStatus",
                standard: "HTTP status code is: " + resource.status,
                status:  "broken",
                message: "http satatus is 200",
                values: {
                    current: resource.status,
                    expected: 200
                }
            }
        );
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
 * function that fills inputs and selects
 **/
casper.jChange = function(selector, value, prefix, postfix){
    var prefixText  = Jarvis.getSufix(prefix);
    var postfixText = Jarvis.getSufix(postfix);
    var value 		= prefixText + value + postfixText;    
    
    var result = casper.evaluate(function _evaluate(selector, value) {
        var out = {
            errors: [],

        };
        try {
            var field =  __utils__.findAll(selector);
            if (!field || field.length === 0) {
                return  'no field matching selector "' + selector + '"';
            }
            try {
                __utils__.setField(field, value);
            } catch (err) {
                return err.message;
            }
        } catch (exception) {
            return exception.toString();
        }
    }, selector, value);
    if(result != null){
        casper.test.assert(false, result);
    }
}


/**
 * Original signature: capture(String targetFilepath, [Object clipRect, Object imgOptions])
 * Rewrite "capture" for making screenshots to the proper server location
 **/
casper.capture = Jarvis.wrap( casper.capture, function( f, args ) { 
    // Default params
    var screenResolution = Jarvis.getScreenResolution();
    var captureParams = {
        top   : 0,
        left  : 0,
        width : screenResolution.width,
        height: screenResolution.height
    };
    var is_assert = false;
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
    
    if (args[3] == "is_assert" && typeof args[4] == "object" ) {
        is_assert = true;
        var err = args[4];
        err.screenName = screenshotName;
    }
    
    // Check is screenshot really created
    var isExist = Jarvis.exists( screenshotPath );
    var pageUrl = casper.getCurrentUrl();
    var title = casper.getTitle();
    
    Jarvis.screenshotsLog.push( {
        commandId  : Jarvis._currentCommandId,
        success    : isExist,
        page       : pageUrl,
        screenName : screenshotName,
        screenPath : screenshotPath,
        title	   : title,
        width      : captureParams.width,
        height     : captureParams.height,
        is_assert  : is_assert
    } );  
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
    try{
        casper.capture("", undefined, undefined, "is_assert", err);
    }
    catch(e){
        casper.log(e.message);
    }
    err.commandId = Jarvis._currentCommandId;  
    return f.apply( casper.test, args );  
} );

casper.test.done = Jarvis.wrap( casper.test.done  , function( f, args ) {  
    casper.test.currentSuite.annotationType   = casper._currentAnnotationType;
    casper.test.currentSuite.annotationTestId = casper._currentAnnotationTestId;
    return f.apply( casper.test, args );  
} );

//owerwrite casper assertEval fuction to return evaluated function as string in values
casper.test.assertEval =
casper.test.assertEvaluate = function assertEval(fn, message, params) {
    "use strict";
    return this.assert(this.casper.evaluate(fn, params), message, {
        type: "assertEval",
        standard: "Evaluated function returns true",
        values: {
            fn: String(fn),
            params: params
        }
    });
};

//owerwrite casper assertEvalEquals fuction to return evaluated function as string in values
casper.test.assertEvalEquals =
casper.test.assertEvalEqual = function assertEvalEquals(fn, expected, message, params) {
    "use strict";
    var subject = this.casper.evaluate(fn, params);
    return this.assert(utils.equals(subject, expected), message, {
        type: "assertEvalEquals",
        standard: "Evaluated function returns the expected value",
        values: {
            fn: String(fn),
            params: params,
            subject:  subject,
            expected: expected
        }
    });
};

//owerwrite casper assertResourceExists fuction to return evaluated function as string in values
casper.test.assertResourceExists =
casper.test.assertResourceExist = function assertResourceExists(test, message) {
    "use strict";
    return this.assert(this.casper.resourceExists(test), message, {
        type: "assertResourceExists",
        standard: "Confirm page has resource",
        values: {
            test: String(test)
        }
    });
};

//new function to strictly compare text within selector
casper.test.assertSelectorTextEquals =
casper.test.assertSelectorTextEqual = function assertSelectorTextEquals(selector, text, message) {
    "use strict";
    var got = Jarvis.getSelectorText(selector);
    var textFound = got === text;
    return this.assert(textFound, message, {
        type: "assertSelectorTextEquals",
        standard: f('Find "%s" within the selector "%s"', text, selector),
        values: {
            selector: selector,
            text: text,
            actualContent: got
        }
    });
};


casper.test.assertSelectorHasText =
casper.test.assertSelectorContains = function assertSelectorHasText(selector, text, message) {
    "use strict";
    var got = Jarvis.getSelectorText(selector);
    var textFound = got.indexOf(text) !== -1;
    return this.assert(textFound, message, {
        type: "assertSelectorHasText",
        standard: f('Find "%s" within the selector "%s"', text, selector),
        values: {
            selector: selector,
            text: text,
            actualContent: got
        }
    });
};

casper.test.assertSelectorHasClass = function assertSelectorHasClass(selector, className, message) {
    "use strict";
    var result = this.casper.evaluate(function(selector, searchedClassNames){
        var convertToArray = function(arr){
            return arr.split(" ").map(Function.prototype.call, String.prototype.trim).filter(function(elem){return elem != ""})
        }
        var existClassNames = document.querySelector(selector).className;
        var existClasses = convertToArray(existClassNames);
        var serchedClasses = convertToArray(searchedClassNames);    
        for( var i = 0; i < serchedClasses.length; i++ ){
            if(existClasses.indexOf(serchedClasses[i]) === -1){
                return false;
            }
        }
        return true;
    }, selector, className);

    return this.assert(result == true, message, {
        type: "assertSelectorHasClass",
        standard: "Selector has class '" + className + "'",
    });
};

Jarvis.getSelectorText = function getSelectorText(selector){
    var selectorText =  casper.evaluate(function(selector){
        var element = document.querySelector(selector);
        if (element == null) return null;
        if (element.tagName == "INPUT")return element.value;
        if (element.tagName == "SELECT") {
            if (element.options[element.selectedIndex] == undefined) return "";
            return element.options[(element.selectedIndex)].innerHTML;
        }
        return element.innerHTML;
    },selector);   
    return selectorText;
}

casper.test.assertHttpStatus = function assertHttpStatus(url, status, message){
    var result = casper.evaluate(function(url){
        var http = new XMLHttpRequest();
        http.open('HEAD', url, false);
        http.send();
        return http.status;
    }, url)
    casper.test.assert(result == (status || 200) , message || "assert http status");
    return result;
}

/**
 * add final assert "All tests are passed", also add annotation description to tests 
 **/
casper.run = Jarvis.wrap( casper.run  , function( f, args ) {  
    if(casper._lastTestId == casper._currentAnnotationTestId){
        casper.then(function() {
            var is_boken = false;
            this.test.currentSuite.failures.forEach(function(item, i, arr){
                casper.log(i);
                if(item.hasOwnProperty('status') && item.status == "broken"){
                    is_boken = true;
                }
            });
            if(is_boken){
                casper.test.processAssertionResult(
                    {
                        success: false,
                        type:    "assert",
                        status:  "broken",
                        message: "All tests are passed",
                        standard: "Subject is strictly true",
                        file: this.currentTestFile,
                        doThrow: true,
                        values: {
                            subject: false
                        }
                    }
                );
            }
            else{
                this.test.assert(casper.test.currentSuite.failed == 0, "All tests are passed");
            }
        }); 
    }     
    return f.apply( casper, args );  
} );

// on load.fail listener, add failed assertation when cant load resource
casper.on('load.failed', function(msg) {
    var messsge = 'Loading resource failed with status=' + msg.status;
    casper.test.processAssertionResult(    
        {
            success: false,
            type: "uncaughtError",
            status:  "broken",
            file: casper.test.currentTestFile,
            message: messsge,
            url:  msg.url, 
            values: {
                error: new CasperError( messsge),
            }
        });
});

casper.options.onStepComplete = function(){
        casper._isPageError = false;
}


//logging all JavaScript errors on page
casper.on("page.error", function(msg, trace) {

    if(!this._isPageError){
        this._isPageError = true;
            try{
                casper.test.processAssertionResult(
                     {
                         success: false,
                         file: casper.test.currentTestFile, 
                         type:    "pageError",
                         status:  "broken",
                         message: msg,
                         standard: "Page have no errors",
                         page_error_msg: msg,
                         trace: trace,
                         values: {
                             error: msg,
                             trace: trace
                         }
                     }
                );
            }
            catch(e){
                casper.log(e.message);
            }
    }
});


//logging 401 http status
casper.on('http.status.401', function(resource) {
    Jarvis.addHttpStatusFail(resource);
})
//logging 404 http status
casper.on('http.status.404', function(resource) {
    Jarvis.addHttpStatusFail(resource);
    })
//logging 500 http status
casper.on('http.status.500', function(resource) {
    Jarvis.addHttpStatusFail(resource);
})

// on step.start listener, increment commandId counter
casper.on('step.start', function(step) {
    Jarvis._currentCommandId = Jarvis._currentCommandId + 1;
});

//set _pageLoaded flag.
casper.on('load.finished', function() {
    this._pageLoaded = true;
});

//set _pageLoaded flag.
casper.on('load.started', function() {
    this._pageLoaded = false;
});


/**
 * Saving jarjis Log into JSON file
 **/
casper.test.on('test.done', function() {
    Jarvis.suiteResultsLog         = casper.test.suiteResults;
    Jarvis.suiteResultsLog["time"] = casper.test.suiteResults.calculateDuration();
    Jarvis.casperLog               = casper.result.log;
    Jarvis.saveLogs();
});

/**
 * translate console.log() into casper.log()
 **/
casper.on('remote.message', function(message) {
    casper.log('remote message caught: ' + message);
});

/**
 * Disallow user to use download() function  
 **/
casper.download = Jarvis.wrap( casper.download, function( f, args ) {  
    casper.test.processAssertionResult(
        {
            success: false,
            file: casper.test.currentTestFile, 
            type:    "downloadError",
            status:  "broken",
            message: "Jarvis do not support files download",
            standard: "Jarvis do not support files download",
            values: {
                subject: false
            }
        }
    );
} );

//terminate program on parse error
phantom.onError = function(msg, trace) {
    var msgStack = ['PHANTOM ERROR: ' + msg];
    if (trace && trace.length) {
        msgStack.push('TRACE:');
        trace.forEach(function(t) {
            msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function + ')' : ''));
        });
    }
    casper.log(msgStack.join('\n'), "error")
    phantom.exit(1001);
};


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
