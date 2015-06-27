'use strict';
var Draw = {};
(function () {

Draw.trackContainer = null;
Draw.trackHtml = null;

// var historyWidth = 20;
var trackSvg;
var selectionInfoEl;
var selectionHistoryEl;
var selectionHistoryCursor;
var __stretches = [];
var environmentContainer;

Draw.setup = function () {
    drawOverallSetup();
    drawStepsSetup();
    drawEnvironmentSetup();
    //drawSelectionHistorySetup();
    drawSelectionInfoSetup();
    drawStretchesSetup();
};

Draw.draw = function () {
    //computeSelectionHistoryPositions();

    drawSteps(Global.stepViews);
    drawEnvironment();
    computeStretchPositions(Group.groupsToDraw(Global.groups));
    //drawSelectionHistory();
    drawSelectionInfo();
    drawStretches(__stretches);
};

var computeSelectionHistoryPositions = function () {
    var prevPos = {x: 360, y: 200, w: 0, h: 0};
    __selectionHistoryAll = selectionHistory;
    for (var i = selectionHistory.length - 1; i >= 0; i--) {
        var selectionView = selectionHistory[i];
        var pos = {
            x: prevPos.x - historyWidth,
            y: prevPos.y,
            w: historyWidth,
            h: historyWidth,
        };
        selectionView.position = pos;
        _.extend(selectionView, pos);
        prevPos = pos;
    }
};

var computeStretchPositions = function (groups, stepViews) {
    __stretches = [];

    var x = Draw.trackHtml.node().offsetLeft;
    var selectionX = {
        foreground: x + 13,
        background: x + 31,
    };
    x -= 19 + 9;

    _.each(groups, function (group) {
        _.each(group.stretchViews, function (stretch) {
            var first = stretch.steps[0];
            var last = stretch.steps[stretch.steps.length - 1];
            var firstTop = first.step.__el__.offsetTop;
            var lastTop = last.step.__el__.offsetTop;
            var lastHeight = last.step.__el__.offsetHeight;
            var pos = {
                x: x,
                y: firstTop,
                w: 9,
                h: lastTop + lastHeight - firstTop,
            };
            stretch.position = pos;
            stretch.kind = 'unselected';
            _.extend(stretch, pos);

            __stretches.push(stretch);
        });
        x -= 9;
    });
    _.each(['foreground', 'background'], function (kind) {
        if (Global.selection[kind].group) {
            _.each(Global.selection[kind].group.stretchViews, function (originalStretch) {
                originalStretch.kind = 'selected';
                var stretch = _.clone(originalStretch);
                stretch.kind = kind;
                stretch.selectedArea = true;
                stretch.x = selectionX[kind];
                stretch.w = 11;
                __stretches.push(stretch);
            });
        }
    });
};


var drawOverallSetup = function() {
    Draw.trackContainer = d3.select('#track');

    Draw.trackHtml = d3.select('div#track-html');
    trackSvg = d3.select('svg#track-svg');

    d3.select(document)
        .on('keydown', function () { Input.inputEvent(Input.keyForEvent(), 'down') })
        .on('keyup', function () { Input.inputEvent(Input.keyForEvent(), 'up') })
        .on('keypress', function () {
            window.getSelection().removeAllRanges();
            Main.maybeUpdate(function () {
                Global.inputStepView = null;
                Global.connectStepView = null;
            });
            Input.keypressEvent(d3.event.keyCode)
        })
        .on('mousemove', Main.mouseMove)
        .on('mouseup', Main.mouseUp)
        .on('mousedown', Main.mouseDown)
        .on('contextmenu', function () {
            d3.event.preventDefault();
        }) ;

    d3.select('#canvas')
        .on('mousemove', function () {
            var mouse = d3.mouse(this);
            Global.mouseX.result = Math.max(0, Math.min(mouse[0], Global.canvasFullWidth - 1));
            var height = Global.canvasFullHeight - 1;
            Global.mouseY.result = Math.max(0, Math.min(height - mouse[1], height));
            Main.update();
        }) ;
};


///////////////// Steps

var drawStepsSetup = function () {
};

var stepHtml = function (stepView) {
    var parsed = DrawHelper.lexStepView(stepView);
    var references = stepView.step.references;
    var htmls = _.map(parsed, function (token) {
        if (token.type === 'reference') {
            var source = references[token.referenceI].source;
            if (source.result === null) {
                var result = '-';
            } else if (Quads.isQuads(source.result)) {
                var result = 'pic';
            } else {
                var result = DrawHelper.clipNumber(source.result, 6);
            }
            var width = 9 + 9 * result.length;
            if (result.indexOf('.') !== -1) {
                width -= 4;
            }
            return '<span class="reference-text reference-' +
                    token.referenceI + '" style="width: ' + width + 'px;">' +
                    token.text + '</span>';
        }
        return token.text;
    });
    return htmls.join('');
};

var drawSteps = function (steps) {
    var stepEls = Draw.trackHtml.selectAll('div.step')
        .data(steps, function (d) { return d.step.id }) ;

    var stepEnterEls = stepEls.enter().append('div')
        .on('mouseenter', function (d) {
            Main.maybeUpdate(function () {
                Global.hoverStepView = d;
            });
        })
        .on('mouseleave', function (d) {
            window.setTimeout(function () {
                Main.maybeUpdate(function () {
                    if (Global.hoverStepView === d) {
                        Global.hoverStepView = null;
                    }
                });
            }, 0);
        }) ;

    var stepBoxEnterEls = stepEnterEls.append('div')
        .classed('step-box', true) ;

    var enableDisableEnterEls = stepBoxEnterEls.append('div')
        .classed('enable-disable', true)
        .on('mousedown', function (d) {
            Step.clickEnableRegion(d);
            d3.event.stopPropagation();
        })
        .on('click', function (d) {
            d3.event.stopPropagation();
        }) ;

    var enableConnectorContainer = enableDisableEnterEls.append('div')
        .classed('enable-connector-container', true) ;
    enableConnectorContainer.append('div')
        .classed('enable-connector', true) ;

    var selectionEdgeEnterEls = stepBoxEnterEls.append('div')
        .classed('selection-edge', true) ;

    var expressionContainerEnterEls = stepBoxEnterEls.append('div')
        .classed('expression-container', true) ;

    var down = false;

    expressionContainerEnterEls.append('div')
        .classed('expression', true)
        .attr('contenteditable', true)
        .on('focus', function (d) {
            Main.maybeUpdate(function () { Global.inputStepView = d });
        })
        .on('blur', function (d) {
            Main.maybeUpdate(function () { Global.inputStepView = null });
        })
        .on('input', function (d) {
            Global.inputStepView = d;
            Step.updateText(this);
        })
        .on('mousedown', function (d) {
            Main.maybeUpdate(function () { Global.inputStepView = d });
            d3.event.stopPropagation();
        })
        .on('keypress', function () {
            d3.event.stopPropagation();
        })
        .on('keydown', function (d) {
            down = true;
            Input.textInputEvent(d, Input.keyForEvent());
        })
        .on('keyup', function () {
            down = false;
            Main.update();
            d3.event.stopPropagation();
        }) ;

    var resultEnterEls = stepBoxEnterEls.append('div')
        .classed('result', true)
        .on('mouseenter', function (d) {
            Main.maybeUpdate(function () {
                Global.hoverResultStepView = d;
            });
        })
        .on('mouseleave', function (d) {
            window.setTimeout(function () {
                Main.maybeUpdate(function () {
                    if (Global.hoverResultStepView === d) {
                        Global.hoverResultStepView = null;
                    }
                });
            }, 0);
        })
        .on('mousedown', function (d) {
            Step.insertOrUpdateReference(d);
            d3.event.stopPropagation();
            d3.event.preventDefault();
        }) ;

    resultEnterEls.append('div')
        .classed('result-content-text', true) ;

    resultEnterEls.append('div')
        .classed('result-content-canvas', true) ;

    resultEnterEls.append('div')
        .classed('result-border', true) ;

    var resultCornerContainerEnterEls = resultEnterEls.append('div')
        .classed('result-corner-container', true) ;

    resultCornerContainerEnterEls.append('div')
        .classed('result-corner', true)
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


    stepBoxEnterEls.append('div')
        .style('clear', 'both') ;

    stepEls.exit().remove();

    stepEls.each(function (d) { d.__el__ = this });
    stepEls.order();

    stepEls
        .attr('class', function (d) {
            var classes = ['step'];
            if (MultiStep.isEnabled(d)) {
                classes.push('enabled');
            } else {
                classes.push('disabled');
            }
            if (MultiStep.forceEnabled(d)) {
                classes.push('force-enabled');
            } else if (MultiStep.forceDisabled(d)) {
                classes.push('force-disabled');
            }
            if (_.intersection(d.steps, Selection.__activeSteps).length) {
                classes.push('active');
            }
            if (d === Global.hoverStepView) {
                classes.push('hover');
            }
            if (d === Global.inputStepView) {
                classes.push('inserting');
            }
            if (d === Global.connectStepView) {
                classes.push('connecting');
            }
            var step = d.steps[d.steps.length - 1];
            if (step.result && Quads.isQuads(step.result)) {
                classes.push('canvas-result');
            } else {
                classes.push('text-result');
            }
            return classes.join(' ');
        })
        .style('height', function (d) { return (d.h - 1) + 'px' })
        .style('top', function (d) { return d.y + 'px' })
        .style('left', function (d) { return d.x + 'px' }) ;

    stepEls.select('.expression-container').each(function (d) {
        var container = d3.select(this);
        var expressionEl = container.select('.expression').node();

        var html = stepHtml(d);
        var cursorOffset = DomRange.currentCursorOffset(expressionEl);
        if (expressionEl.innerHTML !== html) {
            expressionEl.innerHTML = html;
            if (cursorOffset !== -1) {
                DomRange.setCurrentCursorOffset(expressionEl, cursorOffset);
            }
        }
    });

    DrawReferences.updateInserting();

    DrawReferences.draw(stepEls.select('.expression-container'));

    /////////////////// must be after updateInserting

    stepEls.select('.enable-connector')
        .attr('class', function (d) {
            var enabledBy = MultiStep.enabledBy(d);
            var classes = ['enable-connector'];
            if (enabledBy.length) {
                var color = DrawReferences.colorForEnableConnector(d, enabledBy);
                classes.push(color);
                classes.push('enable-connector-connected');
            }
            return classes.join(' ');
        }) ;

    DrawHelper.updateEnableOuterConnectors();

    stepEls.select('.result')
        .attr('class', function (d) {
            var step = d.steps[d.steps.length - 1];
            if (!step) {
                debugger;
            }
            return 'result ' + DrawReferences.colorForResult(d);
        }) ;

    stepEls.select('.result-content-text')
        .text(function (d) {
            var step = d.steps[d.steps.length - 1];
            if (step.result === null) {
                return '';
            }
            if (Quads.isQuads(step.result)) {
                return 'pic';
            } else {
                return DrawHelper.clipNumber(step.result, 12);
            }
        }) ;

    stepEls.select('.result-content-canvas')
        .each(function (d) {
            var result = d.steps[d.steps.length - 1].result;
            if (result && Quads.isQuads(result)) {
                Webgl.drawResult(this, result);
            }
        });
};


///////////////// Environment

var drawEnvironmentSetup = function () {
    environmentContainer = d3.select('#environment');
};

var drawEnvironment = function () {
    var environmentEls = environmentContainer.selectAll('.environment')
        .data(Global.environment) ;

    var environmentEnterEls = environmentEls.enter().append('div')
        .classed('environment', true)
        .on('mouseenter', function (d) {
            Main.maybeUpdate(function () {
                Global.hoverResultStepView = d;
            });
        })
        .on('mouseleave', function (d) {
            window.setTimeout(function () {
                Main.maybeUpdate(function () {
                    if (Global.hoverResultStepView === d) {
                        Global.hoverResultStepView = null;
                    }
                });
            }, 0);
        }) ;

    var nameEnterEls = environmentEnterEls.append('div')
        .classed('name', true) ;

    var resultEnterEls = environmentEnterEls.append('div')
        .classed('result', true)
        .on('mouseenter', function (d) {
            Main.maybeUpdate(function () {
                Global.hoverResultStepView = d;
            });
        })
        .on('mouseleave', function (d) {
            window.setTimeout(function () {
                Main.maybeUpdate(function () {
                    if (Global.hoverResultStepView === d) {
                        Global.hoverResultStepView = null;
                    }
                });
            }, 0);
        })
        .on('mousedown', function (d) {
            Step.insertOrUpdateReference(d);
            d3.event.stopPropagation();
            d3.event.preventDefault();
        }) ;

    resultEnterEls.append('div')
        .classed('result-content-text', true) ;

    resultEnterEls.append('div')
        .classed('result-border', true) ;

    var resultCornerContainerEnterEls = resultEnterEls.append('div')
        .classed('result-corner-container', true) ;

    resultCornerContainerEnterEls.append('div')
        .classed('result-corner', true)
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

    environmentEnterEls.append('div')
        .style('clear', 'both') ;


    environmentEls.exit().remove();

    environmentEls.each(function (d) { d.__el__ = this });

    environmentEls
        .attr('class', function (d) {
            var classes = ['environment'];
            var step = d.steps[d.steps.length - 1];
            if (step.result && Quads.isQuads(step.result)) {
                classes.push('canvas-result');
            } else {
                classes.push('text-result');
            }
            return classes.join(' ');
        }) ;

    environmentEls.select('.result')
        .attr('class', function (d) {
            return 'result ' + DrawReferences.colorForResult(d);
        }) ;

    environmentEls.select('.name')
        .text(function (d) { return d.step.text }) ;

    environmentEls.select('.result-content-text')
        .text(function (d) { return d.step.result }) ;
};


///////////////// Selections

var drawSelectionHistorySetup = function () {
    selectionHistoryEl = trackSvg.append('g')
        .classed('selection-history', true)
        .attr('transform', 'translate(600,200)') ;

    selectionHistoryCursor = selectionHistoryEl.append('rect')
        .classed('selection-cursor', true)
        .attr('x', 1)
        .attr('y', 1)
        .attr('width', historyWidth - 2)
        .attr('height', historyWidth - 2) ;
};

var drawSelectionInfoSetup = function () {
    selectionInfoEl = d3.select('#selection');
};

var drawSelectionHistory = function () {
    var historyEls = selectionHistoryEl.selectAll('g.history')
        .data(__selectionHistoryAll) ;

    var historyEnterEls = historyEls.enter().append('g')
        .classed('history', true) ;

    historyEnterEls.append('rect')
        .classed('background', true)
        .attr('x', 3)
        .attr('y', 3)
        .attr('width', function (d) { return d.w - 6 })
        .attr('height', function (d) { return d.h - 6 }) ;

    historyEnterEls.append('text')
        .attr('x', 10)
        .attr('y', historyWidth / 2 + 3) ;

    historyEnterEls.append('rect')
        .classed('mouse', true)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', _.property('w'))
        .attr('height', _.property('h'))
        .on('click', function (d, i) {
            selectionHistoryI = i;
            Global.selection = selectionHistory[selectionHistoryI].selection;
            Main.update();
        }) ;

    historyEls.exit().remove();

    historyEls
        .attr('transform', function (d, i) {
            return 'translate(' + d.x + ',' + d.y + ')';
        }) ;

    historyEls.select('rect.background')
        .style('fill', function (d, i) {
            var c = d.selection.color;
            return 'hsl(' + c[0] + ',' + c[1] + '%,' + c[2] + '%)';
        }) ;

    historyEls.select('text')
        .text(function (d) {
            return d.selection.text.slice(0, 2);
        }) ;

    selectionHistoryCursor
        .attr('transform', function () {
            var d = selectionHistory[selectionHistoryI];
            return 'translate(' + d.x + ',' + d.y + ')';
        }) ;
};

var drawSelectionInfo = function () {
    var selections = [
        Global.selection.foreground,
        Global.selection.background,
    ];

    var selectionEls = selectionInfoEl.selectAll('.selection-info')
        .data(selections) ;

    selectionEls.select('.selection-color-border')
        .style('border-color', function (d) {
            return d.group ? '#555' : '#eee';
        }) ;

    selectionEls.select('.selection-color')
        .style('background-color', function (d) {
            if (d.group) {
                var c = d.group.color;
                return 'hsl(' + c[0] + ',' + c[1] + '%,' + c[2] + '%)';
            }
            return 'white';
        }) ;
};


///////////////// Stretches

var drawStretchesSetup = function () {
};

var drawStretches = function (stretches) {
    var stretchEls = trackSvg.selectAll('g.stretch')
        .data(stretches) ;

    var stretchEnterEls = stretchEls.enter().append('g');

    stretchEnterEls.append('rect')
        .classed('background', true)
        .attr('x', 0.5)
        .attr('y', 2.5)
        .attr('rx', 2)
        .attr('ry', 2) ;

    stretchEnterEls.append('rect')
        .classed('mouse', true)
        .attr('x', 0)
        .attr('y', 0)
        .on('mousedown', function (d) {
            var kind = Selection.buttonSelectionKind();
            Global.selection[kind].focus = d.stretch;
            Global.selection[kind].group = d.stretch.group;
            // selectionHistoryI = saveHistoryI + 1;
            // selectionHistory[selectionHistoryI] = {selection: Global.selection};
            Global.connectStepView = null;
            Main.update();
            d3.event.stopPropagation();
        }) ;

    stretchEls.exit().remove();

    stretchEls
        .attr('class', function (d) {
            var classes = ['stretch', 'selection-' + d.kind];
            if (d.kind === 'foreground' || d.kind === 'background') {
                if (d.stretch === Global.selection[d.kind].focus) {
                    classes.push('selection-focus');
                }
            }
            if (d.selectedArea) {
                classes.push('selected-area');
            }
            return classes.join(' ');
        })
        .attr('transform', function (d, i) {
            return 'translate(' + d.x + ',' + d.y + ')';
        }) ;

    stretchEls.select('rect.background')
        .attr('width', function (d) { return d.w - 2 })
        .attr('height', function (d) { return d.h - 4 })
        .style('fill', function (d, i) {
            if (d.kind === 'selected') {
                return 'white';
            }
            var c = d.stretch.group.color;
            var light = c[2];
            if (d.kind === 'foreground' &&
                d.stretch === Global.selection.foreground.focus) {
                light -= 20;
            }
            return 'hsl(' + c[0] + ',' + c[1] + '%,' + light + '%)';
        }) ;

    stretchEls.select('rect.mouse')
        .attr('width', _.property('w'))
        .attr('height', _.property('h')) ;
};

})();
