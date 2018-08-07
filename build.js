
const fs = require('fs');

const cl = console.log;
const cw = function(v) { console._stdout.write(v); };

const builds = {
    'polyfills.js': buildPolyfills,
    'ellibre.js': buildDists
};

function buildPolyfills() {

    const polyDir = './polyfills';

    var polyFiles = fs.readdirSync(polyDir);
    var polyfills = "";
    
    for(var k in polyFiles) {
        polyfills += fs.readFileSync(polyDir + '/' + polyFiles[k], 'utf8') + '\r\n';
    }

    fs.writeFileSync('./dist/polyfills.js', polyfills, 'utf8');
}

function buildDists() {

    const license = fs.readFileSync('./LICENSE', 'utf8');
    const package = require('./package');
    const srcDir = './src';

    var srcFiles = fs.readdirSync(srcDir);
    var src = `/**
     * Advanced functionalities for web architecture written in vanilla js.
     * @author ${package.author}
     * @version ${package.version}
     * @license
     * ${license.replace(/\r?\n/g, '\n * ')}
     */`.replace(/\r?\n +/g, '\n ');
    
    src += `\r\n(function() {\r\n\t"use strict";\r\n`;

    for(var k in srcFiles) {
        var srcContent = fs.readFileSync(srcDir + '/' + srcFiles[k], 'utf8');
        src += srcContent.split(/\r?\n/g).join('\r\n\t') + '\r\n';
    }

    src += '})();';

    fs.writeFileSync('./dist/ellibre.js', src, 'utf8');
}

Object.keys(builds).forEach(buildName => {
    cw(`building ${buildName} ... `);
    try {
        builds[buildName]();
    } catch (e) {
        cw('NOK\r\n');
        return;
    }
    cw('OK\r\n');
});