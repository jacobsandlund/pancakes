'use strict';
var DrawHelper = {};
(function () {

DrawHelper.clipNumber = function (number, length) {
    var numString = '' + number;
    if (numString.length <= length) {
        return numString;
    }
    var before = numString.slice(0, length);
    if (!_.isNumber(number)) {
        return before;
    }
    if (before.indexOf('.') === -1 || numString.slice(0, 4) === '0.000') {
        numString = number.toExponential(20);
    }

    var eIndex = numString.indexOf('e');
    if (eIndex !== -1) {
        var exponent = numString.slice(eIndex);
        var mantissaLength = length - exponent.length;
        var pointAndBeforeLength = numString.indexOf('.') + 1;
        var fractionDigits = mantissaLength - pointAndBeforeLength;
        if (fractionDigits < 0) {
            fractionDigits = 0;
        }
        return number.toExponential(fractionDigits);
    }

    var pointIndex = numString.indexOf('.');
    var fractionDigits = length - pointIndex - 1;
    if (fractionDigits < 0) {
        fractionDigits = 0;
    }
    return number.toFixed(fractionDigits);
};

DrawHelper.drawResultBorder = function (enterEls) {
    enterEls.append('div')
        .attr('class', 'result-border') ;

    var cornerContainerEls = enterEls.append('div')
        .attr('class', 'result-corner-container')

    cornerContainerEls.append('div')
        .attr('class', 'result-corner')
        .on('mousedown', function (d) {
            if (!Global.inputStepView) {
                d3.event.stopPropagation();
            }
        })
        .on('click', function (d) {
            if (!Global.inputStepView) {
                Global.connectStepView = d;
                Main.update();
                d3.event.stopPropagation();
            }
        }) ;
};

})();
