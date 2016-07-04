

function TimeStepsSceneSequencer (demo) {
	this.scenes = [];
	this.timeSteps = [];
	this.initializers = [];
	this.demo = demo;
	
	TimeStepsSceneSequencer.prototype = SceneSequencer;
} 

TimeStepsSceneSequencer.prototype.addScene = function (initializer, sceneIndex, spec) {
	this.initializers.push([ sceneIndex, initializer ]);
	this.timeSteps.push([sceneIndex, spec.end]);
};

TimeStepsSceneSequencer.prototype.addExistingScene = function (sceneIndex, spec) {
	this.timeSteps.push([sceneIndex, spec.end]);
};
	
TimeStepsSceneSequencer.prototype.initializeScenes = function (glContext, textCanvas) {
	for (var i=0; i< this.initializers.length; i++) {
		var sceneIndex = this.initializers[i][0];
		var start = this.getStart(sceneIndex);
		var end = this.getEnd(sceneIndex);
		this.scenes.push(this.initializers[i][1](start, end, this.demo, glContext, textCanvas));
	}
};
	
TimeStepsSceneSequencer.prototype.getSceneNumber = function () {
	for (var i=0; i< this.timeSteps.length; i++) {
		if (timerValue() < this.timeSteps[i][1]) {
			return this.timeSteps[i][0];
		}
	}
	
	return this.scenes.length - 1;
};

// Answer start of the first occurrence
TimeStepsSceneSequencer.prototype.getStart = function (index) {
	if (index==0) return 0.0;
	for (var i=0; i< this.timeSteps.length; i++) {
		if (this.timeSteps[i][0] == index)
			return this.timeSteps[i-1][1];
	}
}

// Answer end of the last occurrence
TimeStepsSceneSequencer.prototype.getEnd = function (index) {	
	var last = 0.0;
	for (var i=0; i< this.timeSteps.length; i++) {
		if (this.timeSteps[i][0] == index)
			last = this.timeSteps[i][1];
	}
	return last;
}
