var explorer = require('./explorer');

module.exports = {
	brokeObject: brokeObject,
	deparseTest: deparseTest
}

var defaultGLSLCodeOptions = {
	tab: '\t',
	space: ' ',
	newline: '\n', 
	terminator: ';', 
	comma: ','
};

var variableReplacementPrefix = "vvv";


function brokeObject (res, arguments) {
	var start = new Date();
	var value = arguments.code, count = arguments.count;
	var ast = glsl.parse(value);
	var elements = glsl.query.all(ast, glsl.query.selector('root'));
	var filterFunctions = arguments.filterFunctions;
	
	if (filterFunctions == "")
		filterFunctions = null;
	else
		filterFunctions = filterFunctions.split(" ");
	
	var context = { 
		selectedFunctions: filterFunctions,
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
	debug.debugContext(context);
	
	processParts(context,
		0,
		function(context) {
			// Reeplace nodes
			filterParts(context, count);
			// #TODO: factorice function replaceExpansionNodes
			res.end(replaceExpansionNodes(ast, context));
			debug.debugStatus(context, start);
		})
} 

function deparseTest(res, args) {
	var ast = glsl.parse(args.code);
	var exp = glsl.string(ast, defaultGLSLCodeOptions);
	res.end(utils.replaceAllOn(exp, "elseif", "else if"));
}

function processParts(context, index, callback) {
	var counter = 0;
	var targetNode;
	
	for (var t in context.nodes) counter++;
	var target = context.nodes[index][0];
	var varsDescription = context.nodes[index][1];
	context.currentFunctionName = context.nodes[index][2];
	var dsl = getSubExpWithReplacements(target, context);
	
	explorer.parseGLSLType(dsl,
		varsDescription,
		function(type) {
			if ((type != null) && (type != "nil") && (type != "NIL")) {
				// Create function descriptor with random name
				var name = "name" + Math.ceil(Math.random() * 1000);
				var exp = glsl.string(target, defaultGLSLCodeOptions);
				exp = utils.replaceAllOn(exp, "elseif", "else if");
				var descriptor = { name: name, vars: varsDescription, type: type, exp: exp, dsl: dsl, flag: false };
				debug.debugParseResult(exp, dsl, varsDescription);
				// Add node to candidate list
				context.descriptors.push({ target: target, descriptor: descriptor });
				debug.debugCandidate(target, descriptor);
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

function processTree(node, tabLevel, context) {
	if (node == null) return;
	
	if ((node.type == "root") || (node.type == "scope")) {
		for (var statement in node.statements)
			processTree(node.statements[statement], tabLevel, context) 
	} 
	
	if (node.type == "function_declaration") {
		context.currentFunctionName = node.name;
		context.functions[node.name] = {};
		context.functions[node.name].returnType = node.returnType.name;
		context.functions[node.name].parameters = {};
		
		for (var parameter in node.parameters) 
			processTree(node.parameters[parameter], tabLevel, context) 
		
		// Evitamos escanear el cuerpo de la funcion si no hay seleccion
		if (!checkSelectedFunctionConstraint(context, node.name))
			return;

		processTree(node.body, tabLevel, context) 
	}
	
	if (node.type == "declarator_item") {
		if (node.initializer) {
			if (addNode(node.initializer, context)) 
				addNodeVariables(context, node.initializer);
			else
				processTree(node.initializer, tabLevel, context);
		}

		context.typeTable[context.currentFunctionName + "." + node.name.name] = context.lastType;
		context.aliases[context.currentFunctionName + "." + node.name.name] = variableReplacementPrefix + context.aliasesIndex++;
	}
	
	if (node.type == "declarator") {
		context.lastType = node.typeAttribute.name;
		for (var d in node.declarators) {
			processTree(node.declarators[d], tabLevel, context);
		}
	}
	
	if (node.type == "return") {
		if (addNode(node.value, context)) 
			addNodeVariables(context, node.value);
		else
			processTree(node.value, tabLevel, context);
	}

	if (node.type == "type") {
	
	}
	
	if (node.type == "parameter") {
		context.functions[context.currentFunctionName].parameters[node.name] = node.type_name;
		context.typeTable[context.currentFunctionName + "." + node.name] = node.type_name;
		context.aliases[context.currentFunctionName + "." + node.name] = variableReplacementPrefix + context.aliasesIndex++;
	}
	
	if (node.type == "function_call") {
		if (addNode(node, context)) 
			addNodeVariables(context, node);
		else {
			for (var parameter in node.parameters)
				processTree(node.parameters[parameter], tabLevel, context);
		}
	}
	
	if (node.type == "expression") {
		processTree(node.expression, tabLevel, context);
	}

	if (node.type == "binary") {
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
		if (addNode(node.expression, context)) {
			addNodeVariables(context, node);
		}
		else {
			processTree(node.operator, tabLevel, context);
			processTree(node.expression, tabLevel, context);
		}
	}

	if (node.type == "field_selector") {
		debug.debugErrorFieldSelector();	
		
	/*	if (addNode(node.expression, context))
			processTree(node.expression, tabLevel, context);
		else {
			processTree(node.operator, tabLevel, context);
			processTree(node.expression, tabLevel, context);
		} */
	}

	if (node.type == "identifier") {
		if (addNode(node, context))
			addNodeVariables(context, node);
	}

	if (node.type == "float") {
		if (addNode(node, context))
			addNodeVariables(context, node);
	}

	if (node.type == "if_statement") {
		//processTree(node.condition, tabLevel, context) 
		processTree(node.body, tabLevel, context); 
	}

	if (node.type == "while_statement") {
		//processTree(node.condition, tabLevel, context) 
		processTree(node.body, tabLevel, context);
	}

	if (node.type == "for_statement") {
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
			result = utils.replaceAllOn(result, alias, context.aliases[alias]);

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
	if (hasUserDefinedFunction(node)) 
		return false;

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
	
	if (node.type == "postfix") {
		return hasUserDefinedFunction(node.expression);
	}
	
	// Continue on AST 
	if ((node.expression) || (node.binary)) 
		return hasUserDefinedFunction(node.expression);	
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
	
	// Function call
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

	// postfix ?? 
	
	// Continue on AST 
	if (node.expression) 
		return getNodeDisplay(node.expression, context);
	if (node.binary) 
		return getNodeDisplay(node.expression, context);
	
	// #NOTE: Should not pass, otherwise not parseable maybe?
	return "#" + node.type + "#";
}

function valueForSelectorIndex(c) {
	if ((c == "x") || (c == "r") || (c == "s")) return 0;
	if ((c == "y") || (c == "g") || (c == "t")) return 1;
	if ((c == "z") || (c == "b")) return 2;
	if ((c == "a")) return 3;
}

function valueForSelector(str) {
	var result = "";
	for (var i in str.selection)
		result += valueForSelectorIndex(str.selection[i]);
	return result;
}

function fieldSelectorForOperator (value) {
	return "fs-" + valueForSelector(value);
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
		if (context.aliases[context.currentFunctionName + "." + key] != null)
			return context.aliases[context.currentFunctionName + "." + key];
		else {
			if (context.aliases["null." + key] != null)
				return context.aliases["null." + key];
			console.log("ERROR: ALIAS NOT FOUND FOR " + context.currentFunctionName + "." + key);			
			return node.name;
		}
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
	result = utils.replaceAllOn(result, "elseif", "else if");
	
	// Make effective replacement on AST
	for (var descriptor in context.descriptors) {
		var d = context.descriptors[descriptor];
		if (d.descriptor.flag == true)
			result = utils.replaceAll(d.descriptor.name, getDescriptorDescriptor(d.descriptor), result);
		else
			result = utils.replaceAllOn(result, d.descriptor.name, d.descriptor.exp);
	}

	return result;
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
		
		if ((part1 == context.currentFunctionName) || (part1 == "null"))
			vars.push([context.aliases[k], context.typeTable[k], part2]);
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
	context.nodes[context.nodesCount.toString()] = [node, varsDescription, context.currentFunctionName];
	context.nodesCount++;
}

function addNode(node, context) {
	//debug.debugAddNode(node);
	
	// Unknown node
	var returnValue = false;
	
	// Check function filter
	if (!checkSelectedFunctionConstraint(context, context.currentFunctionName)) 
		returnValue = false;
	
	if (node.type == "function_call") {	
		returnValue = !(hasUserDefinedFunction(node));
	}

	if (node.type == "binary")
		returnValue = (!((node.operator.operator == "=") ||
						(node.operator.operator == "+=") || 
						(node.operator.operator == "-=") || 
						(node.operator.operator == "*=") || 
						(node.operator.operator == "/="))) ;

	if (node.type == "identifier") {
		returnValue = (context.aliases[context.currentFunctionName + "." + node.name] != null);
		
		if (returnValue == false) {
			returnValue = (context.aliases["null." + node.name] != null);
		
			if (returnValue == false) {
				console.log("ERROR: IDENTIFIER NOT ALIASED: " + context.currentFunctionName + "." + node.name);
			}	
		}
	}
	
	if (node.type == "float")
		returnValue = true;

	if (node.type == "postfix")
		returnValue = addNode(node.expression);

	return returnValue;
}

function checkSelectedFunctionConstraint(context, name) {
	var includedFunction = false;
	for (var i in context.selectedFunctions)
		if (context.selectedFunctions[i] == name)
			includedFunction = true;
	
	var selections = context.selectedFunctions;
	if ((selections != null) && (selections.length > 0) && !includedFunction)
		return false;
	
	return true;
}