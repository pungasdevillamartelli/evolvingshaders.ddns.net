// Modules required
var http = require('http'),
	path = require('path'),
	fs = require('fs'),
	net = require('net'),
	url = require('url'),
	querystring = require('querystring')
	uuid = require('node-uuid'),
	swig  = require('swig'),
	stream = require('stream'),
	glsl = require('glsl-man');

// Configuration
http.globalAgent.maxSockets = 20;
var requestTimeOut = 45000;
var listeningPort = 9889;
var variableReplacementPrefix = "vvv";

var defaultGLSLCodeOptions = {
	tab: '\t',       
	space: ' ',      
	newline: '\n',  
	terminator: ';', 
	comma: ','
};

// DB init
var likeSchema, Like, dislikeSchema, Dislike, entitiesSchema, Entity, errorEntriesSchema, ErrorEntry, adminLikeSchema, AdminLike;
var mongoose = require('mongoose');
var db = mongoose.createConnection('mongodb://localhost/pvmvisualization');

swig.setDefaults({ cache: false });

// Utils
function replaceAll(find, replace, str) {
	return str.replace(new RegExp(find, 'g'), replace);
}

function datePrint() {
	return new Date(Date.now()).toISOString();
}
 
function replaceAllOn(string, source, target) {
	var result = source;
	var newResult = string.replace(source, target);
	
	while (result != newResult) {
		result = newResult;
		newResult = newResult.replace(source, target);
	} 
	
	return newResult;
}

function renderContentsFromFile(filePath, res, page404, returnCallback){
    fs.exists(filePath,function(exists) {
		if (exists){
            fs.readFile(filePath,function(err,contents){
				if(!err){
					returnCallback(contents);
                } else {
                    console.dir(err);
                };
            });
        } 
		else {
            fs.readFile(page404, function(err,contents){
                if (!err) {
                    res.writeHead(404, {'Content-Type': 'text/html'});
                    res.end(contents);
                } else {
                    console.dir(err);
                };
            });
        };
    });
}

function getFile(filePath, res, page404, useViewsEngine){	
	fs.exists(filePath,function(exists) {
		if (exists){			
			if (useViewsEngine) {
				var result = swig.renderFile(filePath);
				res.end(result);
			}
			else
				fs.readFile(filePath,function(err,contents){
					if(!err){
						res.end(contents);
					} else {
						console.dir(err);
					};
				});
        } 
		else {
            fs.readFile(page404, function(err,contents){
                if (!err) {
                    res.writeHead(404, {'Content-Type': 'text/html'});
                    res.end(contents);
                } else {
                    console.dir(err);
                };
            });
        };
    });
}

function setFile(filePath, data, res) {
	fs.writeFile(filePath, data, function(err){
		if (err)
			throw err;
		else {
			res.end(data);
		};
	});
}

// GPExplorer interface
function genericGPExplorerMessage(res, connectFunction, dataFunction) {
	var socket = net.createConnection("20000", "127.0.0.1");
	
	socket
		.on('data', function(data) {
			socket.destroy();
			
			if (dataFunction != null)
				dataFunction(data);
			else
				res.end(data);
		})
		.on('error', function (e) { console.log(e.toString()); })
		.on('connect', function () { connectFunction(socket); })
		.on('end', function () { })
		.on('close', function(data) { });
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

function getWithCriteria(res, req, arguments) {
	var a = Like.find({ entityClass: arguments.entityClass }, function(err, likes) {
		var value = Math.random() * likes.length;
		var result = likes[Math.floor(value)];
	
		if (result != null)	
			res.end(result.entity + " | " + result.entityClass + " | " + result.id);
		else
			res.end("none");
	}); 
}

function getAdminLikeWithCriteria(res, req, arguments) {
	var a = AdminLike.find({ entityClass: arguments.entityClass }, function(err, likes) {
		var value = Math.random() * likes.length;
		var result = likes[Math.floor(value)];
	
		if (result != null)	
			res.end(result.entity + " | " + result.entityClass + " | " + result.id);
		else
			res.end("none");
	}); 
}

function createDefault(res, language) {
	genericGPExplorerMessage(res, 
	function(socket) {
		socket.write("(make-instance 'tcp-message :name (quote message-web-interface-create-default) :content (list (quote " + language + ")))\n");
	});
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
					p = replaceAllOn(p, ")", "");
					var varspart = p.split(" ");
					// Replace
					result = replaceAllOn(result, varspart[0].toLowerCase(), varspart[2]);
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
					p = replaceAllOn(p, ")", "");
					var varspart = p.split(" ");
					// Replace
					result = replaceAllOn(result, varspart[0].toLowerCase(), varspart[2]);
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
			//console.log("FOR MESSAGE: " + message + " REPLY: " + data);
			socket.destroy();	
			callback(data);
		})
		.on('error', function (e) { console.log(e.toString()); })
		.on('connect', function () { connectFunction(socket); })
		.on('end', function () { })
		.on('close', function(data) { }); 
}

// DB functions
function initializeDatabase() {	
	// Entities
	entitiesSchema = mongoose.Schema({
		user: String,
		id: String,
		entity: String,
		entityTranslated: String,
		entityClass: String
	});
		
	Entity = db.model('entities', entitiesSchema);
	
	// Likes
	likeSchema = mongoose.Schema({
		user: { type: String, trim: true, index: true },
		id: String,
		entity: String,
		entityClass: String
	});
		
	Like = db.model('likes', likeSchema);
	
	// Dislikes
	dislikeSchema = mongoose.Schema({
		user: { type: String, trim: true, index: true },
		id: String,
		entity: String,
		entityClass: String
	});
		
	Dislike = db.model('dislikes', dislikeSchema);
	
	// Admin Likes
	adminLikeSchema = mongoose.Schema({
		user: { type: String, trim: true, index: true },
		id: String,
		entity: String,
		entityClass: String
	});

	AdminLike = db.model('adminlikes', adminLikeSchema);
	
	// Error entries
	errorEntriesSchema = mongoose.Schema({
		user: { type: String, trim: true, index: true },
		id: String,
		description: String,
	});
		
	ErrorEntry = db.model('errorentries', errorEntriesSchema);
}

var printBDError = function (err, result) {
      if (err) throw err;
      console.log(result);
};

// Server controller final actions
function registerShaderEntity(res, object) {
	var id = uuid.v1();
	var value = new Entity({ id: id, object: object.object.toString(), type: "entity-shader" });
	value.save(printBDError);
	res.end(id);
}

function deleteEntity(res, arguments) {
	Entity.remove( { id: arguments.id }, 
		function () {
			res.end(arguments.id);
		});
}

function adminLikeObject(res, args) {
	var id = uuid.v1();
	var value = new AdminLike({ id: id, entity: args.entity, entityClass: args.entityClass });
	value.save(printBDError);
	res.end(id);
}

function likeObject(res, args) {
	var id = uuid.v1();
	var value = new Like({ id: id, entity: args.entity, entityClass: args.entityClass });
	value.save(printBDError);
	res.end(id);
}

function dislikeObject(res, args) {
	var id = uuid.v1();
	var value = new Dislike({ id: id, entity: args.entity, entityClass: args.entityClass });
	value.save(printBDError);
	res.end();
}

function registerError (res, args) {
	var id = uuid.v1();
	var value = new ErrorEntry({ id: id, description: args.description, code: args.code });
	console.log(value);
	//value.save(printBDError);
	res.end();
}

function deparseTest(res, args) {
	console.log(args.code);
	var ast = glsl.parse(args.code);
	var elements = glsl.query.all(ast, glsl.query.selector('root'));
	res.end(glsl.string(ast, defaultGLSLCodeOptions));
}

function view(res, arguments, h, w) {
	var localFolder = __dirname + '/app';
	var result = swig.renderFile(localFolder + "/view.html", { height: (h == null) ? 1024 : h, width: (w == null) ? 1024 : w });
	var entity = arguments.entity;
	result = result.toString().replace("#ENTITY#", replaceAllOn(entity, "\n", ""));
	res.end(result);
}

function getEntityByIndex(res, arguments) {	
	var args = arguments.index;
	var entity = Entity.find({ }, function(err, entities) {
		if (args < entities.length) {
			var result = replaceAllOn(entities[args].object, "\n", "");
			res.end(result);
		}
		else
			res.end("null");
	});
}

function brokeObject (res, arguments) {
	var value = arguments.code, count = arguments.count;
	var ast = glsl.parse(value);
	var elements = glsl.query.all(ast, glsl.query.selector('root'));

	var context = { 
		functions: {},
		descriptors: [], 
		lastType: null, 
		typeTable: {}, 
		currentFunctionName: null, 
		fieldSelector: null,
		aliasesIndex: 0,
		aliases: {},
		nodes: {},
		nodesCount: 0
	};
	
	processTree(elements[0], 0, context);
	//console.log("");
	//console.log(context);
	//console.log("");
	
	processParts(context,
		0,
		function(context) {
			// Reeplace nodes
			filterParts(context, count);
			// #TODO: factorice function replaceExpansionNodes
			//console.log("");
			res.end(replaceExpansionNodes(ast, context));
		})
} 

function processParts(context, index, callback) {
	var counter = 0;
	var targetNode;
	
	for (var t in context.nodes) { counter++; }
	var target = context.nodes[index][0];
	var varsDescription = context.nodes[index][1];
	var dsl = getSubExpWithReplacements(target, context);
	//console.log("DSL: " + dsl)
	
	parseGLSLType(dsl,
		varsDescription,
		function(type) {
			if ((type != null) && (type != "nil") && (type != "NIL")) {
				// Create function descriptor with random name
				var name = "name" + Math.ceil(Math.random() * 1000);
				var exp = glsl.string(target, defaultGLSLCodeOptions);
				var descriptor = { name: name, vars: varsDescription, type: type, exp: exp, dsl: dsl, flag: false };
				//console.log("EXP: " + exp)
				//console.log("")
				// Add node to candidate list
				context.descriptors.push({ target: target, descriptor: descriptor });
				// Modify node, add
				target.type = "float";
				target.value = name;
			}
			
			// Continue	
			if ((index+1) < counter)
				processParts(context, index+1, callback);
			else 
				callback(context);
		});
}

function isBuiltInFunction (name) {
	name = name.toUpperCase();
	if (name == "CROSS") return true;
	if (name == "VEC4") return true;
	if (name == "VEC3") return true;
	if (name == "VEC2") return true;
	if (name == "FACEFORWARD") return true;
	if (name == "SMOOTHSTEP") return true;
	if (name == "MIX") return true;
	if (name == "CLAMP") return true;
	if (name == "REFLECT") return true;
	if (name == "DOT") return true;
	if (name == "DISTANCE") return true;
	if (name == "STEP") return true;
	if (name == "MOD") return true;
	if (name == "MAX") return true;
	if (name == "MIN") return true;
	if (name == "POW") return true;
	if (name == "NORMALIZE") return true;
	if (name == "LENGTH") return true;
	if (name == "SIGN") return true;
	if (name == "FRACT") return true;
	if (name == "FLOOR") return true;
	if (name == "CEIL") return true;
	if (name == "ABS") return true;
	if (name == "INVERSESQRT") return true;
	if (name == "SQRT") return true;
	if (name == "EXP2") return true;
	if (name == "LOG") return true;
	if (name == "EXP") return true;
	if (name == "DEGREES") return true;
	if (name == "RADIANS") return true;
	if (name == "ATAN") return true;
	if (name == "ACOS") return true;
	if (name == "ASIN") return true;
	if (name == "TAN") return true;
	if (name == "COS") return true;
	if (name == "SIN") return true;
	if (name == "FWIDTH") return true;
	if (name == "DFDX") return true;
	return false;
}

function getDescriptorDescriptor(descriptor) {
	return "#{ " + descriptor.name + 
			 "(" + descriptor.vars + ") :: "  
				 + descriptor.type + " :: " + 
				   descriptor.exp + " :: " + 
				   descriptor.dsl + 
		   " }#";
}

function typeFromGLSLType(value) {
	if (value == "float") return ":var1";
	if (value == "vec2") return ":var2";
	if (value == "vec3") return ":var3";
	if (value == "vec4") return ":var4";
	return null;
}

function getVarsFromContext(context, vars) {
	for (var k in context.typeTable) {
		var part1 = (k.split("."))[0];
		var part2 = (k.split("."))[1];
		var part3 = (k.split("."))[2];

		if ((part1 == context.currentFunctionName) || (part1 == "null")) {
			if (part3 == null) 
				vars.push([context.aliases[part2], context.typeTable[k], part2]);
			else
				vars.push([context.aliases[part2], context.typeTable[k], part2 + "." + part3]);
		}
	}
}

function getVarsDescription(vars) {
	var result = "";
	for (var v in vars) {
		result += "(" + vars[v][0] + " " + typeFromGLSLType(vars[v][1]) + " " + vars[v][2] + ") ";
	}
	return "(" + result + ")";	
}

function addNodeVariables(context, node) {
	var vars = getVarsForExpression(context, node);
	var varsDescription = getVarsDescription(vars);
	context.nodes[context.nodesCount.toString()] = [node, varsDescription, context.fieldSelector];
	context.nodesCount++;
}

function addNode(node, context) {
	//console.log(tabResult + node.type + " (" + node.returnType.name + ") " + node.name)

	if (hasFieldSelector(node)) {
		return false;
	}

	if (node.type == "function_call") {		
		return !(hasUserDefinedFunction(node));
	}

	if (node.type == "binary")
		return (!((node.operator.operator == "=") ||
		         (node.operator.operator == "+=") || 
		         (node.operator.operator == "-=") || 
		         (node.operator.operator == "*=") || 
		         (node.operator.operator == "/=")) &&
				  (!hasFieldSelector(node.left)) &&
				  (!hasFieldSelector(node.right)));

	if (node.type == "identifier")
		return (context.aliases[node.name] != null);
	
	if (node.type == "float")
		return true;

	// #NOTE: unknown
	return false;
}

function processTree(node, tabLevel, context) {
	var tabResult = "";
	
	if (node == null) return;
	for (var i=0; i< tabLevel * 3; i++) tabResult += " ";
	
	if ((node.type == "root") || (node.type == "scope")) {
		for (var statement in node.statements) {
			processTree(node.statements[statement], tabLevel, context) 
		}
	} 
	
	if (node.type == "declarator_item") {
		//console.log(tabResult + node.type + " " + node.name.name)
		
		if (node.initializer) {
			if (addNode(node.initializer, context)) 
				addNodeVariables(context, node.initializer);
			else
				processTree(node.initializer, tabLevel, context);
		}

		context.typeTable[context.currentFunctionName + "." + node.name.name] = context.lastType;
		context.aliases[node.name.name] = variableReplacementPrefix + context.aliasesIndex++;
	}
	
	if (node.type == "declarator") {
		context.lastType = node.typeAttribute.name;
		//console.log(tabResult + node.type + " " + node.typeAttribute.name)
		for (var d in node.declarators) {
			processTree(node.declarators[d], tabLevel, context);
		}
	}
	
	if (node.type == "return") {
		//console.log(tabResult + node.type);
		if (addNode(node.value, context)) 
			addNodeVariables(context, node.value);
		else
			processTree(node.value, tabLevel, context);
	}

	if (node.type == "type") {
		//console.log(tabResult +  node.type + " " + node.name)
	}
	
	if (node.type == "parameter") {
		context.functions[context.currentFunctionName].parameters[node.name] = node.type_name;
		context.typeTable[context.currentFunctionName + "." + node.name] = node.type_name;
		context.aliases[node.name] = variableReplacementPrefix + context.aliasesIndex++;
	}

	if (node.type == "function_declaration") {
		context.currentFunctionName = node.name;
		context.functions[node.name] = {};
		context.functions[node.name].returnType = node.returnType.name;
		context.functions[node.name].parameters = {};
		
		//console.log(tabResult + node.type + " (" + node.returnType.name + ") " + node.name)
		for (var parameter in node.parameters) {
			processTree(node.parameters[parameter], tabLevel, context) 
		}
		processTree(node.body, tabLevel, context) 
	}
	
	if (node.type == "function_call") {
		//console.log(tabResult + node.type + " " + node.function_name);
		
		if (addNode(node, context)) 
			addNodeVariables(context, node);
		else {
			for (var parameter in node.parameters)
				processTree(node.parameters[parameter], tabLevel, context);
		}
	}
	
	if (node.type == "expression") {
		//console.log(tabResult + node.type);
		processTree(node.expression, tabLevel, context);
	}

	if (node.type == "binary") {
		//console.log(tabResult + node.type + " " + node.operator.operator)
		
		if (addNode(node, context))
			addNodeVariables(context, node);
		else {
			// Process left part only if current node is not an assignment
			if (!((node.operator.operator == "=") ||
		         (node.operator.operator == "+=") || 
		         (node.operator.operator == "-=") || 
		         (node.operator.operator == "*=") || 
		         (node.operator.operator == "/="))) {
				processTree(node.left, tabLevel, context);
			}

			// Process right part
			processTree(node.right, tabLevel, context)
		}
	}

	if (node.type == "postfix") {
		//console.log(tabResult + node.type);
		processTree(node.operator, tabLevel, context);
		processTree(node.expression, tabLevel, context);
	}

	if (node.type == "field_selector") {
		//console.log(tabResult + node.type + " " + node.selection);
		//context.fieldSelector = node.selection;
		processTree(node.expression, tabLevel, context);
	}

	if (node.type == "identifier") {
		//console.log(tabResult + node.type + " " + node.name);
		if (addNode(node, context))
			addNodeVariables(context, node);
	}

	if (node.type == "float") {
		//console.log(tabResult + node.type + " " + node.value);
		if (addNode(node, context))
			addNodeVariables(context, node);
	}

	if (node.type == "if_statement") {
		//console.log(tabResult + node.type);
		//processTree(node.condition, tabLevel, context) 
		processTree(node.body, tabLevel, context); 
	}

	if (node.type == "while_statement") {
		//console.log(tabResult + node.type);
		//processTree(node.condition, tabLevel, context) 
		processTree(node.body, tabLevel, context);
	}

	if (node.type == "for_statement") {
		//console.log(tabResult + node.type);
		//processTree(node.initializer, tabLevel, context);
		//processTree(node.condition, tabLevel, context); 
		//processTree(node.increment, tabLevel, context); 
		processTree(node.body, tabLevel, context);
	}
}

function getTypeFromPostFix(value) {
	if (value.length == 1) return "float";
	if (value.length == 2) return "vec2";
	if (value.length == 3) return "vec3";
	if (value.length == 4) return "vec4";
	console.log("ERROR type " + value + " found.");
}

function getVarsForExpression (context, element) {
	var vars = [];
	//getVarsFromSubtree(element, vars);
	getVarsFromContext(context, vars);
	return vars;
}

function isVariableReplacement(exp) {
	return exp.substring(0, 3) == variableReplacementPrefix.length;
}

function replaceVarAliases(exp, context) {
	var result = exp;
	
	for (var alias in context.aliases)
		if (isVariableReplacement(alias)) 
			result = replaceAllOn(result, alias, context.aliases[alias]);
		
	return result;
}

function shake(list) {
	for (var i=0; i< list.length; i++) {
		var a = Math.floor(Math.random() * list.length);
		var b = Math.floor(Math.random() * list.length);
		var aux = list[a];
		list[a] = list[b];
		list[b] = aux;
	}
}

function filterParts(object, count) {
	// #TODO: set count subset from nodes using some weight function with flag on true
	var list = [];
	// Make effective replacement on AST
	for (var descriptor in object.descriptors) {
		list.push(descriptor);
	}

	shake(list);
	
	// Set random flags
	for (var i=0; i< Math.min(count, list.length); i++) {
		var d = object.descriptors[list[i]];
		d.descriptor.flag = true;
	}
}

// Answer whether node expression type is mutable using an heuristic
function heuristicValue(node) {
	// #TODO: Check heuristic
	//	- no matn datatypes 
	// 	- no user defined functions 
	//  - exp has math functions inside (good candidate): sin,cos,tan,length,distance,...
	
	// #TEST: check how faster is to make lispworks call
	if (hasUserDefinedFunction(node)) return false;

	return true;
}

function getVarsFromSubtree(node, list) {
	// Check terminal nodes and return
	if ((node.type == "operator") || (node.type == "binary")) {
		getVarsFromSubtree(node.left, list);
		getVarsFromSubtree(node.right, list);
		return;
	}

	// Register var
	if (node.type == "identifier") {
		list.push(node.name);
		return;
	}

	// Continue on AST 
	if ((node.expression) || (node.binary)) 
		getVarsFromSubtree(node.expression, list);	
}

function hasUserDefinedFunction(node) {
	// Check terminal nodes and return
	if ((node.type == "operator") || (node.type == "binary")) {
		if (hasUserDefinedFunction(node.left))
			return true;
		if (hasUserDefinedFunction(node.right))
			return true;
		return false;
	}
	
	if ((node.type == "function_call") && !(isBuiltInFunction(node.function_name))) {
		return true;
	}
	
	// Register not buildt in functions
	if ((node.type == "function_call") && (isBuiltInFunction(node.function_name))) {
		for (var parameter in node.parameters)
			if (hasUserDefinedFunction(node.parameters[parameter]))
				return true;
		return false;
	}

	// Continue on AST 
	if ((node.expression) || (node.binary)) 
		return hasUserDefinedFunction(node.expression);	
}

function hasFieldSelector(node) {
	// Check terminal nodes and return
	if ((node.type == "operator") || (node.type == "binary")) {
		if (hasFieldSelector(node.left))
			return true;
		return (hasFieldSelector(node.right));
	}

	if ((node.type == "field_selector") || (node.type == "postfix")) {
		return true;
	}
	
	// Register not buildt in functions
	if (node.type == "function_call") {
		for (var parameter in node.parameters)
			if (hasFieldSelector(node.parameters[parameter]))
				return true;
		return false;
	}

	// Continue on AST 
	if ((node.expression) || (node.binary)) 
		return hasFieldSelector(node.expression);
}

/*
function getFunctions(node, list) {
	// Check terminal nodes and return
	if ((node.type == "operator") || (node.type == "binary")) {
		getFunctions(node.left);
		getFunctions(node.right);
		return;
	}
	
	// Register not buildt in functions
	if ((node.type == "function_call") && !(isBuiltInFunction(node.function_name))) {
		var result = node.function_name;
		for (var parameter in node.parameters)
			result += " " + getNodeDisplay(node.parameters[parameter]);
		return;
	}
	
	// Continue on AST 
	if ((node.expression) || (node.binary)) 
		getFunctions(node.expression);	
}
*/

function getSubExp(node, context) {
	return getNodeDisplay(node, context);
}

function getNodeDisplay(node, context) {
	// Check terminal nodes and return
	if (node.type == "operator")
		return "(" + node.operator.operator + " " + getNodeDisplay(node.left, context) + " " + getNodeDisplay(node.right, context) + ")";
	if (node.type == "binary") 
		return "(" + node.operator.operator + " " + getNodeDisplay(node.left, context) + " " + getNodeDisplay(node.right, context) + ")";
	if (node.type == "int") 
		return node.value;
	if (node.type == "float") {
		if (node.value.toString().substr(0, 4) == "name")
			return node.value;
		return node.value.toFixed(3);
	}
	if (node.type == "identifier") {
		return node.name;
	}
	if ((node.type == "function_call") && (isBuiltInFunction(node.function_name))) {
		var result = node.function_name;
		for (var parameter in node.parameters)
			result += " " + getNodeDisplay(node.parameters[parameter], context);
		return "(" + result + ")";
	}
	if ((node.type == "function_call") && (!isBuiltInFunction(node.function_name))) {
		var result = node.function_name;
		for (var parameter in node.parameters)
			result += " " + getNodeDisplay(node.parameters[parameter], context);
		return "(" + result + ")";
	}

	// Continue on AST 
	if (node.expression) 
		return getNodeDisplay(node.expression, context);
	if (node.binary) 
		return getNodeDisplay(node.expression, context);
	
	// #NOTE: Should not pass, otherwise not parseable maybe?
	return "#" + node.type + "#";
}

function valueForSelectorIndex(c) {
	if ((c == "x") || (c == "r")) return 1;
	if ((c == "y") || (c == "g")) return 2;
	if ((c == "z") || (c == "b")) return 3;
	if ((c == "a")) return 4;
}

function valueForSelector(str) {
	var result = "";
	for (var i in str) {
		result += valueForSelectorIndex(str[i]);
	}
	return result;
}

function fieldSelectorForOperator (value) {
	return "fieldselection" + valueForSelector(value);
}

function getSubExpWithReplacements(node, context) {
	return getNodeDisplayWithReplacements(node, context);
}

function getNodeDisplayWithReplacements(node, context) {		
	// Check terminal nodes and return
	if (node.type == "operator")
		return "(" + node.operator.operator + " " + getNodeDisplayWithReplacements(node.left, context) + " " + getNodeDisplayWithReplacements(node.right, context) + ")";
	if (node.type == "binary") 
		return "(" + node.operator.operator + " " + getNodeDisplayWithReplacements(node.left, context) + " " + getNodeDisplayWithReplacements(node.right, context) + ")";
	if (node.type == "int") 
		return node.value;
	if (node.type == "float") {
		if (node.value.toString().substr(0, 4) == "name")
			return node.value;
		return node.value.toFixed(3);
	}
	
	if (node.type == "postfix") {
		return "(" + fieldSelectorForOperator(node.operator) + " " + getNodeDisplayWithReplacements(node.expression, context) + ")";
	}
	
	if (node.type == "identifier") {
		var key = node.name;

		// Register variable and alias
		if (context.aliases[key] != null)
			return context.aliases[key];
		else 
			return node.name;
	}

	if (node.type == "function_call") {
		var result = node.function_name;
		for (var parameter in node.parameters)
			result += " " + getNodeDisplayWithReplacements(node.parameters[parameter], context);
		return "(" + result + ")";
	}

//	// #TODO: Use this when accepting user functions
//	if ((node.type == "function_call") && (!isBuiltInFunction(node.function_name))) {
//		var result = node.function_name;
//		for (var parameter in node.parameters)
//			result += " " + getNodeDisplayWithReplacements(node.parameters[parameter], context);
//		return "(" + result + ")";
//	}
	
	// Continue on AST 
	if (node.expression) 
		return getNodeDisplayWithReplacements(node.expression, context);	
	if (node.binary) 
		return getNodeDisplayWithReplacements(node.expression, context);
	
	// #NOTE: Should not pass, otherwise not parseable maybe?
	return "#" + node.type + "#";
}

function replaceExpansionNodes(ast, context) {
	// For each descriptor in object, determine whether to put original or placeholder
	var result = glsl.string(ast, defaultGLSLCodeOptions);
	
	// Make effective replacement on AST
	for (var descriptor in context.descriptors) {
		var d = context.descriptors[descriptor];
		if (d.descriptor.flag == true)
			result = replaceAll(d.descriptor.name, getDescriptorDescriptor(d.descriptor), result);
		else
			result = replaceAllOn(result, d.descriptor.name, d.descriptor.exp);
	}

	//console.log(result)
	return result;
}

// Helper for HTTP requests
function requestHandler(req, res) {	
	var pathname = url.parse(req.url).pathname;
	var arguments = querystring.parse(url.parse(req.url).query);
	
	// #TEMP: incoming inspector
	console.log(datePrint() + " : " + req.connection.remoteAddress + ": " + pathname + "{" + arguments.toString() + "}");
	
	if (pathname == "/mutateWithVars")
		mutateFunctionsWithVars(res, arguments); 
	else if (pathname == "/crossoverWithVars")
		crossoverWithVars(res, arguments);	
	else if (pathname == "/mutate")	
		mutateFunctions(res, arguments.language, arguments.entity, arguments.maxSize);
	else if (pathname == "/crossover")
		crossoverFunctions(res, arguments.language, arguments.objectDataA, arguments.objectDataB, arguments.maxSize);
	else if (pathname == "/view")
		view(res, arguments, arguments.h, arguments.w);		
	else if (pathname == "/infixConvert")
		getInfixConverted(res, arguments.exp);
	else if (pathname == "/glslConvert")
		getGlslConvert(res, arguments.exp);
	else if (pathname == "/addShaderEntity")
		registerShaderEntity(res, arguments);
	else if (pathname == "/deleteEntity")
		deleteEntity(res, arguments);
	else if (pathname == "/getEntityByIndex")
		getEntityByIndex(res, arguments);
	else if (pathname == "/getWithCriteria")
		getWithCriteria(res, req, arguments);
	else if (pathname == "/getAdminLikeWithCriteria")
		getAdminLikeWithCriteria(res, req, arguments);
	else if (pathname == "/like")
		likeObject(res, arguments);
	else if (pathname == "/adminLike")
		adminLikeObject(res, arguments);
	else if (pathname == "/broke")
		brokeObject(res, arguments);
	else if (pathname == "/dislike")
		dislikeObject(res, arguments);
	else if (pathname == "/registerError")
		registerError(res, arguments);	
	else if (pathname == "/deparseTest")
		deparseTest(res, arguments);
	else {
		console.log("URL : " + req.url);
		var fileName = path.basename(req.url) || 'index.html',
			localFolder = __dirname + '/app',
			page404 = localFolder + '/404.html';
		var parts = fileName.split(".");
		fileName = replaceAllOn(req.url, "/", "\\");
		if (req.url == "/" || req.url == "") fileName = '/index.html';
		console.log("File name: " + fileName);
		getFile((localFolder + fileName), res, page404, (parts[parts.length-1] == "html"));
	}
}

function handlerHook(req, res) {
	var result;
	
	req.setTimeout(requestTimeOut, function () { 
		console.debug("timeout"); 
		res.end("timeout"); 
	});
	
	try {
		result = requestHandler(req, res);
	}
	catch (err) {
		// #TODO: Answer an error object
		console.log("Error: " + err.message);
		res.end("Error");
	}
	
	return result;
}

initializeDatabase();
  
try {
	http.createServer(handlerHook)
		.listen(listeningPort);
} 
catch (ex) {
	console.log(ex.toString());
	callback(ex);
}
