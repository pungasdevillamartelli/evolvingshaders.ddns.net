// #REFACTOR
// Class for adding simple text messages with some simple effect
function TextAdder2D (glContext, fontStyle, textCanvas) {
	this.glContext = glContext;
	this.fontStyle = fontStyle;
	this.textCanvas = textCanvas;
	this.fontTexture = "CREATEVECTOR(0.0,0.0,0.1)";
	this.fontBorderTexture = "CREATEVECTOR(0.8,0.8, 0.8)";
}


TextAdder2D.prototype.addTexts = function (start, sizex, sizey, effectX, effectY, timetable, texttable, delta, displacement, list) {
	for (var index=0; index< texttable.length; index++) {
		var s = start + timetable[index] - timetable[0];
		var ee = s + delta;
		var textObject = new TextObject(this.fontStyle, texttable[index], effectX, effectY, this.fontTexture, this.fontBorderTexture, 
						 [ new Fader(s, s + 0.1, ee, ee + 0.8) ], 
						 new AnimationProperties(
							sizex / 2 - texttable[index].length * 0.3, 
							(index % 2 == 0) ? sizey / 2 : sizey / 6, 
							sizex, sizey),
						 this.textCanvas, this.glContext);
		textObject.shadowEffectLayers = 15;
		textObject.displacementCompression = displacement;
		textObject.scale = 1.0;
		list.push(textObject);
	}
}

TextAdder2D.prototype.addTextsGreets = function (start, sizex, sizey, effectX, effectY, timetable, texttable, delta, displacement, list) {
	for (var index=0; index< texttable.length; index++) {
		var s = start + timetable[index] - timetable[0];
		var ee = s + delta;
		var textObject = new TextObject(this.fontStyle, texttable[index], effectX, effectY, this.fontTexture, this.fontBorderTexture,  
						 [ new Fader(s, s + 0.5, ee, ee + 0.5) ], 
						 new AnimationProperties(
							sizex / 2 - texttable[index].length * 0.3, 
							sizey / 2, 
							sizex, sizey),
						 this.textCanvas, this.glContext);
		textObject.displacementCompression = displacement;
		textObject.scale = 1.0;
		list.push(textObject);
	}
}
