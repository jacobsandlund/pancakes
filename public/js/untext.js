//window.untext = (function () {

var untext, allSymbols, allViewTree, otherPositions, symbolIdSequence, viewIdSequence, state, lastState, infiniteRecursionSymbol;

var init = function () {
    untext = {};
    allSymbols = null;
    otherPositions = {};
    symbolIdSequence = 0;
    viewIdSequence = 0;
    hovering = null;
    hoveringMode = null;
    mouse = [0, 0];
    stateInit();
};

var setup = function (example) {
    init();
    drawSetup();

    var root = createSymbol({children: [
        createSymbol({children: [
            createSymbol({text: 'Table'}),
            createSymbol({text: 'class'}),
            createSymbol({children: [
                createSymbol({text: 'fibonaci'}),
                createSymbol({text: 'function'}),
                createSymbol({children: [
                    createSymbol({text: 'fibonaci2'}),
                ]}),
            ]}),
        ]}),
    ]});
    allSymbols = [];
    linkSymbols(root);
    infiniteRecursionSymbol = createSymbol({text: '[∞-recursion]'});
    allSymbols.push(infiniteRecursionSymbol);
    allViewTree = root.view;
    updateState({
        inserting: allViewTree.children[0],
        insertingMode: 'tree',
        doStructure: 'tree',
    });

    doStuffAfterStateChanges();
    //loadJSON(example);

    console.log('untext loaded');
};

var linkSymbols = function (node) {
    node.view = createView(node);
    node.view.children = _.map(node.children, function (child) {
        child.parents = [node];
        linkSymbols(child);
        child.view.parent = node.view;
        if (child.leaf) {
            return child.view;
        }
        var left = leftmostLeaf(child);
        var reference = createView(child, {
            reference: true,
            text: left.text,
            textWidth: left.textWidth,
            parent: node.view,
        });
        return reference;
    });
    allSymbols.push(node);
};


var prepJSON = function (node) {
    var json = _.pick(node, 'id', 'symbol', 'bar', 'tower', 'text', 'divider');
    json.children = _.map(node.children, prepJSON);
    return json;
};

var dumpJSON = function () {
    return JSON.stringify(prepJSON(allViewTree));
};

var loadJSONString = function (text) {
    loadJSON(JSON.parse(text));
};

var loadJSON = function (json) {
    allViewTree = _loadJSON(json);
    symbolIdSequence = maxSymbolId(allViewTree) + 1;
    updateState({doStructure: 'symbol'});
    doStuffAfterStateChanges();
};

var _loadJSON = function (jsonNode) {
    var node;
    if (jsonNode.tower) {
        node = createTower(jsonNode);
    } else {
        node = createBar(jsonNode);
        node.children = _.map(jsonNode.children, _loadJSON);
    }
    if (jsonNode.ref) {
        node.ref = _loadJSON(jsonNode.ref);
    }
    return node;
};

var maxSymbolId = function (node) {
    var ids = [node.id];
    if (node.ref) {
        ids.push(maxSymbolId(node.ref));
    }
    if (node.bar) {
        ids = ids.concat(_.map(node.children, maxSymbolId));
    }
    return _.max(ids);
};



var example1 = {"id":24,"symbol":true,"bar":true,"tower":false,"children":[{"id":1,"symbol":true,"bar":false,"tower":true,"text":"Table","divider":false,"empty":false,"children":[],"ref":null},{"id":0,"symbol":true,"bar":false,"tower":true,"text":"class","divider":false,"empty":false,"children":[],"ref":null},{"id":25,"symbol":true,"bar":true,"tower":false,"children":[{"id":3,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":null},{"id":2,"symbol":true,"bar":false,"tower":true,"text":"function","divider":false,"empty":false,"children":[],"ref":null},{"id":26,"symbol":true,"bar":true,"tower":false,"children":[{"id":4,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":27,"symbol":true,"bar":true,"tower":false,"children":[{"id":6,"symbol":true,"bar":false,"tower":true,"text":"if","divider":false,"empty":false,"children":[],"ref":null},{"id":28,"symbol":true,"bar":true,"tower":false,"children":[{"id":7,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":8,"symbol":true,"bar":false,"tower":true,"text":"<","divider":false,"empty":false,"children":[],"ref":null},{"id":9,"symbol":true,"bar":false,"tower":true,"text":"2","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":29,"symbol":true,"bar":true,"tower":false,"children":[{"id":11,"symbol":true,"bar":false,"tower":true,"text":"return","divider":false,"empty":false,"children":[],"ref":null},{"id":12,"symbol":true,"bar":false,"tower":true,"text":"1","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":30,"symbol":true,"bar":true,"tower":false,"children":[{"id":14,"symbol":true,"bar":false,"tower":true,"text":"return","divider":false,"empty":false,"children":[],"ref":null},{"id":31,"symbol":true,"bar":true,"tower":false,"children":[{"id":32,"symbol":true,"bar":true,"tower":false,"children":[{"id":668,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":{"id":280,"symbol":true,"bar":true,"tower":false,"children":[{"id":281,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":null},{"id":282,"symbol":true,"bar":false,"tower":true,"text":"function","divider":false,"empty":false,"children":[],"ref":null},{"id":283,"symbol":true,"bar":true,"tower":false,"children":[{"id":284,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":285,"symbol":true,"bar":true,"tower":false,"children":[{"id":286,"symbol":true,"bar":false,"tower":true,"text":"if","divider":false,"empty":false,"children":[],"ref":null},{"id":287,"symbol":true,"bar":true,"tower":false,"children":[{"id":288,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":289,"symbol":true,"bar":false,"tower":true,"text":"<","divider":false,"empty":false,"children":[],"ref":null},{"id":290,"symbol":true,"bar":false,"tower":true,"text":"2","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":291,"symbol":true,"bar":true,"tower":false,"children":[{"id":292,"symbol":true,"bar":false,"tower":true,"text":"return","divider":false,"empty":false,"children":[],"ref":null},{"id":293,"symbol":true,"bar":false,"tower":true,"text":"1","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":294,"symbol":true,"bar":true,"tower":false,"children":[{"id":295,"symbol":true,"bar":false,"tower":true,"text":"return","divider":false,"empty":false,"children":[],"ref":null},{"id":296,"symbol":true,"bar":true,"tower":false,"children":[{"id":297,"symbol":true,"bar":true,"tower":false,"children":[{"id":615,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":{"id":299,"symbol":true,"bar":true,"tower":false,"children":[{"id":300,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":null},{"id":301,"symbol":true,"bar":false,"tower":true,"text":"function","divider":false,"empty":false,"children":[],"ref":null},{"id":302,"symbol":true,"bar":true,"tower":false,"children":[{"id":303,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":304,"symbol":true,"bar":true,"tower":false,"children":[{"id":305,"symbol":true,"bar":false,"tower":true,"text":"if","divider":false,"empty":false,"children":[],"ref":null},{"id":306,"symbol":true,"bar":true,"tower":false,"children":[{"id":307,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":308,"symbol":true,"bar":false,"tower":true,"text":"<","divider":false,"empty":false,"children":[],"ref":null},{"id":309,"symbol":true,"bar":false,"tower":true,"text":"2","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":310,"symbol":true,"bar":true,"tower":false,"children":[{"id":311,"symbol":true,"bar":false,"tower":true,"text":"return","divider":false,"empty":false,"children":[],"ref":null},{"id":312,"symbol":true,"bar":false,"tower":true,"text":"1","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":313,"symbol":true,"bar":true,"tower":false,"children":[{"id":314,"symbol":true,"bar":false,"tower":true,"text":"return","divider":false,"empty":false,"children":[],"ref":null},{"id":315,"symbol":true,"bar":true,"tower":false,"children":[{"id":316,"symbol":true,"bar":true,"tower":false,"children":[{"id":317,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":null},{"id":318,"symbol":true,"bar":true,"tower":false,"children":[{"id":319,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":320,"symbol":true,"bar":false,"tower":true,"text":"-","divider":false,"empty":false,"children":[],"ref":null},{"id":321,"symbol":true,"bar":false,"tower":true,"text":"1","divider":false,"empty":false,"children":[],"ref":null}],"ref":null}],"ref":null},{"id":322,"symbol":true,"bar":false,"tower":true,"text":"+","divider":false,"empty":false,"children":[],"ref":null},{"id":323,"symbol":true,"bar":true,"tower":false,"children":[{"id":324,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":null},{"id":325,"symbol":true,"bar":true,"tower":false,"children":[{"id":326,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":327,"symbol":true,"bar":false,"tower":true,"text":"-","divider":false,"empty":false,"children":[],"ref":null},{"id":328,"symbol":true,"bar":false,"tower":true,"text":"2","divider":false,"empty":false,"children":[],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}},{"id":329,"symbol":true,"bar":true,"tower":false,"children":[{"id":330,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":331,"symbol":true,"bar":false,"tower":true,"text":"-","divider":false,"empty":false,"children":[],"ref":null},{"id":332,"symbol":true,"bar":false,"tower":true,"text":"1","divider":false,"empty":false,"children":[],"ref":null}],"ref":null}],"ref":null},{"id":333,"symbol":true,"bar":false,"tower":true,"text":"+","divider":false,"empty":false,"children":[],"ref":null},{"id":334,"symbol":true,"bar":true,"tower":false,"children":[{"id":335,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":{"id":336,"symbol":true,"bar":true,"tower":false,"children":[{"id":337,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":null},{"id":338,"symbol":true,"bar":false,"tower":true,"text":"function","divider":false,"empty":false,"children":[],"ref":null},{"id":339,"symbol":true,"bar":true,"tower":false,"children":[{"id":340,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":341,"symbol":true,"bar":true,"tower":false,"children":[{"id":342,"symbol":true,"bar":false,"tower":true,"text":"if","divider":false,"empty":false,"children":[],"ref":null},{"id":343,"symbol":true,"bar":true,"tower":false,"children":[{"id":344,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":345,"symbol":true,"bar":false,"tower":true,"text":"<","divider":false,"empty":false,"children":[],"ref":null},{"id":346,"symbol":true,"bar":false,"tower":true,"text":"2","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":347,"symbol":true,"bar":true,"tower":false,"children":[{"id":348,"symbol":true,"bar":false,"tower":true,"text":"return","divider":false,"empty":false,"children":[],"ref":null},{"id":349,"symbol":true,"bar":false,"tower":true,"text":"1","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":350,"symbol":true,"bar":true,"tower":false,"children":[{"id":351,"symbol":true,"bar":false,"tower":true,"text":"return","divider":false,"empty":false,"children":[],"ref":null},{"id":352,"symbol":true,"bar":true,"tower":false,"children":[{"id":353,"symbol":true,"bar":true,"tower":false,"children":[{"id":354,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":null},{"id":355,"symbol":true,"bar":true,"tower":false,"children":[{"id":356,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":357,"symbol":true,"bar":false,"tower":true,"text":"-","divider":false,"empty":false,"children":[],"ref":null},{"id":358,"symbol":true,"bar":false,"tower":true,"text":"1","divider":false,"empty":false,"children":[],"ref":null}],"ref":null}],"ref":null},{"id":359,"symbol":true,"bar":false,"tower":true,"text":"+","divider":false,"empty":false,"children":[],"ref":null},{"id":360,"symbol":true,"bar":true,"tower":false,"children":[{"id":361,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":null},{"id":362,"symbol":true,"bar":true,"tower":false,"children":[{"id":363,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":364,"symbol":true,"bar":false,"tower":true,"text":"-","divider":false,"empty":false,"children":[],"ref":null},{"id":365,"symbol":true,"bar":false,"tower":true,"text":"2","divider":false,"empty":false,"children":[],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}},{"id":366,"symbol":true,"bar":true,"tower":false,"children":[{"id":367,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":368,"symbol":true,"bar":false,"tower":true,"text":"-","divider":false,"empty":false,"children":[],"ref":null},{"id":369,"symbol":true,"bar":false,"tower":true,"text":"2","divider":false,"empty":false,"children":[],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}},{"id":33,"symbol":true,"bar":true,"tower":false,"children":[{"id":16,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":17,"symbol":true,"bar":false,"tower":true,"text":"-","divider":false,"empty":false,"children":[],"ref":null},{"id":18,"symbol":true,"bar":false,"tower":true,"text":"1","divider":false,"empty":false,"children":[],"ref":null}],"ref":null}],"ref":null},{"id":19,"symbol":true,"bar":false,"tower":true,"text":"+","divider":false,"empty":false,"children":[],"ref":null},{"id":34,"symbol":true,"bar":true,"tower":false,"children":[{"id":679,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":{"id":462,"symbol":true,"bar":true,"tower":false,"children":[{"id":463,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":null},{"id":464,"symbol":true,"bar":false,"tower":true,"text":"function","divider":false,"empty":false,"children":[],"ref":null},{"id":465,"symbol":true,"bar":true,"tower":false,"children":[{"id":466,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":467,"symbol":true,"bar":true,"tower":false,"children":[{"id":468,"symbol":true,"bar":false,"tower":true,"text":"if","divider":false,"empty":false,"children":[],"ref":null},{"id":469,"symbol":true,"bar":true,"tower":false,"children":[{"id":470,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":471,"symbol":true,"bar":false,"tower":true,"text":"<","divider":false,"empty":false,"children":[],"ref":null},{"id":472,"symbol":true,"bar":false,"tower":true,"text":"2","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":473,"symbol":true,"bar":true,"tower":false,"children":[{"id":474,"symbol":true,"bar":false,"tower":true,"text":"return","divider":false,"empty":false,"children":[],"ref":null},{"id":475,"symbol":true,"bar":false,"tower":true,"text":"1","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":476,"symbol":true,"bar":true,"tower":false,"children":[{"id":477,"symbol":true,"bar":false,"tower":true,"text":"return","divider":false,"empty":false,"children":[],"ref":null},{"id":478,"symbol":true,"bar":true,"tower":false,"children":[{"id":479,"symbol":true,"bar":true,"tower":false,"children":[{"id":480,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":{"id":481,"symbol":true,"bar":true,"tower":false,"children":[{"id":482,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":null},{"id":483,"symbol":true,"bar":false,"tower":true,"text":"function","divider":false,"empty":false,"children":[],"ref":null},{"id":484,"symbol":true,"bar":true,"tower":false,"children":[{"id":485,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":486,"symbol":true,"bar":true,"tower":false,"children":[{"id":487,"symbol":true,"bar":false,"tower":true,"text":"if","divider":false,"empty":false,"children":[],"ref":null},{"id":488,"symbol":true,"bar":true,"tower":false,"children":[{"id":489,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":490,"symbol":true,"bar":false,"tower":true,"text":"<","divider":false,"empty":false,"children":[],"ref":null},{"id":491,"symbol":true,"bar":false,"tower":true,"text":"2","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":492,"symbol":true,"bar":true,"tower":false,"children":[{"id":493,"symbol":true,"bar":false,"tower":true,"text":"return","divider":false,"empty":false,"children":[],"ref":null},{"id":494,"symbol":true,"bar":false,"tower":true,"text":"1","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":495,"symbol":true,"bar":true,"tower":false,"children":[{"id":496,"symbol":true,"bar":false,"tower":true,"text":"return","divider":false,"empty":false,"children":[],"ref":null},{"id":497,"symbol":true,"bar":true,"tower":false,"children":[{"id":498,"symbol":true,"bar":true,"tower":false,"children":[{"id":499,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":null},{"id":500,"symbol":true,"bar":true,"tower":false,"children":[{"id":501,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":502,"symbol":true,"bar":false,"tower":true,"text":"-","divider":false,"empty":false,"children":[],"ref":null},{"id":503,"symbol":true,"bar":false,"tower":true,"text":"1","divider":false,"empty":false,"children":[],"ref":null}],"ref":null}],"ref":null},{"id":504,"symbol":true,"bar":false,"tower":true,"text":"+","divider":false,"empty":false,"children":[],"ref":null},{"id":505,"symbol":true,"bar":true,"tower":false,"children":[{"id":506,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":null},{"id":507,"symbol":true,"bar":true,"tower":false,"children":[{"id":508,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":509,"symbol":true,"bar":false,"tower":true,"text":"-","divider":false,"empty":false,"children":[],"ref":null},{"id":510,"symbol":true,"bar":false,"tower":true,"text":"2","divider":false,"empty":false,"children":[],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}},{"id":511,"symbol":true,"bar":true,"tower":false,"children":[{"id":512,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":513,"symbol":true,"bar":false,"tower":true,"text":"-","divider":false,"empty":false,"children":[],"ref":null},{"id":514,"symbol":true,"bar":false,"tower":true,"text":"1","divider":false,"empty":false,"children":[],"ref":null}],"ref":null}],"ref":null},{"id":515,"symbol":true,"bar":false,"tower":true,"text":"+","divider":false,"empty":false,"children":[],"ref":null},{"id":516,"symbol":true,"bar":true,"tower":false,"children":[{"id":517,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":{"id":518,"symbol":true,"bar":true,"tower":false,"children":[{"id":519,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":null},{"id":520,"symbol":true,"bar":false,"tower":true,"text":"function","divider":false,"empty":false,"children":[],"ref":null},{"id":521,"symbol":true,"bar":true,"tower":false,"children":[{"id":522,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":523,"symbol":true,"bar":true,"tower":false,"children":[{"id":524,"symbol":true,"bar":false,"tower":true,"text":"if","divider":false,"empty":false,"children":[],"ref":null},{"id":525,"symbol":true,"bar":true,"tower":false,"children":[{"id":526,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":527,"symbol":true,"bar":false,"tower":true,"text":"<","divider":false,"empty":false,"children":[],"ref":null},{"id":528,"symbol":true,"bar":false,"tower":true,"text":"2","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":529,"symbol":true,"bar":true,"tower":false,"children":[{"id":530,"symbol":true,"bar":false,"tower":true,"text":"return","divider":false,"empty":false,"children":[],"ref":null},{"id":531,"symbol":true,"bar":false,"tower":true,"text":"1","divider":false,"empty":false,"children":[],"ref":null}],"ref":null},{"id":532,"symbol":true,"bar":true,"tower":false,"children":[{"id":533,"symbol":true,"bar":false,"tower":true,"text":"return","divider":false,"empty":false,"children":[],"ref":null},{"id":534,"symbol":true,"bar":true,"tower":false,"children":[{"id":535,"symbol":true,"bar":true,"tower":false,"children":[{"id":536,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":null},{"id":537,"symbol":true,"bar":true,"tower":false,"children":[{"id":538,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":539,"symbol":true,"bar":false,"tower":true,"text":"-","divider":false,"empty":false,"children":[],"ref":null},{"id":540,"symbol":true,"bar":false,"tower":true,"text":"1","divider":false,"empty":false,"children":[],"ref":null}],"ref":null}],"ref":null},{"id":541,"symbol":true,"bar":false,"tower":true,"text":"+","divider":false,"empty":false,"children":[],"ref":null},{"id":542,"symbol":true,"bar":true,"tower":false,"children":[{"id":543,"symbol":true,"bar":false,"tower":true,"text":"fibonaci","divider":false,"empty":false,"children":[],"ref":null},{"id":544,"symbol":true,"bar":true,"tower":false,"children":[{"id":545,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":546,"symbol":true,"bar":false,"tower":true,"text":"-","divider":false,"empty":false,"children":[],"ref":null},{"id":547,"symbol":true,"bar":false,"tower":true,"text":"2","divider":false,"empty":false,"children":[],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}},{"id":548,"symbol":true,"bar":true,"tower":false,"children":[{"id":549,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":550,"symbol":true,"bar":false,"tower":true,"text":"-","divider":false,"empty":false,"children":[],"ref":null},{"id":551,"symbol":true,"bar":false,"tower":true,"text":"2","divider":false,"empty":false,"children":[],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}},{"id":35,"symbol":true,"bar":true,"tower":false,"children":[{"id":21,"symbol":true,"bar":false,"tower":true,"text":"n","divider":false,"empty":false,"children":[],"ref":null},{"id":22,"symbol":true,"bar":false,"tower":true,"text":"-","divider":false,"empty":false,"children":[],"ref":null},{"id":23,"symbol":true,"bar":false,"tower":true,"text":"2","divider":false,"empty":false,"children":[],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null}],"ref":null};


setup(example1);

//return untext;

//})();
