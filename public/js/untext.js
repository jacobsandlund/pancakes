var camera, allStatements, mouse, textInput, under;

var statementsX = 160;
var statementsTextX = 50;
var lineHeight = 35;
var statementW = 400;

mouse = null;
under = null;

var drawSetup = function () {
    var svg = d3.select('svg#code')
        .attr('width', '100%')
        .attr('height', '2000px') ;

    camera = svg.append('g')
        .classed('camera', true)
        .on('mousemove', mouseMove) ;

    var background = camera.append('rect')
        .classed('background', true)
        .attr('x', -10000)
        .attr('y', -10000)
        .attr('width', 20000)
        .attr('height', 20000) ;

    textInput = d3.select('#text-input')
        .style('left', (statementsX + statementsTextX + 23) + 'px') ;

    textInput.select('input')
        .style('width', (statementW - statementsTextX - 20) + 'px')
        .style('height', (lineHeight - 12) + 'px') ;

    camera.append('rect')
        .classed('track-rail', true)
        .attr('x', statementsX + 70)
        .attr('y', 10)
        .attr('width', 10)
        .attr('height', 10000) ;

    camera.append('rect')
        .classed('track-rail', true)
        .attr('x', statementsX + statementW - 80)
        .attr('y', 10)
        .attr('width', 10)
        .attr('height', 10000) ;
};

var computePositions = function (statements) {
    var prevPos = {x: 0, y: 0, w: 0, h: 0};
    _.each(statements, function (statement) {
        var pos = {
            x: statementsX,
            y: prevPos.y + lineHeight,
            w: statementW,
            h: lineHeight - 3,
        };
        statement.position = pos;
        _.extend(statement, pos);
        prevPos = pos;
    });
};

var draw = function (sel) {
    var statements = camera.selectAll('g.statement')
        .data(sel.statements) ;

    var statementsEnter = statements.enter().append('g')
        .classed('statement', true)
        .attr('transform', function (d, i) {
            return 'translate(' + d.x + ',' + d.y + ')';
        })
        .each(function (d) {
            d.__el__ = this;
        }) ;
    statementsEnter.append('rect')
        .classed('background', true)
        .attr('x', 0)
        .attr('y', 0)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('width', _.property('w'))
        .attr('height', _.property('h')) ;
    statementsEnter.append('text')
        .attr('y', 21)
        .attr('x', statementsTextX) ;

    statements.select('text')
        .text(_.property('text')) ;
};

var mouseMove = function () {
    mouse = d3.mouse(camera.node());
    fixUnder();
};

var fixUnder = function () {
    var newUnder = findUnderMouse();
    if (newUnder !== under) {
        if (under) {
            d3.select(under.__el__)
                .classed('under-input', false) ;
        }
        textInput.node().blur();
        under = newUnder;
    }

    if (under) {
        d3.select(under.__el__)
            .classed('under-input', true) ;
        textInput
            .style('top', (under.y + 32) + 'px')
            .style('display', 'block')
        textInput.select('input')
            .property('value', under.text) ;
    } else {
        textInput
            .style('display', 'none') ;
    }
};

var findUnderMouse = function () {
    return findFromCoordinates(mouse[0], mouse[1]);
};

var findFromCoordinates = function (x, y) {
    return _.find(allStatements, function (statement) {
        if (statement.y < y && y < statement.y + statement.h) {
            return statement.x < x && x < statement.x + statement.w;
        }
        return false;
    });
};

var selection = function () {
    return {
        statements: allStatements,
    };
};

var createStatement = function (statement) {
    return _.extend({
        text: '',
        position: null,
        __el__: null,
    }, statement);
};

allStatements = _.map([
    {text: '4 + 1'},
    {text: '^ * 3'},
    {text: '^ - 12'},
    {text: 'square width:50 x:100 y:150'},
    {text: '3 + 5'},
    {text: 'square width:50 x:100 y:150'},
    {text: 'square width:100 x:100 y:150'},
    {text: '4 + 1'},
    {text: '^ * 3'},
    {text: '^ - 12'},
    {text: 'square width:50 x:100 y:150'},
    {text: '3 + 5'},
    {text: 'square width:50 x:100 y:150'},
    {text: 'square width:100 x:100 y:150'},
    {text: '4 + 1'},
    {text: '^ * 3'},
    {text: '^ - 12'},
    {text: 'square width:50 x:100 y:150'},
    {text: '3 + 5'},
    {text: 'square width:50 x:100 y:150'},
    {text: 'square width:100 x:100 y:150'},
], createStatement);

drawSetup();
computePositions(allStatements);
draw(selection());
