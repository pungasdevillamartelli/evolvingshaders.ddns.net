
// Sequencer
function TextSequencer () {
	this.parts = {};
	this.addPart = function (part) {};
}

this.render = function () {
	
};

// Text effects and properties
function TextEffect() {
	
}

function MovementEffect() {
}

function DisplacementEffect(xValue, yValue, deltaPerSeconds) {
	this.prototype = MovementEffect;
	this.xValue = xValue;
	this.yValue = yValue;
	this.deltaPerSeconds = deltaPerSeconds;
}

DisplacementEffect.prototype.apply = function (object) {
	var value = timerValue() / this.deltaPerSeconds;
	object.animation.x += value * this.xValue;
	object.animation.y += value * this.yValue;
}

function FromOutsideEffect() {
	this.prototype = MovementEffect;
}

function Centered () {
	this.prototype = MovementEffect;
	this.execute = function () {};
}
