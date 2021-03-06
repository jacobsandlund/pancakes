'use strict';
var StretchView = {};
(function () {

StretchView.create = function (stretch) {
    return {
        kind: 'unselected',
        selectedArea: false,
        steps: [],
        stretch: stretch,
    };
};

StretchView.computeSteps = function (stretchView) {
    stretchView.steps = [];
    var i = 0;
    var steps = stretchView.stretch.steps;
    var real = steps[i];
    while (real) {
        var stepView = real.underStepView;
        var stepViewBoxed = {step: stepView};
        stretchView.steps.push(stepViewBoxed);
        var missingSteps = _.difference(stepView.steps, steps);
        stepViewBoxed.partial = missingSteps.length > 0;
        while (real && real.underStepView === stepView) {
            i += 1;
            real = steps[i];
        }
    }
};

})();
