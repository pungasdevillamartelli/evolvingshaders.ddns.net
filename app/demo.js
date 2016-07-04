
function Demo() {
	this.textureCanvas = null;
	this.glContext = null;
	this.fontStyles = {};
	this.renderer = new Renderer();
	
	// #DEMOSPECIFIC: Styles, object constructors, etc.
}


Demo.prototype.render = function (glContext) {
	this.sequencer.render(glContext, this.renderer);
}

Demo.prototype.initialize = function (glContext, textCanvas) {
	// Scene sequencer
	this.sequencer = new RepeatingSceneSequencer(this,
		function (sequencer) {
			var sceneTime = 10;
			var a = timerValue() % (sequencer.scenesCount() * sceneTime);
			return Math.floor(a / sceneTime);
		}
	);
	
	// Fonts
	var fontStyle = new FontBitmap(["pvm-letter-T", "pvm-letter-N"], 128);
	fontStyle.initialize(glContext, textCanvas);
	this.fontStyles["logo"] = fontStyle;
	var fontStyleComment = new FontStyleBolded("Verdana", 128);
	fontStyleComment.charactersCaps = true;
	fontStyleComment.initialize(glContext, textCanvas);	
	this.fontStyles["comment"] = fontStyleComment;

	// Scenes
	this.sequencer.addScene(initializeScene1, 0, { length: 5 });
	this.sequencer.addScene(initializeScene2, 1, { length: 5 });
	this.sequencer.addScene(initializeScene3, 2, { length: 5 });
	this.sequencer.addScene(initializeScene4, 3, { length: 5 });
	this.sequencer.addScene(initializeScene5, 4, { length: 5 });
	this.sequencer.addScene(initializeScene6, 5, { length: 5 });
	this.sequencer.addScene(initializeScene7, 6, { length: 5 });	
	this.sequencer.addScene(initializeScene8, 7, { length: 5 });	
	this.sequencer.addScene(initializeScene9, 8, { length: 5 });	

	// #TODO: Activate background objects loading
	var shaderCounterIndex = 0;
	var demoSequencer = this.sequencer;
	$.ajaxSetup({ cache: false });
	setInterval(
		function () {
			$.ajax({
					type : 'GET',
					url : "/getEntityByIndex",
					data : { index: shaderCounterIndex },
					dataType : "text",
					success : 
					function (shader) {
						if (shader == "null") return;
						
						function getTextureRandomXCoord() {
							return TextDeformerResource["deformer" + (Math.floor(10 * Math.random()) % 10 + 1)][0];
						}
						
						function getTextureRandomYCoord() {
							return TextDeformerResource["deformer" + (Math.floor(10 * Math.random()) % 10 + 1)][1];
						}
						
						var initializeSceneNew = function (demo, glContext, textCanvas) {
								var background = new ShaderToyParametrizedObject(shader, [ ]); 
								background.initialize(glContext);

								var text = new TextObject(demo.fontStyles["comment"], "PVM", 
														  getTextureRandomXCoord(), 
														  getTextureRandomYCoord(), 
														  TexturesResource.logoFontTexture, TexturesResource.logoBorderTexture, 
														  [ ], 
														  new AnimationProperties(1.0, 2.0, 5, 4),
														  textCanvas, glContext);
								var list = [ background, text ];
								return new Scene(list);
						};
						
						demoSequencer.addAndInitializeScene(initializeSceneNew, { length: 5 }, glContext, textCanvas);
						shaderCounterIndex++;
					},
					error : function(data) {
								console.log('Call failed');
							}
					});
		}, 
		sceneLoadTime
	);
	
	// Set scene sequencer function for repeating from scene 2
	this.sequencer.sceneFunction = function (time, scenesCount) { 
		if (time < 7.0) return 0;
		return (int) (time % scenesCount - 1);
	};
	
	this.sequencer.initializeScenes(glContext, textCanvas);

	// Initialize renderer
	this.renderer.initialize(glContext);
}	

// Scene specification
//		demo:			Demo instance to access any instance variable
//		glContext:		GL rendering context
//		textCanvas:		Name of texture canvas for text rendering
//
function initializeScene1 (demo, glContext, textCanvas) {
	// Background	
	var background = new BackgroundObject(TexturesResource.background1, [ ]);
	background.initialize(glContext);
	
	// Logo
	var timeVar = "TIME * 3.0";
	var effectX = "DIVIDEPROTECTED(DIVIDEPROTECTED((DIVIDEPROTECTED(" + timeVar + ",((SIN(7.0)-Y)-X))*5.0),SQR(" + timeVar + "))," + timeVar + ")";
	var effectY = "2.0";
	var logo = new TextObject(demo.fontStyles["logo"], "TNT", effectX, effectY, 
							  TexturesResource.logoFontTexture, TexturesResource.logoBorderTexture, 
							  [ /* this.sequencer.faderRelativeToSceneBoundary(demo.sequencer, 0.5, 0.5) */ ], 
							  new AnimationProperties(0, 2, 3, 3), 
							  textCanvas, glContext, TextLogoFragmentShaderSrc2);
	logo.shadowEffectLayers = 16;
	
	// Comment
	var text = new TextObject(demo.fontStyles["comment"], "presents", 
							  TextDeformerResource.deformer4[0], TextDeformerResource.deformer4[1], 
							  TexturesResource.logoFontTexture, TexturesResource.logoBorderTexture, 
							  [ ], 
							  new AnimationProperties(1.0, 0.9, 10, 4),
							  textCanvas, glContext);							 
	text.shadowEffectLayers = 8;
	
	var list = [ background, logo, text ];
	return new Scene(list);
}

function initializeScene2 (demo, glContext, textCanvas) {		
	// Background
	var background = new BackgroundInterpolationObject(
		[ TexturesResource.background2a, TexturesResource.background2b ],
		4.0,
		[ ]); 
		
	background.initialize(glContext);
	
	// Varying 
	var text = new TextObject(demo.fontStyles["comment"], "acid", 
							  TextDeformerResource.deformer9[0], TextDeformerResource.deformer9[1], 
							  TexturesResource.logoFontTexture, TexturesResource.logoBorderTexture, 
							  [ ], 
							  new AnimationProperties(1.0, 5.0, 6, 6),
							  textCanvas, glContext);
	text.shadowEffectLayers = 16;
	
	// Balls 
	var balls = new RotationBalls(
		[5, 4, 5, 3, 6, 0],
		[3.0, 1.0, 0.5, 0.25, 0.10, 0.05, 0.02, 0.01],
		[8.5, 3.3, 1.2, 0.45, 0.25, 0.11, 0.05],
		function (node) {
			var result = {};
			result.x = 0.0;
			result.y = 1.5 * node.level;
			result.z = 0.1 * (1 + node.level * 4);
			return result;
		},		"vecadd(vectan(createvector(0.7337,0.2008,0.2437)),vecmultiply(vecmultiply(vectan(vecsubstract(vecmultiply(vectan(vecsubstract(vecsqr(createvector(x,y,y)),vecsin(vecabs(createvector(y,x,x))))),vecsin(createvector(0.0748,0.0758,0.0612))),vecsin(veccos(createvector(0.8157,y,0.7878))))),vecabs(veccos(createvector(y,time,0.4963)))),vecsin(veccos(vecabs(createvector(y,x,x))))))"
		);
	balls.initialize(glContext);
	
	var list = [ background, balls, text ];	
			
	return new Scene(list);
}

function initializeScene3 (demo, glContext, textCanvas) {
	// Background
	var background = new BackgroundInterpolationObject(
		[ TexturesResource.background3a, TexturesResource.background3b, TexturesResource.background3c ],
		4.0,
		[ ]); 
		
	background.initialize(glContext);
	
	// Comment
	var text = new TextObject(demo.fontStyles["comment"], "PvM", 
							  TextDeformerResource.deformer3[0], TextDeformerResource.deformer3[1],
							  TexturesResource.logoFontTexture, TexturesResource.logoBorderTexture, 
							  [ ], 
							  new AnimationProperties(0.0, 4.0, 3, 5),
							  textCanvas, glContext);
	text.shadowEffectLayers = 16;
	var textUp = new TextObject(demo.fontStyles["comment"], "mindcrusher", 
							  TextDeformerResource.flag1[0], TextDeformerResource.flag1[1],
							  TexturesResource.logoFontTexture, TexturesResource.logoBorderTexture, 
							  [ ], 
							  new AnimationProperties(0.0, 5.0, 11, 11),
							  textCanvas, glContext);
	textUp.shadowEffectLayers = 16;
	var textDown = new TextObject(demo.fontStyles["comment"], "ahq", 
							  TextDeformerResource.deformer3[0], TextDeformerResource.deformer3[1],
							  TexturesResource.logoFontTexture, TexturesResource.logoBorderTexture, 
							  [ ], 
							  new AnimationProperties(0.0, 0.0, 3, 5),
							  textCanvas, glContext);
	textDown.shadowEffectLayers = 16;
	
	var list = [ background, text, textUp, textDown];	
	return new Scene(list);
}

function initializeScene4 (demo, glContext, textCanvas) {
	// Balls 
	var balls = new RotationBalls(
		[5, 4, 5, 3, 6, 0],
		[3.0, 1.0, 0.5, 0.25, 0.10, 0.05, 0.02, 0.01],
		[8.5, 3.3, 1.2, 0.45, 0.25, 0.11, 0.05],
		function (node) {
			var result = {};
			result.x = 0.0;
			result.y = 1.5 * node.level;
			result.z = 0.1 * (1 + node.level * 4);
			return result;
		},	"vecadd(vectan(createvector(0.7337,0.2008,0.2437)),vecmultiply(vecmultiply(vectan(vecsubstract(vecmultiply(vectan(vecsubstract(vecsqr(createvector(x,y,y)),vecsin(vecabs(createvector(y,x,x))))),vecsin(createvector(0.0748,0.0758,0.0612))),vecsin(veccos(createvector(0.8157,y,0.7878))))),vecabs(veccos(createvector(y,time,0.4963)))),vecsin(veccos(vecabs(createvector(y,x,x))))))"
		);
	balls.initialize(glContext);
	
	// Background
	var background = new BackgroundInterpolationObject(
		[ TexturesResource.background3c, TexturesResource.background3d, TexturesResource.background3e ],
		4.0,
		[ ]); 
	background.initialize(glContext);
	
	// Comments
	var a = new TextObject(demo.fontStyles["comment"], "todos", 
							  TextDeformerResource.deformer5[0], TextDeformerResource.deformer5[1], 
							  TexturesResource.logoFontTexture, TexturesResource.logoBorderTexture, 
							  [ ], 
							  new AnimationProperties(2.5, 1.0, 10, 10),
							  textCanvas, glContext);
	var b = new TextObject(demo.fontStyles["comment"], "botones", 
							  TextDeformerResource.deformer5[0], TextDeformerResource.deformer5[1], 
							  TexturesResource.logoFontTexture, TexturesResource.logoBorderTexture, 
							  [ ], 
							  new AnimationProperties(1.5, 8.5, 10, 10),
							  textCanvas, glContext);
	a.shadowEffectLayers = 16;
	b.shadowEffectLayers = 16;
							  
	var list = [background, balls, a, b];	
	return new Scene(list);
}

function initializeScene5 (demo, glContext, textCanvas) {
	// Background
	var background = new BackgroundInterpolationObject(
		[ TexturesResource.background3a, TexturesResource.background3b, TexturesResource.background3c ],
		4.0,
		[ ]); 
	background.initialize(glContext);
	// Texts
	var text = new TextObject(demo.fontStyles["comment"], "pvm", 
							  TextDeformerResource.deformer2[0], TextDeformerResource.deformer2[1],
							  TexturesResource.logoFontTexture, TexturesResource.logoBorderTexture, 
							  [ ], 
							  new AnimationProperties(0.0, 2.0, 3, 3),
							  textCanvas, glContext);
	text.shadowEffectLayers = 16;
	var text2 = new TextObject(demo.fontStyles["comment"], "pvm", 
							  TextDeformerResource.deformer2[0], TextDeformerResource.deformer2[1],
							  TexturesResource.logoFontTexture, TexturesResource.logoBorderTexture, 
							  [ ], 
							  new AnimationProperties(0.0, 6.0, 3, 10),
							  textCanvas, glContext);
	text2.shadowEffectLayers = 16;		
	var text3 = new TextObject(demo.fontStyles["comment"], "pvm", 
							  TextDeformerResource.deformer2[0], TextDeformerResource.deformer2[1],
							  TexturesResource.logoFontTexture, TexturesResource.logoBorderTexture, 
							  [ ], 
							  new AnimationProperties(0.0, 11.5, 3, 20),
							  textCanvas, glContext);
	text3.shadowEffectLayers = 16;	
	
	var textUp = new TextObject(demo.fontStyles["comment"], "mindcrusher", 
							  TextDeformerResource.flag1[0], TextDeformerResource.flag1[1],
							  TexturesResource.logoFontTexture, TexturesResource.logoBorderTexture, 
							  [ ], 
							  new AnimationProperties(0.0, 3.5, 11, 11),
							  textCanvas, glContext);
	textUp.shadowEffectLayers = 16;
	var textDown = new TextObject(demo.fontStyles["comment"], "pvm", 
							  TextDeformerResource.deformer1[0], TextDeformerResource.deformer1[1],
							  TexturesResource.logoFontTexture, TexturesResource.logoBorderTexture, 
							  [ ], 
							  new AnimationProperties(0.0, 0.0, 3.2, 5),
							  textCanvas, glContext);
	textDown.shadowEffectLayers = 16;
	
	var list = [ background, text, text2, text3, textUp, textDown];	
	return new Scene(list);
}

function initializeScene6 (demo, glContext, textCanvas) {
	var background = new BackgroundObject(TexturesResource.background4a, []);
	background.initialize(glContext);
	
	var logo = new TextObject(demo.fontStyles["comment"], "PVM", 
							  TextDeformerResource.deformer7[0], TextDeformerResource.deformer7[1],
							  TexturesResource.logoFontTexture, TexturesResource.logoBorderTexture, 
							  [], 
							  new AnimationProperties(0, 1.0, 3.2, 2.0), 
							  textCanvas, glContext);
	logo.shadowEffectLayers = 5;

	return new Scene([ background, logo ]);
}

function initializeScene7 (demo, glContext, textCanvas) {
	// Background
	var background = new BackgroundInterpolationObject(
		[ TexturesResource.background7a, TexturesResource.background7a ],
		4.0,
		[ ]); 
		
	background.initialize(glContext);
	var list = [ background ];	
	
	// Text effect
	for (var i=0; i< 8; i++) {
		var e = Math.pow(2, i);
		var d = 4 * e, n = 0;
		
		for (var j=0; j< i; j++)
			n += e / Math.pow(2, j); 

		var text = new TextObject(demo.fontStyles["comment"], "PVM", 
								  TextDeformerResource.deformer10[0], TextDeformerResource.deformer10[1],
								  TexturesResource.textTexture, TexturesResource.logoBorderTexture, 
								  [ ], 
								  new AnimationProperties(0.0, n, 3.2, d),
								  textCanvas, glContext);
		list.push(text);

		text = new TextObject(demo.fontStyles["comment"], "PVM", 
								  TextDeformerResource.deformer10[0], TextDeformerResource.deformer10[1],
								  TexturesResource.textTexture, TexturesResource.logoBorderTexture, 
								  [ ], 
								  new AnimationProperties(0.0, d - n - 1, 3.2, d),
								  textCanvas, glContext);
		list.push(text);
	}	

	var renderer = new Renderer(
		"precision mediump float; " + 
		"varying vec2 vTextureCoord; " +
		"uniform sampler2D uSampler; " +
		"varying float xx; " + 
		"varying float yy; " + 
		"void main(void) { " + 
		"	 float offset = 1.0 / 300.0;  " + 
		"    vec2 offsets[9]; " +
		"    offsets[0] = vec2(-offset, offset);  " + 
		"    offsets[1] = vec2(0.0,    offset);  " + 
		"    offsets[2] = vec2(offset,  offset);  " + 
		"    offsets[3] = vec2(-offset, 0.0);    " + 
		"    offsets[4] = vec2(0.0,    0.0);    " + 
		"    offsets[5] = vec2(offset,  0.0);    " + 
		"    offsets[6] = vec2(-offset, -offset); " + 
		"    offsets[7] = vec2(0.0,    -offset); " + 
		"    offsets[8] = vec2(offset,  -offset); " + 		
		"    float kernel[9]; " + 
		"    kernel[0] = kernel[1] = kernel[2] = kernel[3] = kernel[5] = kernel[6] = kernel[7] = kernel[8] = 1.0; " + 
		"    kernel[4] = -8.0; " + 
		"    vec3 sampleTex[9]; " + 
		"    for(int i = 0; i < 9; i++) {" + 
		"        sampleTex[i] = vec3(texture2D(uSampler, vTextureCoord.st + offsets[i])); }" + 
		"    vec3 col = vec3(0.0); " + 
		"    for(int i = 0; i< 9; i++) " + 
		"        col += sampleTex[i] * kernel[i]; " + 
		"	 vec2 coord = vTextureCoord; " + 
		"    vec4 textureColor = texture2D(uSampler, vec2(coord.s, coord.t)); " + 
		"    gl_FragColor = vec4(col.x * 0.2 + 0.9 * textureColor.x, col.y * 0.2 + 0.9 * textureColor.y, col.z * 0.2 + 0.9 * textureColor.z, 1.0); " + 
		"}  " 
		);
			
	return new Scene(list, renderer);
}

function initializeScene8 (demo, glContext, textCanvas) {
	// Shader toy background
	var background = new ShaderToyParametrizedObject(ShaderToyResources.example1, [ ]); 
	background.initialize(glContext);

	var text = new TextObject(demo.fontStyles["comment"], "presents", 
							  TextDeformerResource.deformer3[0], TextDeformerResource.deformer4[1], 
							  TexturesResource.logoFontTexture, TexturesResource.logoBorderTexture, 
							  [ ], 
							  new AnimationProperties(1.0, 0.9, 10, 4),
							  textCanvas, glContext);

	var list = [ background, text ];	

	return new Scene(list);
}

function initializeScene9 (demo, glContext, textCanvas) {		
	// Background
	var background = new BackgroundInterpolationObject(
		[ TexturesResource.background2a, TexturesResource.background2b ],
		4.0,
		[ ]); 
		
	background.initialize(glContext);
	
	// Varying 
	var text = new TextObject(demo.fontStyles["comment"], "acid", 
							  TextDeformerResource.deformer9[0], TextDeformerResource.deformer9[1], 
							  TexturesResource.logoFontTexture, TexturesResource.logoBorderTexture, 
							  [ ], 
							  new AnimationProperties(1.0, 5.0, 6, 6),
							  textCanvas, glContext);
	text.shadowEffectLayers = 16;
	
	// Balls 
	var balls = new RotationBalls(
		[5, 5, 3, 6, 0],
		[2.0, 1.0, 0.5, 0.25, 0.10, 0.05, 0.02, 0.01],
		[6.5, 3.4, 1.3, 0.45, 0.25, 0.11, 0.05],
		function (node) {
			var result = {};
			result.x = 0.0;
			result.y = 1.5 * node.level;
			result.z = 0.1 * (1 + node.level * 4);
			return result;
		},		"vecmultiply(vecsin(vecsubstract(vectan(veccos(vecadd(vecsqr(createvector(x,x,x)),vecabs(vectan(vecadd(createvector(x,x,x),createvector(y,y,y))))))),createvector(0.8811,0.3148,0.0960))),veccos(vecadd(vecsin(createvector(0.6348,0.3320,0.4239)),vecabs(vecabs(vecadd(createvector(x,x,x),createvector(y,y,y)))))))"	
		);
	balls.ballDetail = 32;
	balls.vertexShader = 
		"attribute vec3 aVertexPosition; " +
		"attribute vec2 aTextureCoord; " +
		"attribute vec3 aVertexNormal; " +
		"uniform float radius; " +
		"uniform mat4 uMVMatrix; " +
		"uniform mat4 uPMatrix; " +
		"uniform mat3 uNMatrix; " + 
		"uniform vec3 uAmbientColor; " +
		"uniform vec3 uLightingDirection; " +
		"uniform vec3 uDirectionalColor; " +
		"varying vec2 vTextureCoord; " +
		"varying vec3 vLightWeighting; " +
		"varying vec2 vUv; " +
		"varying float noise; " +
		"float hash( float n ) { return fract(sin(n)*753.5453123); }" +
		"float pnoise( in vec3 x ) {" +
		"	vec3 p = floor(x);" +
		"	vec3 f = fract(x);" +
		"	f = f*f*(3.0-2.0*f); " +
		"	float n = p.x + p.y*157.0 + 113.0*p.z; " +
		"	return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x), " +
		"				   mix( hash(n+157.0), hash(n+158.0),f.x),f.y), " +
		"			   mix(mix( hash(n+113.0), hash(n+114.0),f.x), " +
		"				   mix( hash(n+270.0), hash(n+271.0),f.x),f.y),f.z); " +
		"}" + 
		"float turbulence( vec3 p ) {" +
		"	return pnoise(p * 9.0) * (radius * 0.33);" +	
		"}" +		
		"void main(void) {" +
		"   vTextureCoord = aTextureCoord; " +
		"	vec3 transformedNormal = uNMatrix * aVertexNormal; " + 
		"	float directionalLightWeighting = max(dot(transformedNormal, uLightingDirection), 0.0); " + 
		"	vLightWeighting = uAmbientColor + uDirectionalColor * directionalLightWeighting; " +	
		"	float ax = aVertexPosition.x, ay = aVertexPosition.y, az = aVertexPosition.z; " + 
		"	float v = 1.0 + (ax * ax + ay * ay + (az * (az + 35.0))) / 1000.0; " +
		"	vUv = aTextureCoord; " + 
		"	noise = 1.0 * turbulence(0.5 * aVertexNormal); " + 
		"	float displacement = noise + 0.1 * pnoise(aVertexPosition); " + 
		"	vec3 newPosition = aVertexPosition + aVertexNormal * displacement; " + 
		"   gl_Position = uPMatrix * uMVMatrix * vec4(newPosition, 1.0); " +
		"	vLightWeighting = vec3(vLightWeighting.r / v, vLightWeighting.g / v, vLightWeighting.b / v); " + 
		"}";

	balls.fragmentShader =
		"precision mediump float;" +
		"varying vec2 vTextureCoord;" +
		"varying vec3 vLightWeighting;" +
		"varying vec2 vUv; " +
		"uniform sampler2D uSampler;" +
		"uniform float time; " + 
		"vec3 veccos(in vec3 a) { return vec3(cos(a.x), cos(a.y), cos(a.z)); } " + 
		"vec3 vecsin(in vec3 a) { return vec3(sin(a.x), sin(a.y), sin(a.z)); } " + 
		"vec3 vectan(in vec3 a) { return vec3(tan(a.x), tan(a.y), tan(a.z)); } " + 
		"vec3 vecabs(in vec3 a) { return vec3(abs(a.x), abs(a.y), abs(a.z)); } " + 
		"vec3 vecsqr(in vec3 a) { return vec3(a.x * a.x, a.y * a.y, a.z * a.z); } " + 
		"vec3 vecadd(in vec3 a, in vec3 b) { return vec3(a.x + b.x, a.y + b.y, a.z + b.z); } " + 
		"vec3 vecsubstract(in vec3 a, in vec3 b) { return vec3(a.x - b.x, a.y - b.y, a.z - b.z); } " + 
		"vec3 vecmultiply(in vec3 a, in vec3 b) { return vec3(a.x * b.x, a.y * b.y, a.z * b.z); } " + 
		"vec3 vecdiv(in vec3 a, in vec3 b) { return vec3(a.x / b.x, a.y / b.y, a.z / b.z); } " + 
		"vec3 createvector(in float a, in float b, in float c) { return vec3(a, b, c); } " + 
		"vec3 veccolormap(in vec3 a, in vec3 b, in vec3 c) { return createvector(a.x / 10.0, b.x / 10.0, c.x / 10.0); } " + 			
		"float divideprotected(in float x, in float y) { if (abs(y) < 0.001) return 0.0; return x / y; }" + 
		"float sqr(in float x) { return x * x; }" +  	
		"void main(void) {" +
		"	 float x = vTextureCoord.s * 10.0, y = vTextureCoord.t * 10.0; " +
		"  	 vec3 t = TEXTUREFUNCTION; " +
		"  	 gl_FragColor = vec4(t.rgb * vLightWeighting, 1.0); " + 
    "}";

	balls.initialize(glContext);
	
	var list = [ background, balls, text ];	
			
	return new Scene(list);
}


	