// Default second pass scene shader
var DefaultRendererFragmentShaderSrc =	
	"precision mediump float; " + 
	"varying vec2 vTextureCoord; " +
	"uniform sampler2D uSampler; " +
	"varying float xx; " + 
	"varying float yy; " + 
	"void main(void) { " + 
	"	vec2 coord = vTextureCoord; " + 
	"   vec4 textureColor = texture2D(uSampler, vec2(coord.s, coord.t)); " + 
	"	gl_FragColor = textureColor; "  + 
	"}";

var DecolorizerRendererFragmentShaderSrc = replaceAll(
	DefaultRendererFragmentShaderSrc,
	"	gl_FragColor = textureColor;",
	"	gl_FragColor = vec4(textureColor.r * 0.5 + rr, textureColor.g * 0.5 + rr, textureColor.b * 0.5 + rr, 1.0);");

var RendererVertexShaderSrc =  		
	"attribute vec3 aVertexPosition; " + 
	"attribute vec2 aTextureCoord; " + 
	"uniform mat4 uMVMatrix; " + 
	"uniform mat4 uPMatrix; " + 
	"varying vec2 vTextureCoord; " + 
	"void main(void) { " + 
	"	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0); " + 
	"	vTextureCoord = aTextureCoord; " + 
	"}";
	
	
function Renderer (fragmentShaderSrc) {
	if (fragmentShaderSrc == null)
		this.fragmentShaderSrc = DefaultRendererFragmentShaderSrc;
	else
		this.fragmentShaderSrc = fragmentShaderSrc;

	this.rttFramebuffer;
	this.rttTexture;
}


Renderer.prototype.initialize = function (gl) {
	this.mvMatrix = mat4.create();
	this.pMatrix = mat4.create();	

	this.initializeFrameBuffers(gl);	
	this.initializeSquare(gl);
	this.initializeShaders(gl);
}

Renderer.prototype.initializeShaders = function (gl) {
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, RendererVertexShaderSrc);
	gl.compileShader(vertexShader);
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	var result = this.fragmentShaderSrc;
	gl.shaderSource(fragmentShader, result);
	gl.compileShader(fragmentShader);
	this.shaderProgram = gl.createProgram();
	var shaderProgram = this.shaderProgram;
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		handleInitError("Could not initialise shaders.");
	}

	gl.useProgram(shaderProgram);
	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
	gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
	shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
}	

Renderer.prototype.initializeSquare = function (gl) {
	this.squareVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
	var vertices = [
		 1.0,  1.0,  0.0,
		 0.0,  1.0,  0.0,
		 1.0,  0.0,  0.0,
		 0.0,  0.0,  0.0
	];				
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	this.itemSize = 3;
	this.numItems = 4;
}

Renderer.prototype.initializeFrameBuffers = function (gl) {
	this.rttFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);
    this.rttFramebuffer.width = gl.drawingBufferWidth;
    this.rttFramebuffer.height = gl.drawingBufferHeight;
	
	this.rttTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.rttTexture);
	
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.rttFramebuffer.width, this.rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	
	var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.rttFramebuffer.width, this.rttFramebuffer.height);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.rttTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

	gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

Renderer.prototype.render = function (scene, gl) {
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	for (var object in scene.objects) {
		scene.objects[object].render(gl);
	}

	gl.useProgram(this.shaderProgram);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.DEPTH_TEST);
	gl.clear(gl.COLOR_BUFFER_BIT);
    mat4.ortho(0, 1, 0, 1, 0.1, 100.0, this.pMatrix);
	mat4.identity(this.mvMatrix);
	mat4.translate(this.mvMatrix, [0.0, 0.0, -1.0]);
	
	gl.activeTexture(gl.TEXTURE0);
    
	gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
	gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix);
	
	gl.bindTexture(gl.TEXTURE_2D, this.rttTexture);
	gl.uniform1i(this.shaderProgram.samplerUniform, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
	gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.itemSize, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
	gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, this.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numItems);	
}


// #DEBUG: function purpose only
var fpsObject, last, frames=0, framesDelta=20, delta = 1 / 60.0, frameCounter=0;


Renderer.prototype.renderFps = function (gl) {
	if (this.fpsObject == undefined) {
		var effectX = "0.0", effectY = "0.0";	
		var fontTexture = "CREATEVECTOR(0.0, 0.0, 0.0)", fontBorderTexture = "CREATEVECTOR(0.0, 0.0, 0.8)";
		var fontStyle = new FontStyle("Verdana", 128);
		fontStyle.initialize(gl, "textureCanvas");
		this.fpsObject = new TextObject(fontStyle, "", effectX, effectY, fontTexture, fontBorderTexture, 
							 [ ], new AnimationProperties(14.0, 19.0, 20.0, 20.0),
							 "textureCanvas", gl);
		this.fpsObject.transparencyValue = 1.0;
	}

	frames++;
	frameCounter++;
	if (frames >= framesDelta) {
		var now = performance.now();
		if (last != undefined) {
			delta = now - last;
		}
		
		last = now;
		frames = 0;
		this.fpsObject.text = 1000.0 / delta + " fps";
	}
	
	this.fpsObject.render(gl);
}
