var executeSteps = function () {
    _.each(allSteps, executeStep);
};

var parseStep = function (step) {
    var text = step.text;
    var lastChar = '';
    var parsed = [];
    var segment = {
        _type: 'text',
        text: '',
    };
    parsed.push(segment);
    while (text.length) {
        var nextChar = text[1];
        if (
            text[0] === '.' &&
            !('0' <= lastChar && lastChar <= '9') &&
            !('0' <= nextChar && nextChar <= '9')
        ) {
            var segment = {
                _type: 'reference',
                text: '',
                reference: step,
            }
            parsed.push(segment);
            while (text[0] === '.') {
                segment.reference = segment.reference && segment.reference.previous;
                segment.text += '.';
                text = text.slice(1);
            }

            if (!text.length) {
                break;
            }

            var segment = {
                _type: 'text',
                text: '',
            };
            parsed.push(segment);
        }

        segment.text += text[0];
        lastChar = text[0];
        text = text.slice(1);
    }

    return parsed;
};

var executeStep = function (step) {
    step.parsedText = parseStep(step);
    var toEval = _.map(step.parsedText, function (segment) {
        if (segment._type === 'reference') {
            return '(' + segment.reference.result + ')';
        }
        return segment.text;
    });
    toEval = toEval.join('');
    try {
        step.result = eval(toEval);
    } catch (exception) {
        console.log(exception);
        step.result = null;
    }
};
