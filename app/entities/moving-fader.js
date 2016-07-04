
// #TODO: Move to PVM framework module
function MovingFader (startStart, startEnd, endStart, endEnd) {
	this.startStart = startStart;
	this.startEnd = startEnd;
	this.endStart = endStart;
	this.endEnd = endEnd;
}

MovingFader.prototype.apply = function (object) {
	var time = timerValue();
	var displacement;
	
	object.transparencyValue = 1.0;
	
	if (time < this.startStart)
		displacement = 1.0;
	else if (time < this.startEnd)
		displacement = 1.0 - 1.0 * (time - this.startStart) / (this.startEnd - this.startStart); 
	else if (time < this.endStart)
		displacement = 0.0;
	else if (time < this.endEnd)
		displacement = 0.0 - 1.0 * (time - this.endStart) / (this.endEnd - this.endStart); 
	else
		displacement = -1.0;
	
	if (object.animation.originalX == undefined) {
		object.animation.originalX = object.animation.x;
	}
	
	object.animation.x = object.animation.originalX + displacement * 3.0;
}