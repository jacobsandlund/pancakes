'use strict';
var StepExecution = {};
(function () {

StepExecution.execute = function () {
    var start = +Date.now();
    Global.lastQuads = null;
    Series.clearStartSeries();
    Series.tagStartSeries(Global.series);
    executeSteps();
    _.each(Global.environment, updateEnvironment);
    Player.updateAfterExecute();
    var end = +Date.now();
};

var startNumberChars = ['-', '.', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
var numberChars = ['.', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

var tokenChars = ['(', ')', '+', '~', '*', '/', '%', '<', '>', '&', '|', '='];

StepExecution.lex = function (text) {
    var tokens = [];
    var referenceI = 0;
    var token = {type: 'start-token'};
    for (var i = 0; i < text.length; i++) {
        var c = text[i];
        var nextC = text[i + 1];

        if (c === ' ') {
            if (token.type !== 'whitespace') {
                token = {
                    type: 'whitespace',
                    text: '',
                }
                tokens.push(token);
            }
            token.text += c;
            continue;
        }

        if (c === Reference.sentinelCharacter) {
            token = {
                type: 'reference',
                referenceI: referenceI,
                text: c,
            }
            referenceI += 1;
            tokens.push(token);
            continue;
        }

        if (
            _.contains(startNumberChars, c) &&
            token.type !== 'literal'
        ) {
            token = {
                type: 'literal',
                referenceI: referenceI,
                text: '',
            };
            tokens.push(token);
            referenceI += 1;
            token.text += c;
            continue;
        } else if (_.contains(numberChars, c) && token.type === 'literal') {
            token.text += c;
            continue;
        }

        if (_.contains(tokenChars, c)) {
            token = {
                type: 'token',
                text: c,
            };
            tokens.push(token);
            continue;
        }

        if (token.type !== 'text') {
            token = {
                type: 'text',
                text: '',
            };
            tokens.push(token);
        }
        token.text += c;
    }

    return tokens;
};

var parse = function (step) {
    var tokens = StepExecution.lex(step.text);
    return parseTokenType(step, tokens);
};

var parseTokenType = function (step, lexedTokens) {
    var tokens = [];
    for (var i = 0; i < lexedTokens.length; i++) {
        var token = lexedTokens[i];

        if (token.type === 'reference') {
            tokens.push({
                type: 'reference',
                reference: step.references[token.referenceI],
            });
        } else if (token.type === 'token') {
            tokens.push({
                type: 'token',
                value: token.text,
            });
        } // else if 'whitespace' throw out
    }
    return tokens;
};

var evaluateToken = function (token) {
    if (token.type === 'reference') {
        token.result = token.reference.source.result;
        token.error = token.reference.source.error;
    } else {
        token.result = token.value.replace('~', '-');
        token.error = null;
    }
    return token;
};

var prepareToEval = function (token) {
    if (token.type === 'reference') {
        return '(' + token.result + ')';
    } else {
        return token.result;
    }
};

var executeSteps = function () {
    var lastStep = Global.stepsHead;

    while (true) {
        var step = lastStep.next;
        if (!step) {
            return;
        }
        Series.adjustSeriesLengthFor(step);
        executeStep(step);
        lastStep = step;
    }
};

var executeStep = function (step) {
    if (Step.isEnabled(step)) {
        var action = Library.actions[step.matchesId];
        if (action) {
            var sources = _.pluck(step.references, 'source');
            var error = _.find(tokens, 'error');
            if (error) {
                step.result = null;
                step.error = error;
            } else {
                step.result = action.apply(null, _.pluck(sources, 'result'));
                if (Quads.isQuads(step.result)) {
                    Global.lastQuads = step.result;
                }
                step.error = null;
            }
            return;
        }

        var tokens = parse(step);

        if (!tokens.length) {
            step.result = null;
            step.error = null;
            return;
        }

        tokens = _.map(tokens, evaluateToken);

        var error = _.find(tokens, 'error');
        if (error) {
            step.result = null;
            step.error = error;
            return;
        }

        var quadsResult = _.find(tokens, function (token) {
            return Quads.isQuads(token.result);
        });
        if (quadsResult) {
            quadsResult = quadsResult.result;
            Global.lastQuads = quadsResult;
            step.result = quadsResult;
            step.error = null;
            return;
        }

        var toEval = _.map(tokens, prepareToEval);
        toEval = toEval.join('');

        try {
            step.result = eval(toEval);
            step.error = null;
        } catch (exception) {
            step.result = null;
            step.error = exception.message;
        }
    } else {
        if (step.previous) {
            step.result = step.previous.result;
            step.error = step.previous.error;
        } else {
            step.result = null;
            step.error = null;
        }
    }
};

var updateEnvironment = function (stepView) {
    var step = stepView.step;
    if (step.editable) {
        step.result = step.updatedBy ? step.updatedBy.result : null;
    }
};

})();
