var drawSetup = function () {

    var svg = d3.select('svg#string')
        .attr('width', width)
        .attr('height', height) ;

    offCameraToken = svg.append('g')
        .classed('token', true)
        .attr('transform', 'translate(-10000,-10000)')
        .append('text') ;

    camera = svg.append('g')
        .classed('camera', true)
        .on('mousemove', function () {
            mouse = d3.mouse(camera.node());
            dragMoving();
        }) ;

    d3.select(document)
        .on('mouseup', function () { inputEvent('left mouse', 'up') })
        .on('keydown', function () { inputEvent(keyForEvent(), 'down') })
        .on('keyup', function () { inputEvent(keyForEvent(), 'up') }) ;


    var background = camera.append('rect')
        .classed('background', true)
        .attr('x', -10000)
        .attr('y', -10000)
        .attr('width', 20000)
        .attr('height', 20000) ;

    computeStructure('token');
    draw(false);
};

var draw = function (sel) {
    if (sel === true || sel == null) {
        computeStructure(movingMode());
        sel = null;
    }
    sel = sel || fullSelection();
    computePositions(sel);
    render(sel);
};

var fullSelection = function (dataSelection) {
    if (dataSelection == null) { dataSelection = true }
    var symbolEls = camera.selectAll('.symbol');
    if (dataSelection) {
        symbolEls = symbolEls.data(allSymbols, key);
    }
    return selection(allSymbols, symbolEls, dataSelection);
};

var movingSelection = function () {
    var symbolEls = camera.select('.symbol.moving');
    return selection([moving], symbolEls, false);
};

var selection = function (symbols, symbolEls, dataSelection) {
    var all,
        target, targetSiblings,
        tokens, bars,
        tokenEls, barEls,
        symbolEnterEls, tokenEnterEls, barEnterEls,
        symbolExitEls, tokenExitEls, barExitEls;

    all = symbols.length === allSymbols.length;

    target = moving || hovering;
    target = _.find(symbols, function (s) { return s === target });
    if (target) {
        targetSiblings = (target.parent && target.parent.children) || [target];
    } else {
        targetSiblings = [];
    }

    tokens = _.where(symbols, {token: true});
    bars = _.where(symbols, {bar: true});

    if (dataSelection) {
        symbolEnterEls = symbolEls.enter().append('g');
        symbolExitEls = symbolEls.exit();
        //symbolEls.order();
    } else {
        symbolEnterEls = symbolExitEls = d3.selectAll([]);
    }

    tokenEls = symbolEls.filter(_.property('token'));
    barEls = symbolEls.filter(_.property('bar'));

    tokenEnterEls = symbolEnterEls.filter(_.property('token'));
    barEnterEls = symbolEnterEls.filter(_.property('bar'));

    tokenExitEls = symbolExitEls.filter(_.property('token'));
    barExitEls = symbolExitEls.filter(_.property('bar'));

    return {
        all: all,
        target: target,
        targetSiblings: targetSiblings,
        symbols: symbols,
        tokens: tokens,
        bars: bars,
        symbolEls: symbolEls,
        tokenEls: tokenEls,
        barEls: barEls,
        symbolEnterEls: symbolEnterEls,
        tokenEnterEls: tokenEnterEls,
        barEnterEls: barEnterEls,
        symbolExitEls: symbolExitEls,
        tokenExitEls: tokenExitEls,
        barExitEls: barExitEls,
    };
};

var computePositions = function (sel) {
    if (sel.all) {
        var x = 0;
        _.each(sel.tokens, function (t) {
            var w;
            if (t.barrier) {
                w = 8;
            } else if (t.empty) {
                w = 30;
            } else {
                w = Math.max(textWidth(t) + 15, 25);
            }
            w += gapWidth;
            var pos = {x: x, w: w};
            x += w;
            _.extend(t, pos);
        });
    }

    _.each(sel.tokens, function (t) {
        var y = yFromLevel(t.level);
        var pos = {y: y, offsetX: 0, offsetY: 0, h: 100 * levelHeight};
        _.extend(t, pos);
    });

    _.each(sel.bars, function (b) {
        var x = b.begin.x;
        var w = b.end.x + b.end.w - x;
        var y = yFromLevel(b.level);
        var pos = {x: x, y: y, offsetX: 0, offsetY: 0, w: w, h: levelHeight};
        _.extend(b, pos);
    });

    if (moving) {
        var info = movingInfo();
        moving.offsetX = info.direction[0] * Math.min(info.absDiff[0] / 3, 2);
        moving.offsetY = info.direction[1] * Math.min(info.absDiff[1] / 3, 2);
    }
};

var yFromLevel = function (level) {
    return level * levelHeight + 10;
};


var render = function (sel) {

    ///// tokens draw

    sel.tokenEnterEls.append('rect')
        .classed('tower', true) ;

    sel.tokenEnterEls.append('text')
        .attr('y', levelHeight + 7) ;

    sel.tokenExitEls.remove();

    sel.tokenEls.select('rect.tower')
        .attr('x', gapWidth / 2)
        .attr('y', function (t) { return t.barrier ? 10 : 35 })
        .attr('width', function (t) { return t.w - gapWidth })
        .attr('height', 100 * levelHeight) ;

    sel.tokenEls.select('text')
        .attr('x', function (t) { return t.w / 2 })
        .text(function (t) { return t.empty ? "∅" : t.text }) ;


    ////// bars draw

    sel.barEnterEls.append('rect')
        .classed('background-bar', true)
        .attr('x', gapWidth / 2)
        .attr('y', gapHeight / 2)

    sel.barExitEls.remove();

    sel.barEls.select('rect.background-bar')
        .attr('width', function (b) { return b.w - gapWidth })
        .attr('height', function (b) {
            if (b === sel.target) {
                return 100 * levelHeight;
            } else {
                return levelHeight - gapHeight;
            }
        }) ;

    ////// symbols draw

    sel.symbolEls.attr('class', function (s) {
            var classes = _.filter([
                'symbol', 'token', 'bar',
                'barrier', 'empty',
            ], function (c) { return s[c] });
            if (s === sel.target) {
                classes.push('target');
            }
            if (_.contains(sel.targetSiblings, s)) {
                classes.push('target-sibling');
            }
            if (s === moving) {
                classes.push('moving');
            }
            return classes.join(' ');
        })
        .attr('transform', function (s) {
            return 'translate(' + (s.x + s.offsetX) + ',' + (s.y + s.offsetY) + ')';
        }) ;

    sel.symbolEnterEls.append('g')
        .call(topBraceEnter) ;

    sel.symbolEls.select('g.top-brace')
        .call(topBrace) ;

    sel.symbolEnterEls.append('rect')
        .classed('mouse', true)
        .on('mouseenter', function (s) {
            hovering = s;
            draw(false);
        })
        .on('mouseleave', function (s) {
            var last = hovering;
            if (s === last) { hovering = null }
            if (last) { draw(false) }
        })
        .attr('x', 0)
        .attr('y', 0) ;

    sel.symbolEls.select('rect.mouse')
        .attr('width', _.property('w'))
        .attr('height', _.property('h')) ;

    sel.symbolEls.select('rect.mouse')
        .on('mousedown', function (s) {
            mouse = d3.mouse(camera.node());
            hovering = s;
            inputEvent('left mouse', 'down');
            startMoving(s);
        }) ;
};

var topBraceEnter = function (g) {
    g
        .classed('top-brace', true)

    g.append('rect')
        .classed('mid-point', true)
        .attr('y', 6)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('width', 6)
        .attr('height', 6) ;

    g.append('path')
};

var topBrace = function (g) {
    g.select('rect.mid-point')
        .attr('x', function (s) { return s.w / 2 - 3 }) ;

    g.select('path')
        .attr('d', topBracePath) ;
};

var topBracePath = function (s) {
    var midX = s.w / 2;
    var midY = 9;
    var startX = gapWidth / 2 + 2;
    var control1X = gapWidth / 2 + 3;
    var control2X = Math.min(gapWidth / 2 + 15, midX);
    var horiz1X = Math.min(gapWidth / 2 + 36, midX);
    var horiz2X = s.w - horiz1X;
    var control3X = s.w - control2X;
    var control4X = s.w - control1X;
    var controlY = 8;
    var endX = s.w - startX;
    var endsY = 25;
    var vertEndsY = 27;
    return  'M'+startX+','+vertEndsY+' '+
            'V'+endsY+' '+
            'C'+control1X+','+controlY+' '+control2X+','+midY+' '+horiz1X+','+midY+' '+
            'H'+horiz2X+' '+
            'C'+control3X+','+midY+' '+control4X+','+controlY+' '+endX+','+endsY+' '+
            'V'+vertEndsY;
};


var textWidth = function (token, recompute) {
    if (!recompute && token._textWidth) {
        return token._textWidth;
    }
    offCameraToken.text(token.text);
    var box = offCameraToken.node().getBBox();
    token._textWidth = Math.ceil(box.width);
    return token._textWidth;
};