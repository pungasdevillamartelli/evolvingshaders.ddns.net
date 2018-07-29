
// Init functions
var squareVertexPositionBuffer;

// Text logo
var glContexts = {};
var shaderPrograms = {};


function initWebGLBW(canvas, entity) {
    var canvas = document.getElementById(canvas);
	initGL(canvas);
	initBuffersBW();
	initShadersBW(entity)	
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
}

function initBuffersBW() {
	squareVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	vertices = [1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0 ];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	squareVertexPositionBuffer.itemSize = 3;
	squareVertexPositionBuffer.numItems = 4;
}

function drawEntityImageBW() {
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, [0.0, 0.0, -1.2]);
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}

// VRP
var citiesVertexPositionBuffer;

function initWebGLVRP(parentId) {
    var canvas = document.getElementById(parentId);
	initGL(canvas);
	initBuffersVRP(parentId);
	initShadersVRP();	
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
}

function initBuffersVRP(parentId) {
	var value = lispEditorValue(parentId, "(fitness-evaluator cities-description)");
	value = value.substring(1, value.length-1);
	var value = replaceAll("\\)", " 0.0)", value);
	var value = value.split(") (");
	value[0] = value[0].substring(1, value[0].length);
	value[value.length-1] = value[value.length-1].substring(0, value[value.length-1].length-1);
	var dataArray = [];
	
	for (var index = 0; index< value.length; index++) {
		var temp = getVertexFromString(value[index]);
		dataArray.push(temp[0]);
		dataArray.push(temp[1]);
		dataArray.push(0.0);
	}
	
	citiesVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, citiesVertexPositionBuffer);	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dataArray), gl.STATIC_DRAW);
	citiesVertexPositionBuffer.itemSize = 3;
	citiesVertexPositionBuffer.numItems = value.length;
	pointsBuffer[parentId] = dataArray;
}

function getVertexFromString (string) {
	var result = [];
	var split = string.split(" ");
	result.push(parseFloat(split[0]));
	result.push(parseFloat(split[1]));
	result.push(parseFloat(split[2]));
	return result;
}

function drawEntityVRP (pointsBuffer, canvas) { 
	mat4.ortho(0, canvas.width, 0, canvas.height, -1, 1, pMatrix);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.bindBuffer(gl.ARRAY_BUFFER, citiesVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionLoc, citiesVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.uniformMatrix4fv(shaderProgram.pMatrixLoc, 0, pMatrix);	
	gl.drawArrays(gl.POINTS, 0, citiesVertexPositionBuffer.numItems);	
}

function initGLTextLogo(canvas, canvasName) {
	try {
		glContexts[canvasName] = canvas.getContext("experimental-webgl");
		glContexts[canvasName].viewportWidth = canvas.width;
		glContexts[canvasName].viewportHeight = canvas.height;
	} 
	catch (e) {
	}
	if (!glContexts[canvasName]) {
		alert("Could not initialise WebGL");
	}
}

function initWebGLTextLogo(canvasName, entityPartA, entityPartB) {
	var canvas = document.getElementById(canvasName);
	initGLTextLogo(canvas, canvasName);
	var gl = glContexts[canvasName];
	initShadersTextLogo(canvas, entityPartA, entityPartB);
	initBuffersTextLogo(canvasName);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
}

function initBuffersTextLogo(canvasName) {
	var gl = glContexts[canvasName];
	squareVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	vertices = [
		 1.0,  1.0,  0.0,
		 0.0,  1.0,  0.0,
		 1.0,  0.0,  0.0,
		 0.0,  0.0,  0.0
	];				
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	squareVertexPositionBuffer.itemSize = 3;
	squareVertexPositionBuffer.numItems = 4;		
}

function drawEntityTextLogo (canvasName) { 
	var gl = glContexts[canvasName];
	var textLines = 3, textColumns = 3;
	var shaderProgram = shaderPrograms[canvasName];
	
	// Set blend mode for drawing text
	gl.enable(gl.BLEND);
	gl.blendEquation(gl.FUNC_ADD);
	gl.blendFunc(gl.ONE_MINUS_CONSTANT_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	// Prepare to draw text
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	mat4.identity(pMatrix);
	mat4.ortho(0, textLines, 0, textColumns, 0.1, 100.0, pMatrix);
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, [0.0, 0.0, -1.0]);
	
	globalVa = timerValue();
	var location = gl.getUniformLocation(shaderProgram, "va");
	gl.uniform1f(location, globalVa);	
	location = gl.getUniformLocation(shaderProgram, "vb");
	gl.uniform1f(location, globalVb);	
	location = gl.getUniformLocation(shaderProgram, "vc");
	gl.uniform1f(location, globalVc);	
	location = gl.getUniformLocation(shaderProgram, "vd");
	gl.uniform1f(location, globalVd);
	location = gl.getUniformLocation(shaderProgram, "time");
	gl.uniform1f(location, timerValue());
	location = gl.getUniformLocation(shaderProgram, "wiggleAmount");
	gl.uniform1f(location, 0.02);
	
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.activeTexture(gl.TEXTURE0);
	
	// Draw text
	drawText("PVM", 0.0, 1.0, 1.0, canvasName); 
	drawText("PVM", 0.0, 2.0, 1.0, canvasName); 
}	

// RGB Vector
function initWebGLRGB(canvas, entity) {
    var canvas = document.getElementById(canvas);
	initGL(canvas);
	initBuffersRGB();
	initShadersRGB(entity)	
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
}

function initBuffersRGB() {
	squareVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	vertices = [
		 1.0,  1.0,  0.0,
		-1.0,  1.0,  0.0,
		 1.0, -1.0,  0.0,
		-1.0, -1.0,  0.0
	];	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	squareVertexPositionBuffer.itemSize = 3;
	squareVertexPositionBuffer.numItems = 4;
}

function drawEntityImageRGB () { 
	globalVa = timerValue();
	var location = gl.getUniformLocation(shaderProgram, "va");
    gl.uniform1f(location, globalVa);	
	location = gl.getUniformLocation(shaderProgram, "vb");
    gl.uniform1f(location, globalVb);	
	location = gl.getUniformLocation(shaderProgram, "vc");
    gl.uniform1f(location, globalVc);	
	location = gl.getUniformLocation(shaderProgram, "vd");
	gl.uniform1f(location, globalVd);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, [0.0, 0.0, -1.2]);
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}

// RGB Composite
function initWebGLRGBComposite(canvas, entity, a, b, c) {
    var canvas = document.getElementById(canvas);
	initGL(canvas);
	initBuffersRGB();
	initShadersRGBComposite(entity, a, b, c)	
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
}

// RGB Animation
function initWebGLRGBAnimate(canvas, entity) {
    var canvas = document.getElementById(canvas);
	initGL(canvas);
	initBuffersRGB();
	initShadersRGBAnimate(entity)	
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
}

var globalStartTime = 0.0;
var globalTime = 0.0, globalVa = 0.0, globalVb = 0.0, globalVc = 0.0, globalVd = 0.0;
var deltaTime = 0.1;

function resetTimer() {
	globalStartTime = Date.now();
}

function timerValue() {
	return (Date.now() - globalStartTime) / 1000.0;
}

function drawEntityImageRGBAnimate () {
	globalVa = timerValue();
	var location = gl.getUniformLocation(shaderProgram, "va");
    gl.uniform1f(location, globalVa);	
	location = gl.getUniformLocation(shaderProgram, "vb");
    gl.uniform1f(location, globalVb);	
	location = gl.getUniformLocation(shaderProgram, "vc");
    gl.uniform1f(location, globalVc);	
	location = gl.getUniformLocation(shaderProgram, "vd");
	gl.uniform1f(location, globalVd);
	location = gl.getUniformLocation(shaderProgram, "time");
    gl.uniform1f(location, timerValue());	
	
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, [0.0, 0.0, -1.2]);
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}

// RGB interpolated animation
function initWebGLRGBInterpolatedAnimate(canvas, entity) {
    var canvas = document.getElementById(canvas);
	initGL(canvas);
	initBuffersRGB();
	initShadersRGBInterpolatedAnimate(entity)	
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
}

var timeFrame = 4.0;
var indexA = 0, indexB = 0;
var lastUpdate;

function initializeInterpolation(count) {
	indexA = Math.floor(Math.random() * count);
	updateInterpolationValues();
	setInterval(function () { updateInterpolationValues(count); }, 1000 * timeFrame);
}

function updateInterpolationValues(count) {	
	// random
	indexA = indexB;
	indexB = Math.floor(Math.random() * count);
	
	/*
	// ciclico
	indexA++;
	if (indexA > count - 1) indexA = 0;
	indexB = indexA + 1;
	if (indexB > count - 1) indexB = 0; */
	
	lastUpdate = timerValue();	
}

function drawEntityImageRGBInterpolatedAnimate () {
	var valueAA = (timerValue() - lastUpdate) / timeFrame;

	var location = gl.getUniformLocation(shaderProgram, "indexA");
    gl.uniform1f(location, indexA);	
	location = gl.getUniformLocation(shaderProgram, "indexB");
    gl.uniform1f(location, indexB);	
	location = gl.getUniformLocation(shaderProgram, "aa");
    var aa = valueAA < 1.0 ? valueAA : 1.0;
	gl.uniform1f(location, 1.0 - aa);	
	
	drawEntityImageRGBAnimateSound();
}

// RGB sound vector
function initWebGLRGBAnimateSound(canvas, entity) {
    var canvas = document.getElementById(canvas);
	initGL(canvas);
	initBuffersRGB();
	initShadersRGBAnimateSound(entity)	
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.disable(gl.DEPTH_TEST);
}

function drawEntityImageRGBAnimateSound () {
	globalVa = timerValue();
	var location = gl.getUniformLocation(shaderProgram, "va");
    gl.uniform1f(location, globalVa);	
	location = gl.getUniformLocation(shaderProgram, "vb");
    gl.uniform1f(location, globalVb);	
	location = gl.getUniformLocation(shaderProgram, "vc");
    gl.uniform1f(location, globalVc);	
	location = gl.getUniformLocation(shaderProgram, "vd");
	gl.uniform1f(location, globalVd);	
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, [0.0, 0.0, -1.2]);
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}

resetTimer();