
var ShaderToyVertextShaderSrc = 
	"attribute vec3 aVertexPosition; " +
	"attribute vec2 aTextureCoord; " + 
	"uniform mat4 uMVMatrix; " + 
	"uniform mat4 uPMatrix; " + 
	"varying float xx, yy; " + 
	"void main(void) { " + 
	"	vec2 coord = aTextureCoord; " + 
	"	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 2.0); " + 
	"	xx = clamp(aVertexPosition.x,0.0,1.0); " + 
	"	yy = clamp(aVertexPosition.y,0.0,1.0); " + 
	"}";
	
var ShaderToyFragmentShaderSrc =
	"precision mediump float; " + 
	"uniform float iGlobalTime; " + 
	"varying float xx; " + 
	"varying float yy; " + 	
	"vec2 iResolution = vec2(1.0, 1.0); " + 
	"FUNCTION " + 
	"void main() {" + 
	"	mainImage(gl_FragColor, vec2(xx, yy)); " + 
	"}";

// http://www.pouet.net/prod.php?which=57245
var ShaderToyExample1 =
	"void mainImage(out vec4 fragColor, in vec2 fragCoord){" + 
	"	vec3 c;" + 
	"	vec2 r = vec2(iResolution.xy);" + 
	"	float t = iGlobalTime;" + 
	"	float l,z=t;" + 
	"	for(int i=0;i<3;i++) {" + 
	"		vec2 uv,p=fragCoord.xy/r;" + 
	"		uv=p;" + 
	"		p-=.5;" + 
	"		p.x*=r.x/r.y;" + 
	"		z+=.07;" + 
	"		l=length(p);" + 
	"		uv+=p/l*(sin(z)+1.)*abs(sin(l*9.-z*2.));" + 
	"		c[i]=.01/length(abs(mod(uv,1.)-.5));" + 
	"	}" + 
	"	fragColor=vec4(c/l,t);" + 
	"}";
	
var ShaderToyResources = 
{
	example1: ShaderToyExample1
};



function ShaderToyParametrizedObject (entity, effects) {
	this.entity = entity;
	this.effects = effects;
	this.globalScale = 1.0;
	this.globalXRef = 1.0;
	this.globalYRef = 1.0;	
	// #TODO: Inherit and delete
	this.transparencyValue = 1.0;	
} 
	
ShaderToyParametrizedObject.prototype.initialize = function (gl) {
	this.mvMatrix = mat4.create();
	this.pMatrix = mat4.create();
	this.initBuffersRGB(gl);
	this.initShadersRGBAnimate(gl);
}

ShaderToyParametrizedObject.prototype.render = function (gl) {
	var globalVa = timerValue();
	gl.useProgram(this.shaderProgram);
	
	// Update animation effects
	for (var effect in this.effects) {
		this.effects[effect].apply(this);
	}
	
	var location = gl.getUniformLocation(this.shaderProgram, "iGlobalTime");
    gl.uniform1f(location, timerValue());	
	location = gl.getUniformLocation(this.shaderProgram, "faderValue");
    gl.uniform1f(location, this.transparencyValue);	
	
	gl.disable(gl.DEPTH_TEST);
	gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
	
	mat4.identity(this.pMatrix);
	mat4.ortho(0, 1, 0, 1, 0.1, 100.0, this.pMatrix);
	
	mat4.identity(this.mvMatrix);
	mat4.translate(this.mvMatrix, [0.0, 0.0, -10.0]);
	gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
	gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.itemSize, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
	gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, this.itemSize, gl.FLOAT, false, 0, 0);
	this.setMatrixUniforms(gl);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numItems);
}

ShaderToyParametrizedObject.prototype.initBuffersRGB = function (gl) {
	this.squareVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.squareVertexPositionBuffer);
	var vertices = [
		 2.0,  2.0,  0.0,
		 0.0,  2.0,  0.0,
		 2.0,  0.0,  0.0,
		 0.0,  0.0,  0.0
	];	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	this.itemSize = 3;
	this.numItems = 4;
}

ShaderToyParametrizedObject.prototype.initShadersRGBAnimate = function (gl) {
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, ShaderToyVertextShaderSrc);
	gl.compileShader(vertexShader);

	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	var result = this.entity;
	gl.shaderSource(fragmentShader, result);
	gl.compileShader(fragmentShader);

	this.shaderProgram = gl.createProgram();
	var shaderProgram = this.shaderProgram;
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		handleInitError("Could not initialize background shaders (" + gl.getShaderInfoLog(fragmentShader) + ").");
	}

	gl.useProgram(shaderProgram);
	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
	gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

ShaderToyParametrizedObject.prototype.setMatrixUniforms = function (gl) {
	gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
	gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix);
}