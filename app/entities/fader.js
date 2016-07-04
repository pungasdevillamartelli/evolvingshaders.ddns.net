function Fader (startStart, startEnd, endStart, endEnd) {
	this.startStart = startStart;
	this.startEnd = startEnd;
	this.endStart = endStart;
	this.endEnd = endEnd;
}


Fader.prototype.apply = function (object) {
	var time = timerValue();
	
	if (time < this.startStart)
		object.transparencyValue = 0.0;
	else if (time < this.startEnd)
		object.transparencyValue = clamp(0.0, 1.0, (time - this.startStart) / (this.startEnd - this.startStart)); 
	else if (time < this.endStart)
		object.transparencyValue = 1.0;
	else if (time < this.endEnd)
		object.transparencyValue = clamp(0.0, 1.0, 1.0 - (time - this.endStart) / (this.endEnd - this.endStart));
	else
		object.transparencyValue = 0.0;
}
