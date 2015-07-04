'use strict';
var Manipulation = {};
(function () {

Manipulation.copyActiveStretches = function () {
    _.each(Global.active, copyStretch);

    Main.update();
};

var copyStretch = function (original) {
    var p = Stretch.overlappingPartitions(original);
    var notCovering = _.union(
        p("<<[<<>_]__"),
        p("__[_<>>]>>"),
        p("__[<==>]__")
    );

    var cloneMap = {};
    _.each(notCovering, function (originalStretch) {
        if (Stretch.isGroupStretch(originalStretch)) {
            var stretch = Stretch.createGroupStretch();
            stretch.group = originalStretch.group;
            stretch.group.stretches.push(stretch);
            cloneMap[originalStretch.id] = stretch;
        } else {
            var stretch = MultiStep.create();
            stretch.matchesId = originalStretch.matchesId;
            stretch.text = originalStretch.text;
            stretch.collapsed = originalStretch.collapsed;
            cloneMap[originalStretch.id] = stretch;
        }
    });

    var copy = cloneMap[original.id];
    _.each(original.steps, function (originalStep) {
        var step = Step.create();
        step.matchesId = originalStep.matchesId;
        step.text = originalStep.text;
        step.stretches = _.filter(originalStep.stretches, function (originalStretch) {
            return _.contains(notCovering, originalStretch);
        });
        step.stretches = _.map(step.stretches, function (originalStretch) {
            var stretch = cloneMap[originalStretch.id];
            stretch.steps.push(step);
            return stretch;
        });

        // fixed below
        step.references = _.map(originalStep.references, function (originalReference) {
            return {
                reference: originalReference,
                referenceAway: originalStep.__index - originalReference.source.__index,
            };
        });
        _.each(originalStep.referencedBy, function (originalReference) {
            if (
                !_.contains(original.steps, originalReference.sink) &&
                !originalReference.absolute
            ) {
                Reference.setSource(originalReference, step);
            }
        });
    });

    var previous = original.steps[original.steps.length - 1];
    var next = previous.next;
    var lastCopyStep = copy.steps[copy.steps.length - 1];
    Step.linkSteps([previous, copy.steps[0]]);
    Step.linkSteps(copy.steps);
    Step.linkSteps([lastCopyStep, next]);

    Step.computeSteps();
    _.each(copy.steps, function (step) {
        var references = _.map(step.references, function (r) {
            var reference = Reference.create();
            reference.sink = step;
            if (
                !_.contains(original.steps, r.reference.source) &&
                r.reference.absolute
            ) {
                reference.source = r.reference.source;
            } else {
                reference.source = Global.steps[step.__index - r.referenceAway];
            }
            reference.absolute = r.reference.absolute;
            return reference;
        });
        step.references = [];
        Step.setReferences(step, references);
    });

    _.each(p("<=[===>]__"), function (stretch) {
        stretch.steps.push(lastCopyStep);
    });

    _.each(p("<<[<==>]>>"), Stretch.fixupSteps);
    _.each(p("__[_<<<]=>"), function (originalAfter) {
        var stretch = cloneMap[originalAfter.id];
        stretch.steps.push(originalAfter.steps[originalAfter.steps.length - 1]);
        Stretch.fixupSteps(stretch);
        originalAfter.steps.push(original.steps[original.steps.length - 1]);
        Stretch.fixupSteps(originalAfter);
    });

    var focus = Global.selection.foreground.focus;
    if (cloneMap[focus.id]) {
        Global.selection.foreground.focus = cloneMap[focus.id];
    }
};

Manipulation.insertNewStep = function () {
    var matchesId = Main.newId();
    _.each(Global.active, function (stretch) {
        _insertNewStep(stretch, matchesId);
    });

    Main.update();
    d3.select(Global.inputStepView.__el__).select('.expression').node().focus();
};

var _insertNewStep = function (stretch, matchesId) {
    var previous = stretch.steps[stretch.steps.length - 1];
    var next = previous.next;
    var newStep = Step.create();
    newStep.matchesId = matchesId;

    Step.linkSteps([previous, newStep, next]);

    var p = Stretch.overlappingPartitions(stretch);
    var focusOverlapping = _.intersection(p("__[<==>]__"), Selection.foregroundStretches());
    _.each(p("<=[===>]__").concat(focusOverlapping), function (stretch) {
        stretch.steps.push(newStep);
    });
    _.each(p("<<[<==>]>>"), Stretch.fixupSteps);
    _.each(p("__[_<<<]=>"), Stretch.fixupSteps);

    if (_.intersection(Global.inputStepView.steps, stretch.steps).length) {
        Global.inputStepView = newStep.stepView;
    }
};

Manipulation.deleteActiveStretches = function () {
    _.each(Global.active, deleteStretch);
    Main.update();
};

var deleteStretch = function (stretch) {
    var start = stretch.steps[0];
    var end = stretch.steps[stretch.steps.length - 1];
    var previous = start.previous;
    var next = end.next;
    Step.linkSteps([previous, next]);

    _.each(stretch.steps, function (step) {
        _.each(step.referencedBy, function (reference) {
            if (!_.contains(stretch.steps, reference.sink)) {
                var source = Global.steps[step.__index - stretch.steps.length];
                Reference.setSource(reference, source);
            }
        });
    });

    var p = Stretch.overlappingPartitions(stretch);
    _.each(p("<=[>>>>]__"), function (stretch) {
        stretch.steps.push(previous);
        Stretch.fixupSteps(stretch);
    });
    _.each(p("__[<<<<]=>"), function (stretch) {
        stretch.steps.unshift(next);
        Stretch.fixupSteps(stretch);
    });
    _.each(p("__[<<>>]__"), function (stretch) {
        if (Stretch.isGroupStretch(stretch)) {
            stretch.group.stretches = _.without(stretch.group.stretches, stretch);
        }
    });
};

Manipulation.selectActiveStretches = function () {
    var group = Group.create();
    var focus = null;
    group.stretches = _.map(Global.active, function (originalStretch) {
        var stretch = Stretch.createGroupStretch();
        stretch.group = group;
        if (originalStretch === Global.active.focus) {
            focus = stretch;
        }
        return stretch;
    });
    Global.groups.push(group);

    Global.selection.foreground.focus = focus;
    Global.selection.foreground.group = group;
};

Manipulation.computeGroupIntersection = function () {
    if (!Global.selection.foreground.group || !Global.selection.background.group) {
        return;
    }
    var intersection = Group.create();
    Global.groups.push(intersection);
    var stepsById = {};
    _.each(Global.selection.foreground.group.stretches, function (stretch) {
        _.each(stretch.steps, function (step) {
            var stepInfo = {
                step: step,
                foreStretch: stretch.id,
            };
            stepsById[step.id] = stepInfo;
        });
    });
    _.each(Global.selection.background.group.stretches, function (stretch) {
        _.each(stretch.steps, function (step) {
            if (stepsById[step.id]) {
                stepsById[step.id].backStretch = stretch.id;
            }
        });
    });
    var steps = _.sortBy(stepsById, function (step) {
        return _.indexOf(Global.steps, step.step);
    });
    var stretches = [];
    var stretch = null;
    var lastStep = null;
    _.each(steps, function (step) {
        if (!step.backStretch) {
            lastStep = step;
            return;
        }
        if (
            stretch &&
            lastStep.step.next === step.step &&
            lastStep.foreStretch === step.foreStretch &&
            lastStep.backStretch === step.backStretch
        ) {
            stretch.push(step.step);
        } else {
            if (stretch) {
                stretches.push(stretch);
            }
            stretch = [step.step];
        }
        lastStep = step;
    });
    if (stretch) {
        stretches.push(stretch);
    }
    intersection.stretches = _.map(stretches, function (steps) {
        var stretch = Stretch.createGroupStretch();
        stretch.group = intersection;
        Stretch.setSteps(stretch, steps);
        return stretch;
    });
    Global.selection.foreground.group = intersection;
    Global.selection.background.group = intersection;
    var foreFocus = Global.selection.foreground.focus;
    var backFocus = Global.selection.background.focus;
    _.each(intersection.stretches, function (stretch) {
        if (_.intersection(stretch.steps, foreFocus.steps)) {
            foreFocus = stretch;
        }
        if (_.intersection(stretch.steps, backFocus.steps)) {
            backFocus = stretch;
        }
    });
    Global.selection.foreground.focus = foreFocus;
    Global.selection.background.focus = backFocus;
};

})();
