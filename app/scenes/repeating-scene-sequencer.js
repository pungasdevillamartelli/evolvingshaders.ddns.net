
function RepeatingSceneSequencer (demo, callback) {
	this.prototype = SceneSequencer;

	this.demo = demo;
	this.initializers = [];
	this.callback = callback;
	// #FIX: inheritance fixed
	this.scenes = [];
}


RepeatingSceneSequencer.prototype.addScene = function (initializer, sceneIndex, spec) {
	this.initializers.push([ sceneIndex, initializer ]);
};

RepeatingSceneSequencer.prototype.getSceneNumber = function () {
	return this.callback(this);
};

RepeatingSceneSequencer.prototype.initializeScenes = function (glContext, textCanvas) {
	for (var i=0; i< this.initializers.length; i++) {
		var sceneIndex = this.initializers[i][0];
		this.scenes.push(this.initializers[i][1](this.demo, glContext, textCanvas));
	}
}; 

RepeatingSceneSequencer.prototype.addAndInitializeScene = function (initializer, spec, glContext, textCanvas) {
	var sceneIndex = this.initializers.length;
	this.initializers.push([ sceneIndex, initializer ]);
	this.scenes.push(this.initializers[sceneIndex][1](this.demo, glContext, textCanvas));
};

RepeatingSceneSequencer.prototype.initializeScenes = function (glContext, textCanvas) {
	for (var i=0; i< this.initializers.length; i++) {
		var sceneIndex = this.initializers[i][0];
		this.scenes.push(this.initializers[i][1](this.demo, glContext, textCanvas));
	}
}; 

/*
// #TODO: inheritance and delete
RepeatingSceneSequencer.prototype.faderRelativeToSceneBoundary = function (start, end) {
	 return new Fader(...);
}; */

// #FIX: inheritance and delete
RepeatingSceneSequencer.prototype.render = function (context, renderer) {
	var sceneNumber = this.getSceneNumber();
	renderer.render(this.scenes[sceneNumber], context);
	this.keepDelta(context);	
};

RepeatingSceneSequencer.prototype.scenesCount = function () {
	return this.scenes.length;
}

RepeatingSceneSequencer.prototype.keepDelta = function (gl) {
	var now = performance.now();
	if (last != undefined) {
		delta = now - last;
	}
	
	last = now;
} 