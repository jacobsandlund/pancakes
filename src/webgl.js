'use strict';
var Webgl = {};
(function () {

var devicePixelRatio = window.devicePixelRatio || 1;

var coordsLengthToVerticesRatio = 1 / 2;
var verticesToElementsRatio = 6 / 4;
var coordsLengthToElementsRatio = coordsLengthToVerticesRatio * verticesToElementsRatio;  // 3 / 4

var resultPixelHeightRatio = 12 - 1;
var referencePixelHeightRatio = 8 - 1;

var mainWebgl;
var resultWebgl;

var createWebgl = function () {
    return {
        gl: null,
        program: null,
        canvas: null,
        targetCanvas: null,
        positionIndices: null,
        projectionMatrix: null,

        positionLocation: null,
        colorLocation: null,
        matrixLocation: null,

        positionBuffer: null,
        positionIndicesBuffer: null,
    };
};

var setupAll = function () {
    glMatrix.setMatrixArrayType = Float32Array;

    var mainCanvasParent = d3.select('#canvas').node();
    mainWebgl = createWebgl();
    setup(mainWebgl);
    mainCanvasParent.appendChild(mainWebgl.canvas);
    mainWebgl.targetCanvas = mainWebgl.canvas;

    resultWebgl = createWebgl();
    setup(resultWebgl);
};

var setup = function (webgl) {
    webgl.canvas = document.createElement('canvas');
    try {
        webgl.gl = webgl.canvas.getContext('webgl') || webgl.canvas.getContext('experimental-webgl');
    } catch(e) {}

    var gl = webgl.gl;
    if (!gl) {
        return;
    }

    webgl.program = setupShaderProgram(gl, 'vertex-shader', 'fragment-shader');
    gl.useProgram(webgl.program);

    webgl.positionIndices = new Uint16Array(600000);
    var j = 0;
    for (var i = 0; i < webgl.positionIndices.length;) {
        webgl.positionIndices[i + 0] = j + 0;
        webgl.positionIndices[i + 1] = j + 1;
        webgl.positionIndices[i + 2] = j + 2;
        webgl.positionIndices[i + 3] = j + 2;
        webgl.positionIndices[i + 4] = j + 3;
        webgl.positionIndices[i + 5] = j + 0;
        i += 6;
        j += 4;
    }

    webgl.positionIndicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webgl.positionIndicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, webgl.positionIndices, gl.STATIC_DRAW);

    webgl.positionLocation = gl.getAttribLocation(webgl.program, 'a_position');
    webgl.colorLocation = gl.getUniformLocation(webgl.program, 'u_color');
    webgl.matrixLocation = gl.getUniformLocation(webgl.program, 'u_matrix');

    webgl.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, webgl.positionBuffer);
    gl.enableVertexAttribArray(webgl.positionLocation);
    gl.vertexAttribPointer(webgl.positionLocation, 2, gl.FLOAT, false, 0, 0);
};

var resize = function (webgl) {
    var canvas = webgl.canvas;
    var canvasWidth = webgl.targetCanvas.clientWidth * devicePixelRatio;
    var canvasHeight = webgl.targetCanvas.clientHeight * devicePixelRatio;
    if (canvas.width != canvasWidth || canvas.height != canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        webgl.gl.viewport(0, 0, canvasWidth, canvasHeight);
        webgl.projectionMatrix = null;
    }
    if (!webgl.projectionMatrix) {
        webgl.projectionMatrix = createBasicProjectionMatrix(canvas);
    }
};

var setupShaderProgram = function (gl, vertexId, fragmentId) {
    var vertexShader = createShader(gl, vertexId);
    var fragmentShader = createShader(gl, fragmentId);

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error('Unable to initialize the shader program.');
    }
    return program;
};

var createShader = function (gl, id) {
    var shaderEl = document.getElementById(id);
    if (!shaderEl) {
        throw new Error('Could not find shader: "' + id + '"');
    }

    var sourceText = '';
    var node = shaderEl.firstChild;
    while (node) {
        if (node.nodeType == node.TEXT_NODE) {
            sourceText += node.textContent;
        }
        node = node.nextSibling;
    }

    if (shaderEl.type == 'x-shader/x-fragment') {
        var shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderEl.type == 'x-shader/x-vertex') {
        var shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        throw new Error('Unknown shader type: ' + shaderEl.type);
    }
    gl.shaderSource(shader, sourceText);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    }

    return shader;
};

Webgl.drawMainCanvas = function () {
    var webgl = mainWebgl;
    clear(webgl);

    var quads;
    if (
        Global.hoverResultStepView &&
        !Global.inputStepView &&
        !Global.hoverResultStepView.player
    ) {
        var resultStep = Global.hoverResultStepView.steps[Global.hoverResultStepView.steps.length - 1];
        if (Quads.isQuads(resultStep.result)) {
            quads = resultStep.result;
        }
    } else {
        quads = Global.lastQuads;
    }

    if (quads) {
        var matrix = mat2d.multiply(mat2d.create(), webgl.projectionMatrix, quads.matrix);
        draw(webgl, quads, matrix);
    }
};

Webgl.drawResult = function (canvasParent, quads) {
    var webgl = resultWebgl;
    var canvas = canvasParent.firstChild;
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvasParent.appendChild(canvas);
    }
    webgl.targetCanvas = canvas;

    clear(webgl);
    if (quads) {
        var boundary = Quads.boundaryCoords(quads);
        var projectionMatrix = createZoomedProjectionMatrix(boundary, resultPixelHeightRatio);
        var matrix = mat2d.multiply(mat2d.create(), projectionMatrix, quads.matrix);
        draw(webgl, quads, matrix);
    }

    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(webgl.canvas, 0, 0, canvas.width, canvas.height);
};

Webgl.drawReference = function (canvasParent, quads) {
    var webgl = resultWebgl;
    var canvas = canvasParent.firstChild;
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvasParent.appendChild(canvas);
    }
    webgl.targetCanvas = canvas;

    clear(webgl);
    if (quads) {
        var boundary = Quads.boundaryCoords(quads);
        var projectionMatrix = createZoomedProjectionMatrix(boundary, referencePixelHeightRatio);
        var matrix = mat2d.multiply(mat2d.create(), projectionMatrix, quads.matrix);
        draw(webgl, quads, matrix);
    }

    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(webgl.canvas, 0, 0, canvas.width, canvas.height);
};

var clear = function (webgl) {
    resize(webgl);
    webgl.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    webgl.gl.clear(webgl.gl.COLOR_BUFFER_BIT);
};

var draw = function (webgl, quads, matrix) {
    var gl = webgl.gl;

    var matrix3 = mat3.fromMat2d(mat3.create(), matrix);
    gl.uniformMatrix3fv(webgl.matrixLocation, false, matrix3);

    gl.uniform4f(webgl.colorLocation, 74 / 255, 53 / 255, 121 / 255, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, webgl.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quads.coords, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webgl.positionIndicesBuffer);
    gl.drawElements(gl.TRIANGLES, quads.coords.length * coordsLengthToElementsRatio, gl.UNSIGNED_SHORT, 0);
};

var createBasicProjectionMatrix = function (canvas) {
    var width = canvas.width / devicePixelRatio;
    var height = canvas.height / devicePixelRatio;
    var scaleX = 2 / width;
    var scaleY = 2 / height;
    return new Float32Array([
        scaleX, 0,
        0,      scaleY,
        -1,     -1,
    ]);
};

var createZoomedProjectionMatrix = function (boundary, pixelHeightRatio) {
    var fullWidth = Global.canvasFullWidth;
    var fullHeight = Global.canvasFullHeight;
    var b = boundary;
    if (b[0] < 0) {
        b[0] = 0;
    }
    if (b[1] < 0) {
        b[1] = 0;
    }
    if (b[2] > fullWidth) {
        b[2] = fullWidth;
    }
    if (b[3] > fullHeight) {
        b[3] = fullHeight;
    }
    var bWidth = b[2] - b[0];
    var bHeight = b[3] - b[1];
    if (bWidth < 1) {
        b[2] = b[0] + 1;
        bWidth = 1;
    }
    if (bHeight < 1) {
        b[3] = b[1] + 1;
        bHeight = 1;
    }

    var widthPreGap = fullWidth - bWidth;
    var heightPreGap = fullHeight - bHeight;
    var widthProportion = bWidth / fullWidth;
    var heightProportion = bHeight / fullHeight;
    var proportion = Math.max(widthProportion, heightProportion);

    var x0 = Math.log(1 / fullHeight);
    var x1 = Math.log(fullHeight / fullHeight); // 0
    var y0 = pixelHeightRatio;
    var y1 = 0;
    var x = Math.log(proportion);
    var y = linearInterpolate(x0, y0, x1, y1, x);
    var gapMultiplier = y;

    if (widthProportion > heightProportion) {
        var widthGap = Math.min(bWidth * gapMultiplier, widthPreGap);
        var width = bWidth + widthGap;
        var height = width / fullWidth * fullHeight;
        var heightGap = height - bHeight;
    } else {
        var heightGap = Math.min(bHeight * gapMultiplier, heightPreGap);
        var height = bHeight + heightGap;
        var width = height / fullHeight * fullWidth;
        var widthGap = width - bWidth;
    }

    var leftPreGap = b[0];
    var bottomPreGap = b[1];

    if (widthPreGap > 0) {
        var leftGap = leftPreGap / widthPreGap * widthGap;
    } else {
        var leftGap = 0;
    }
    if (heightPreGap > 0) {
        var bottomGap = bottomPreGap / heightPreGap * heightGap;
    } else {
        var bottomGap = 0;
    }

    var left = b[0] - leftGap;
    var bottom = b[1] - bottomGap;

    var midX = left + width / 2;
    var midY = bottom + height / 2;
    var scaleX = 2 / width;
    var scaleY = 2 / height;

    return new Float32Array([
        scaleX,         0,
        0,              scaleY,
        -midX * scaleX, -midY * scaleY,
    ]);
};

var linearInterpolate = function (x0, y0, x1, y1, x) {
    var xRange = x1 - x0;
    var yRange = y1 - y0;
    var numRanges = (x - x0) / xRange;
    var y = numRanges * yRange + y0;
    return y;
};

setupAll();

})();
