
function ParametricAnimation(x, y, sizeX, sizeY) {
	this.xFunction = eval(x);
	this.yFunction = eval(y);
}


ParametricAnimation.prototype.x = function (i) { 
	return this.xFunction(i); 
}

ParametricAnimation.prototype.y = function (i) { 
	
	return this.yFunction(i); 
}
