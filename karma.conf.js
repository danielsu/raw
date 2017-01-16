module.exports = function(config) {
    config.set({
        basePath: '../..',
        frameworks: ['jasmine'],
        //...
        logLevel: config.LOG_INFO,
        //logLevel: config.LOG_DEBUG,
        //browsers: ["Chrome"],
        browsers: ["PhantomJS2"],
        basePath: ".",
        files: [
            "bower_components/angular/angular.js",
            //"bower_components/**/*.js",
            "node_modules/angular-mocks/angular-mocks.js",
            "js/services.js",
            "js/StringUtilPolyfill.js",
            //"js/*.*",
            //"lib/*.*",
            //"charts/*.*",
            //"data/*.*",
            //"partials/*.*",
            //"templates/*.*",

            "tests/*.*"
        ],
        autoWatch: true,
        autoWatchBatchDelay: 250 //default
    });
};