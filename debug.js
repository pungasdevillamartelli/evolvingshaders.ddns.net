var utils = require('./utils');

module.exports = {
	debugVar: function debugVar (vars) {
		console.log("VARS: " + vars);
	},
	debugProcessTreePass: function (node) {
	/*	var tabResult = "";
		for (var i=0; i< tabLevel * 3; i++) tabResult += " ";
		
		if (node.type == "function_declaration")
			console.log(tabResult + node.type + " (" + node.returnType.name + ") " + node.name)
		
		if (node.type == "declarator_item")
			console.log(tabResult + node.type + " " + node.name.name)
		
		if (node.type == "declarator")
			console.log(tabResult + node.type + " " + node.typeAttribute.name)
		
		if (node.type == "return")
			console.log(tabResult + node.type);
		
		if (node.type == "type")
			console.log(tabResult +  node.type + " " + node.name)		
			
		if (node.type == "function_call") 
			console.log(tabResult + node.type + " " + node.function_name);
		
		if (node.type == "expression")
			console.log(tabResult + node.type);	

		if (node.type == "binary")
			console.log(tabResult + node.type + " " + node.operator.operator)
		
		if (node.type == "identifier")
			console.log(tabResult + node.type + " " + node.name);		
			
		if (node.type == "float")
			console.log(tabResult + node.type + " " + node.value);
		
		if (node.type == "if_statement")
			console.log(tabResult + node.type);
			
		if (node.type == "for_statement")
			console.log(tabResult + node.type);			
	*/
	},
	debugReplyMessage: function (message, data) {
		console.log("FOR MESSAGE: " + message + " REPLY: " + data);
	},
	debugParseResult: function (exp, dsl, varsDescription) {
		console.log("EXP: " + exp + "\nDSL: " + dsl + "\nVARS: " + varsDescription + "\n");
	},
	debugContext: function (node) {
		//console.log("");
		//console.log(context);
		//console.log("");
	},
	debugStatus: function (context, start) {
		var end = new Date() - start;
		console.info("\n\nBroking time: %dms", end);
		console.info("Broking nodes: %d", context.nodesCount);
		console.info("Broking functions: %d\n\n", context.functions.length);
	},
	debugErrorFieldSelector: function() {
		//console.log(tabResult + node.type);
		//console.log("ERROR REACHED FIELD_SELECTOR");
		//console.log(tabResult + node.type + " " + node.selection);
		//context.fieldSelector = node.selection;
	},
	debugCandidate: function (target, descriptor) {
		
	},
	debugIncomingRequest: function(req, pathname, arguments) {
		console.log(utils.datePrint() + " : " + req.connection.remoteAddress + ": " + pathname + "{" + arguments.toString() + "}");
	}
};

