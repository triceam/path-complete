// dependencies
var fs = require('fs'),
    path = require('path'),
    tty = require('tty');

// os separator
var SEP = process.platform === 'win32' ? '\\' : '/';

// variables
var cwd,
    callback,
    isActive = false,
    input = '';

var doPathCompletion = function() {
    var basepath = path.resolve(input);
    var dirname = input === '' ? basepath : path.dirname(basepath);
    var filename = input === '' ? '' : path.basename(basepath);

    try {
        var list = fs.readdirSync(dirname);
        var matchPart = null;
        var matches = [];

        list.forEach(function(file) {
            if (file.indexOf(filename) === 0 || filename === '') {
                if (!matchPart) {
                    matchPart = file;
                } else {
                    for (var i = 0; i < matchPart.length && matchPart.charAt(i) === file.charAt(i); i++) {}
                    matchPart = matchPart.substring(0, i);
                }

                // TODO: I'll use this later to do a autocomplete list
                matches.push(file);
            }
        });

        var diff = matchPart.length - filename.length;
        var portion = diff === 0 ? '' : matchPart.substr(filename.length);
        var matchPath = path.join(dirname, matchPart);
        if (matches.length === 0) {
            return '';
        } else if (matches.length === 1) {
            try {
                return portion + (fs.statSync(matchPath).isDirectory() && input.charAt(input.length - 1) !== SEP ? SEP : '');
            } catch (e) {
                return portion;
            }
        } else {
            // TODO: show list of matches if TAB clicked twice and diff === 0
            return portion;
        }
    } catch (e) {
        return '';
        // console.log(e);
    }
};

var onKeyPress = function(key) {
    if (isActive) {
        if (key) {

            //control-C
            if (key === '\u0003') {
                process.exit();
            }

            //tab key
            else if (key === '\u0009') {
                var output = doPathCompletion();
                input += output;
                process.stdout.write(output);
            }

            //return key (carriage return)
            else if (key === '\u000D') {
                isActive = false;
                process.stdout.write('\n');
                process.stdin.setRawMode(false);
                process.stdin.pause();
                if (callback) {
                    if (input == "") {
                        callback("")
                    } else {
                        callback(path.resolve(input));
                    }
                }
            }

            //backspace or delete
            else if (key === '\u0008' || key === '\u007F') {
                if (input === '') return;
                input = input.substr(0, input.length - 1);
                process.stdout.write('\b \b');
            }

            //else append the output
            else {
                input += key;
                process.stdout.write(key);
            }
        }
    }
};

exports.getPathFromStdin = function(startInput, _callback) {
    if (typeof startInput === 'function') {
        _callback = startInput;
        startInput = '';
    }

    process.stdin.resume();
    process.stdin.setRawMode(true);
    process.stdin.setEncoding('utf8');
    input = startInput;
    process.stdout.write(startInput);
    cwd = process.cwd();
    callback = _callback;
    isActive = true;

    // TODO: figure out why removing and re-adding keypress
    //       listener doesn't work correctly. Use isActive
    //       in the meantime.
    if (!process.stdin.listeners('data').length) {
        process.stdin.on('data', onKeyPress);
    }
};