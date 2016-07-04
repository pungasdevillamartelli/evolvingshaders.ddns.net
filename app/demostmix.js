
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
	this.sequencer.addScene(initializeScene5, 4, { length: 5 });
	this.sequencer.addScene(initializeScene6, 5, { length: 5 });
	this.sequencer.addScene(initializeScene7, 6, { length: 5 });	

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
