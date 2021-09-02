'use strict';
var Input = {};
(function () {

Input.startInput = function (inputStepView) {
    var foreground = Selection.foregroundStretches();
    var foreStretch = Active.findBackStretchOfFocus(foreground, inputStepView);
    if (foreStretch) {
        var overlap = _.intersection(foreStretch.steps, inputStepView.steps);
    } else {
        var overlap = [];
    }
    if (overlap.length < inputStepView.steps.length) {
        var group = Group.create();
        Global.groups.push(group);
        var active = Active.computeActiveForGroup(group, Selection.backgroundStretches(), [inputStepView]);
        Global.selection.foreground.group = group;
        Global.selection.foreground.focus = active.focus;
    } else {
        Global.selection.foreground.focus = foreStretch;
    }
    Global.inputStepView = inputStepView;
};

Input.keyForEvent = function () {
    return keyMap[d3.event.keyCode];
};

var go = function () { debugger; };

Input.inputEvent = function (key, eventType) {
    if (key === '\\') {
        go();  // define go to test something out
    } else if (key === 'tab' && eventType === 'down') {
        d3.event.preventDefault();
        Input.keypressEvent(null, 'tab');
    }
};

var startNumberChars = ['-', '.', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

Input.textInputEvent = function (step, key) {
    if (key === '\\') {
        go();  // define go to test something out
    } else if (key === 'enter') {
        Manipulation.insertNewStep();
        d3.event.preventDefault();
    } else if (key === 'tab') {
        d3.event.preventDefault();
    } else if (key === 'escape') {
        if (Global.inputStepView) {
            d3.select(Global.inputStepView.__el__).select('.expression').node().blur();
        }
        window.getSelection().removeAllRanges();
        Main.maybeUpdate(function () {
            Global.inputStepView = null;
            Global.inputForegroundIndexStretch = null;
            Global.connectStepView = null;
        });
    } else if (key === 'A') {
        Reference.toggleAbsolute();
    } else if (_.contains(startNumberChars, key)) {
        Step.enteringLiteral(key);
    } else {
        Step.enteringNonLiteral(key);
    }
    d3.event.stopPropagation();
};

Input.keypressEvent = function (keyCode, key) {
    key = key || String.fromCharCode(keyCode);
    if (Input.keyForEvent() === 'enter') {
        key = 'enter';
    }

    key = keypressMap[key] || key;

    if (key === 'w' || key === 'q') {
        browseSelectionHistory(key === 'w');
    } else if (key === 'tab') {
        Selection.toggleCollapsed();
    } else if (key === 'c') {
        Manipulation.copyActiveStretches();
    } else if (key === 'd') {
        Manipulation.deleteActiveStretches();
        d3.event.stopPropagation();
    } else if (key === 'a') {
        Manipulation.selectActiveStretches();
    } else if (key === 'r') {
        Group.toggleRemember();
    } else if (key === 's') {
        Selection.toggleSuperStep();
    } else if (key === 'x') {
        Manipulation.computeGroupIntersection();
    } else {
        return;
    }

    Main.update();
};

var keyMap = {8: 'backspace', 9: 'tab', 13: 'enter', 16: 'shift', 17: 'ctrl', 18: 'alt', 19: 'pause/break', 20: 'caps lock', 27: 'escape', 32: 'space', 33: 'page up', 34: 'page down', 35: 'end', 36: 'home', 37: 'left arrow', 38: 'up arrow', 39: 'right arrow', 40: 'down arrow', 45: 'insert', 46: 'delete', 48: '0', 49: '1', 50: '2', 51: '3', 52: '4', 53: '5', 54: '6', 55: '7', 56: '8', 57: '9', 65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E', 70: 'F', 71: 'G', 72: 'H', 73: 'I', 74: 'J', 75: 'K', 76: 'L', 77: 'M', 78: 'N', 79: 'O', 80: 'P', 81: 'Q', 82: 'R', 83: 'S', 84: 'T', 85: 'U', 86: 'V', 87: 'W', 88: 'X', 89: 'Y', 90: 'Z', 91: 'left window key', 92: 'right window key', 93: 'select key', 96: 'numpad 0', 97: 'numpad 1', 98: 'numpad 2', 99: 'numpad 3', 100: 'numpad 4', 101: 'numpad 5', 102: 'numpad 6', 103: 'numpad 7', 104: 'numpad 8', 105: 'numpad 9', 106: 'multiply', 107: 'add', 109: 'subtract', 110: 'decimal point', 111: 'divide', 112: 'F1', 113: 'F2', 114: 'F3', 115: 'F4', 116: 'F5', 117: 'F6', 118: 'F7', 119: 'F8', 120: 'F9', 121: 'F10', 122: 'F11', 123: 'F12', 144: 'num lock', 145: 'scroll lock', 186: ';', 187: '=', 188: ',', 189: '-', 190: '.', 191: '/', 192: '`', 219: '[', 220: '\\', 221: ']', 222: "'"};

var qwertyKeypressMap = {
    'q': 'q',
    'w': 'w',
    'e': 'e',
    'r': 'r',
    't': 't',
    'y': 'y',
    'u': 'u',
    'i': 'i',
    'o': 'o',
    'p': 'p',
    'a': 'a',
    's': 's',
    'd': 'd',
    'f': 'f',
    'g': 'g',
    'h': 'h',
    'j': 'j',
    'k': 'k',
    'l': 'l',
    'z': 'z',
    'x': 'x',
    'c': 'c',
    'v': 'v',
    'b': 'b',
    'n': 'n',
    'm': 'm',
};

var dvorakKeypressMap = {
    "'": 'q',
    ',': 'w',
    '.': 'e',
    'p': 'r',
    'y': 't',
    'f': 'y',
    'g': 'u',
    'c': 'i',
    'r': 'o',
    'l': 'p',
    'a': 'a',
    'o': 's',
    'e': 'd',
    'u': 'f',
    'i': 'g',
    'd': 'h',
    'h': 'j',
    't': 'k',
    'n': 'l',
    ';': 'z',
    'q': 'x',
    'j': 'c',
    'k': 'v',
    'x': 'b',
    'b': 'n',
    'm': 'm',
};

var keypressMap;

Input.dvorak = function () {
    localStorage.setItem('Pancakes_keyboard_mode', 'dvorak');
    Input.setup();
};

Input.qwerty = function () {
    localStorage.setItem('Pancakes_keyboard_mode', 'qwerty');
    Input.setup();
};

Input.setup = function () {
    if (localStorage.getItem('Pancakes_keyboard_mode') === 'dvorak') {
        keypressMap = dvorakKeypressMap;
    } else {
        keypressMap = qwertyKeypressMap;
    }
};

})();
