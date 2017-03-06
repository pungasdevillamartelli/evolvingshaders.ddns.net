 
// GPExplorer interface
module.exports = {
	initializeGPExplorerImages: initializeGPExplorerImages,
	genericGPExplorerMessage: genericGPExplorerMessage,
	getInfixConverted: getInfixConverted,
	getGlslConvert: getGlslConvert,	
	createRandom: createRandom,		
	getDefault: getDefault,	
	mutateFunctions: mutateFunctions,
	mutateFunctionsWithVars: mutateFunctionsWithVars,	
	crossoverWithVars: crossoverWithVars,
	parseGLSLType: parseGLSLType,	
	crossoverFunctions: crossoverFunctions,	
}

var connectedGPExplorerImages;
var net = require('net'),
	utils = require('./utils');

function initializeGPExplorerImages() {
	connectedGPExplorerImages = 1;
}

function createGPExplorerSocket() {
	var value = 20000 + Math.ceil(Math.random() * 1000) % connectedGPExplorerImages;
	return net.createConnection(value.toString(), "127.0.0.1");
}

function genericGPExplorerMessage(res, connectFunction, dataFunction) {
	var socket = createGPExplorerSocket();
	
	socket
		.on('data', function(data) {
			socket.destroy();
			
			if (dataFunction != null)
				dataFunction(data);
			else
				res.end(data);
		})
		.on('error', function (e) 		{ console.log("ERROR " + e.toString()); })
		.on('connect', function () 		{ connectFunction(socket); })
		.on('end', function () 			{ /* console.log("END"); */ })
		.on('close', function(data) 	{ /* console.log("CLOSE"); */ });
}

function getInfixConverted(res, exp) {
	genericGPExplorerMessage(res, 
		function(socket) {
			socket.write("(make-instance 'tcp-message :name (quote message-web-interface-infix-converted) :content (list (quote " + exp + ")))\n");
		});
}

function getGlslConvert(res, exp) {	
	genericGPExplorerMessage(res, 
		function(socket) {
			socket.write("(make-instance 'tcp-message :name (quote message-web-interface-glsl-converted) :content (list (quote " + exp + ")))\n");
		});
}

function createRandom(res, language, maxSize) {
	genericGPExplorerMessage(res, 
		function(socket) {
			socket.write("(make-instance 'tcp-message :name (quote message-web-interface-create-random) :content (list (quote " + language + ") " + maxSize + "))\n");
		});
}

function getDefault(res, name, properties) {
	genericGPExplorerMessage(res, 
		function(socket) {
			socket.write("(make-instance 'tcp-message :name (quote message-web-interface-get-default) :content (list (quote " + name + ") (quote " + properties + ")))\n");
		});
}

function mutateFunctions(res, language, objectData, maxSize) {	
	genericGPExplorerMessage(res, 
	function(socket) {
		socket.write("(make-instance 'tcp-message :name (quote message-web-interface-mutate) :content (list (quote " + language + ") (quote " + objectData + ") " + maxSize + "))\n");
	});
};

function mutateFunctionsWithVars(res, arguments) {	
	var language = arguments.language, exp = arguments.entity, vars = arguments.vars, maxSize = arguments.maxSize;

	genericGPExplorerMessage(
		res, 
		function(socket) {
			var message = "(make-instance 'tcp-message :name (quote message-web-interface-mutate-with-vars) :content (list (quote " + language + ") (quote " + vars + ") (quote " + exp + ") " + maxSize + "))\n";
			socket.write(message);
		},
		function(data) {
			var result = data.toString().split("|")[1].trim().toLowerCase();
			var dslValue = data.toString().split("|")[0].trim();
			var parts = vars.split("(");
			
			for (var part in parts) {
				var p = parts[part];
				
				if ((p != "") && (p != ")") && (p != "))")) {
					// Get variable names
					p = utils.replaceAllOn(p, ")", "");
					var varspart = p.split(" ");
					// Replace
					result = utils.replaceAllOn(result, varspart[0].toLowerCase(), varspart[2]);
				}
			}
			
			res.end(dslValue + "|" + result);
		});
}

function crossoverWithVars(res, arguments) {
	var language = arguments.language, 
		expA = arguments.expA, 
		expB = arguments.expB, 
		vars = arguments.vars, 
		maxSize = arguments.maxSize;

	genericGPExplorerMessage(
		res, 
		function(socket) {
			var message = "(make-instance 'tcp-message :name (quote message-web-interface-crossover-with-vars) :content (list (quote GLSL-GRAMMAR-TEST) (quote " + vars + ") (quote " + expA + ") (quote " + expB + ") " + maxSize + "))\n";
			socket.write(message);
		},
		function(data) {
			var result = data.toString().split("|")[1].trim().toLowerCase();
			var dslValue = data.toString().split("|")[0].trim();
			var parts = vars.split("(");
			
			for (var part in parts) {
				var p = parts[part];
				
				if ((p != "") && (p != ")") && (p != "))")) {
					// Get variable names
					p = utils.replaceAllOn(p, ")", "");
					var varspart = p.split(" ");
					// Replace
					result = utils.replaceAllOn(result, varspart[0].toLowerCase(), varspart[2]);
				}
			}
			
			res.end(dslValue + "|" + result);
		});
}

function parseGLSLType(exp, vars, callback) {
	var socket = net.createConnection("20000", "127.0.0.1");
	var message = "(make-instance 'tcp-message :name (quote message-web-interface-glsl-parse-result) " +
						":content (list (quote GLSL-GRAMMAR-TEST) (quote " + exp + ") (quote " + vars + ")))\n";
	var connectFunction = function(socket) {
		socket.write(message);
	};
	
	socket
		.on('data', function(data) {
						debug.debugReplyMessage(message, data);
						socket.destroy();
						callback(data);
					})
		.on('error', function (e) { console.log(e.toString()); })
		.on('connect', function () { connectFunction(socket); })
		.on('end', function () { })
		.on('close', function(data) { }); 
}

function crossoverFunctions(res, language, objectDataA, objectDataB, maxSize) {		
	try {
		genericGPExplorerMessage(res, 
		function(socket) {
			socket.write("(make-instance 'tcp-message :name (quote message-web-interface-crossover) :content (list (quote " + language + ") (quote " + objectDataA + ") (quote " + objectDataB + ") " + maxSize + "))\n");
		});	
	} 
	catch (ex) {
		callback(ex);
	}
}