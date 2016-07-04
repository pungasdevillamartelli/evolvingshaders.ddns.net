
function Demo() {
	this.textureCanvas = null;
	this.glContext = null;
	this.fontStyles = {};
	this.renderer = new Renderer();
}

//var audioFileName = "audio/theme.mp3";
var audioFFTDefinition = 1024;
var audioUseAudioAnalisys = true;


Demo.prototype.render = function (glContext) {
	this.sequencer.render(glContext, this.renderer);
}

Demo.prototype.initialize = function (glContext, textCanvas) {
	// Scene sequencer
	this.sequencer = new RepeatingSceneSequencer(this, function (sequencer) { return 0; });
	this.sequencer.addScene(initializeSceneView, 0, { length: 10000 });
	this.sequencer.sceneFunction = function (time, scenesCount) { return 0; };
	this.sequencer.initializeScenes(glContext, textCanvas);
	this.renderer.initialize(glContext);
}	

function initializeSceneView (demo, glContext, textCanvas) {
	// Background	
	var background = new ShaderToyParametrizedObject(entityView, [ ]);
	background.initialize(glContext);
	var list = [ background ];
	return new Scene(list);
}
