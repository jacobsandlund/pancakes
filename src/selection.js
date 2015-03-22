var createSelection = function (selection) {
    selection = _.extend({
        _type: 'selection',
        kind: 'left', // || hover || right
        group: null,
    }, selection || {});
    selection.id = newId();
    return selection;
};

var selection = {
    focus: null,
    hover: createSelection({kind: 'hover', group: createGroup()}),
    left: createSelection({kind: 'left', group: createGroup()}),
    //right: createSelection({kind: 'right', group: createGroup()}),
    right: createSelection({kind: 'right'}),
    start: null,
    end: null,
    selecting: null, // || 'left', 'right'
};

// var browseSelectionHistory = function (forward) {
//     var pop = function () {
//         if (selectionHistoryI > saveHistoryI) {
//             selectionHistory.pop();
//             selectionHistoryI -= 1;
//             return true;
//         }
//         return false;
//     }
//
//     if (forward) {
//         pop();
//         selectionHistoryI += 1;
//         if (selectionHistoryI === selectionHistory.length) {
//             var stretch = createStretch();
//             var nextSelection = createGroup({stretches: [stretch]});
//             stretch.group = nextSelection;
//             selectionHistory.push({selection: nextSelection});
//             allGroups.push(nextSelection);
//         }
//     } else if (selectionHistoryI > 0 && !pop()) {
//         selectionHistoryI -= 1;
//     }
//     selection = selectionHistory[selectionHistoryI].selection;
// };

var toggleExpanded = function () {
    if (selection.focus) {
        selection.focus.expanded = !selection.focus.expanded;
    }
    update();
};

var selectStepUnderMouse = function (mouse) {
    var x = mouse[0], y = mouse[1];
    return _.find(allPseudoSteps, function (step) {
        if (step.y <= y && y < step.y + step.h) {
            return selectionArea.left <= x && x < selectionArea.right;
        }
        return false;
    });
};

var maybeStartSelection = function (mouse) {
    var step = selectStepUnderMouse(mouse);
    if (!step) {
        return;
    }
    selection.start = step;
    var stretch = createStretch();
    selection.focus = stretch;
    selection.left.group = createGroup({stretches: [stretch]});
    selection.focus.group = selection.left.group;
    allGroups.push(selection.left.group);
    // if (selectionHistoryI !== selectionHistory.length - 1) {
    //     selectionHistory.push({selection: selection});
    //     selectionHistoryI = selectionHistory.length - 1;
    // }
    changeSelection(step);
};

var maybeChangeSelection = function (mouse) {
    if (!selection.start) {
        return;
    }
    var step = selectStepUnderMouse(mouse);
    if (step) {
        changeSelection(step);
    }
};

var changeSelection = function (end) {
    selection.end = end;
    var startI = _.indexOf(allPseudoSteps, selection.start);
    var endI = _.indexOf(allPseudoSteps, selection.end);
    if (endI < startI) {
        var temp = startI;
        startI = endI;
        endI = temp;
    }
    var steps = realSteps(allPseudoSteps.slice(startI, endI + 1));
    setStretchSteps(selection.focus, steps);

    // if (selection.stretches[0].steps.length) {
    //     saveHistoryI = selectionHistoryI;
    // } else {
    //     saveHistoryI = selectionHistoryI - 1;
    // }

    update();
};

var stopSelection = function () {
    selection.start = null;
    selection.end = null;
};
