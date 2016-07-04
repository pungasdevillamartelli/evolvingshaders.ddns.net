var demo, full=false, loaded=false;


function toggleFullscreen() {
	if (!loaded) {
		return;
	}
	
	if (full == true) {
		takeOutFullscreen();
		full = false;
	}
	else {
		makeFullscreen();
		full = true;
	}
}

function takeOutFullscreen() {
	if (document.exitFullscreen) {			  document.exitFullscreen();		} 
	else if (document.msExitFullscreen) {	  document.msExitFullscreen();		} 
	else if (document.mozCancelFullScreen) {  document.mozCancelFullScreen();	} 
	else if (document.webkitExitFullscreen) { document.webkitExitFullscreen();	}
	// #TODO: Attach to back to normal screen event
	setCanvasWithoutFullscreen();
} 

function setCanvasWithoutFullscreen() {
	var canvas = document.getElementById("glCanvas"), style = canvas.style;
	style.width = Math.floor(window.screen.availWidth / 2);
	style.height = Math.floor(window.screen.availHeight / 2);
}

function makeFullscreen() {
	var canvas = document.getElementById("glCanvas"), style = canvas.style;
	canvas.width = window.screen.availWidth;
	canvas.height = window.screen.availHeight;
	style.width = window.screen.availWidth + "px";
	style.height = window.screen.availHeight + "px"; 
	
	if (canvas.requestFullscreen) {				canvas.requestFullscreen();			}
	else if (canvas.msRequestFullscreen) {		canvas.msRequestFullscreen();		}
	else if (canvas.mozRequestFullScreen) {		canvas.mozRequestFullScreen();		}
	else if (canvas.webkitRequestFullscreen) {	canvas.webkitRequestFullscreen();	}

}

function startupDraw () {
	var label = document.getElementById("labelClick");
	
	try {
		var canvas = document.getElementById("glCanvas");
		var gl = initGL(canvas);
		demo = new Demo();
		resetTimer();	
		demo.initialize(gl, "textureCanvas");
		//setupAudioNodes();
	}
	catch(err) {
		label.innerHTML = "Initialization error: " + err.message;
		return;
	}
	
	loaded = true;
	label.innerHTML = "Click canvas for fullscreen";
	setCanvasWithoutFullscreen();
	resetTimer();	
	requestFrame(demo, gl);				
}

function loadSoundFromUrl(callback) {
	loadSound(audioFileName, callback);
}

function requestFrame(demo, gl) {
	demo.render(gl);
	last = performance.now();
	window.requestAnimationFrame(function () { 
		requestFrame(demo, gl); 
	});
}

function initGL(canvas) {
	try {
		var gl = canvas.getContext("experimental-webgl", { alpha: true, depth: true });
		var canvas = document.getElementById("glCanvas"), style = canvas.style;
		style.width = window.screen.availWidth;
		style.height = window.screen.availHeight;
		return gl;
	}
	catch (e) {
		console.log("Error in WebGL initialization.");
	}
	if (!gl) {
		alert("Could not initialize WebGL");
		return null;
	}
}

document.addEventListener("DOMContentLoaded", function(event) { 
	makeFullscreen();
}); 