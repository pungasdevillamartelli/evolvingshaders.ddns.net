
function getDelimiters(text, delimiter) {
	var start = 0, result, results = [];
	
	while (true) {
		result = text.indexOf(delimiter, start);
		if (result >= 0) {
			results.push(result);
			start = result + 1;
		}
		else
			break;
	}
	
	return results;
}

function getStartDelimiters(text) {
	return getDelimiters(text, "#{");
}

function getEndDelimiters(text) {
	return getDelimiters(text, "}#");
}

function parseVars(str) {
	var result = str.substr(str.indexOf("((") + 1, str.length - 1);
	return result.split("))")[0].trim() + ")";
}

function parseFunction(buffer) {
	var text = buffer.substring(2, buffer.length-2);
	// #{distortion((vvv0 float xx)(vvv1 float yy) (vvv2 float time)) :: lisp-math-function-xyz :: sin(x * 100.0) :: (sin (* x 100.0)) }#"
	var result = {};
	var parts = text.split("::");
	result.name = parts[0].split("(")[0];
	result.vars = parseVars(parts[0]);
	result.language = "glsl-dsl";
	result.value = parts[2].trim();
	result.valueDSL = parts[3].trim();
	result.definition = buffer;
	return result;
}

function parseFunctions(text) {
	var startDelimiters = getStartDelimiters(text);
	var endDelimiters = getEndDelimiters(text);
	var functions = [];
	
	for (var i=0; i< startDelimiters.length; i++) {
		var buffer = "";
		for (var j=startDelimiters[i]; j< endDelimiters[i]+2; j++)
			buffer += text[j];
		functions.push(parseFunction(buffer));
	}
	
	return functions;
}
	
function initWebGLSceneShaderMutation(canvas, entity) {
	var canvas = document.getElementById(canvas);
	initGL(canvas);
	initBuffersRGB();
	initShadersShaderMutation(entity)	
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.disable(gl.DEPTH_TEST);
}

function initShadersShaderMutation(entity) {
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, myVertexShaderSrc);
	gl.compileShader(vertexShader);
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, getProcessedShader(entity));
	gl.compileShader(fragmentShader);
	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		// Show error on console
		console.log("Could not initialise shaders for " + entity);
		var errorDescription = gl.getShaderInfoLog(fragmentShader);
		console.log(errorDescription);
		entity.error = true;
		
		// Draw error image
		gl.shaderSource(fragmentShader, fragmentErrorShaderSource);
		gl.compileShader(fragmentShader);		
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);
		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			console.log("Can't even show error.");
			console.log(gl.getShaderInfoLog(fragmentShader));
		}
		
		// Report error
		$.ajax({
			type : 'GET',
			url : "/registerError",
			data : { description: JSON.stringify(errorDescription) },
			dataType : "text",
			success : function(data) { console.log("Error reported");  },
			error : function(data) { console.log('Error reported call failed'); }
		});		
	}
	gl.useProgram(shaderProgram);
	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

function getProcessedShader(entity) {
	var result = entity.code;
	for (var i=0; i< entity.functions.length; i++) {
		// #FIX: old versions fix
		if ((entity.functions[i].value.indexOf("X") > 0) ||
			(entity.functions[i].value.indexOf("YY") > 0) ||
			(entity.functions[i].value.indexOf("TIME") > 0) ||
			(entity.functions[i].value.indexOf("VEC") > 0))
		result = result.replace(entity.functions[i].definition, 
								entity.functions[i].value.toLowerCase());
		else
		result = result.replace(entity.functions[i].definition, 
								entity.functions[i].value);
	}
	return result;
}

function drawEntityImage () { 
	globalVa = timerValue();
	var location = gl.getUniformLocation(shaderProgram, "time");
	gl.uniform1f(location, globalVa);	
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, [0.0, 0.0, -1.2]);
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}
	