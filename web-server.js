// Modules required
var http = require('http'),
	path = require('path'),
	url = require('url'),
	querystring = require('querystring')
	uuid = require('node-uuid'),
	swig  = require('swig'),
	stream = require('stream'),
	glsl = require('glsl-man'),
	debug = require('./debug'),
	db = require('./db'),
	explorer = require('./explorer'),
	utils = require('./utils'),
	glslprocessing = require('./glsl-shaderclick');

// Configuration
var requestTimeOut = 45000;
var listeningPort = 80;

http.globalAgent.maxSockets = 20;
swig.setDefaults({ cache: false });


function view(res, arguments, h, w) {
	var localFolder = __dirname + '/app';
	var result = swig.renderFile(localFolder + "/view.html", { height: (h == null) ? 1024 : h, width: (w == null) ? 1024 : w });
	var entity = arguments.entity;
	result = result.toString().replace("#ENTITY#", utils.replaceAllOn(entity, "\n", ""));
	res.end(result);
}

// html canvas render version of /view
function viewHtml(res, arguments, h, w) {
	var localFolder = __dirname + '/app';
	var result = swig.renderFile(localFolder + "/viewhtml.html", { height: (h == null) ? 1024 : h, width: (w == null) ? 1024 : w });
	var entity = arguments.entity;
	result = result.toString().replace("#ENTITY#", utils.replaceAllOn(entity, "\n", ""));
	res.end(result);
}

function getEditor(name, res, arguments, h, w) {
	var localFolder = __dirname + '/app';
	var result = swig.renderFile(localFolder + name, { height: (h == null) ? 1024 : h, width: (w == null) ? 1024 : w });
	var entity = arguments.entity;
	if (arguments.entity == null) entity = "null";
	result = result.toString().replace("#ENTITY#", utils.replaceAllOn(entity, "\n", ""));
	res.end(result);
}

// Helper for HTTP requests
function requestHandler(req, res) {	
	var pathname = url.parse(req.url).pathname;
	var arguments = querystring.parse(url.parse(req.url).query);

	debug.debugIncomingRequest(res, pathname, arguments);
	console.log("HOST: " + req.headers.host);

	if (pathname == "/view")
		view(res, arguments);
	else if (pathname == "/viewhtml")
		viewHtml(res, arguments);
	else if (pathname == "/viewShaderVariation")
		viewShaderVariation(res, arguments);
	// Processing
	else if (pathname == "/mutateWithVars")
		explorer.mutateFunctionsWithVars(res, arguments); 
	else if (pathname == "/crossoverWithVars")
		explorer.crossoverWithVars(res, arguments);
	else if (pathname == "/evolveStep")
		explorer.evolveStep(res, arguments);
	else if (pathname == "/mutate")	
		explorer.mutateFunctions(res, arguments.language, arguments.entity, arguments.maxSize);
	else if (pathname == "/crossover")
		explorer.crossoverFunctions(res, arguments.language, arguments.objectDataA, arguments.objectDataB, arguments.maxSize);
	else if (pathname == "/infixConvert")
		explorer.getInfixConverted(res, arguments.exp);
	else if (pathname == "/glslConvert")
		explorer.getGlslConvert(res, arguments.exp);
	else if (pathname == "/broke")
		glslprocessing.factorizeObject(res, arguments);
	else if (pathname == "/deparseTest")
		glslprocessing.deparseTest(res, arguments);	
	// Database operations
	else if (pathname == "/deleteEntity")
		db.deleteEntity(res, arguments);
	else if (pathname == "/getEntityByIndex")
		db.getEntityByIndex(res, arguments);
	else if (pathname == "/getWithCriteria")
		db.getWithCriteria(res, req, arguments);
	else if (pathname == "/getAdminLike")
		db.getAdminLikeWithCriteria(res, req, arguments);
	else if (pathname == "/like")
		db.likeObject(res, arguments);
	else if (pathname == "/dislike")
		db.dislikeObject(res, arguments);
	else if (pathname == "/registerError")
		db.registerError(res, arguments);
	else if (pathname == "/adminLike")
		db.adminLikeObject(res, arguments);
	else if (pathname == "/adminDislike")
		db.adminDislikeObject(res, req, arguments);
	else if (pathname == "/addShaderEntity")
		db.registerShaderEntity(res, arguments);	
	else if ((pathname == "/editor-a.html") || (pathname == "/editor-b.html") || 
			 (pathname == "/editor-c.html") || (pathname == "/editor-code.html"))
		getEditor(pathname, res, arguments);
	else {
		console.log("URL : " + req.url);
		var fileName = path.basename(req.url) || 'index.html',
			localFolder = __dirname + '/app',
			page404 = localFolder + '/404.html';
		var parts = fileName.split(".");
		fileName = utils.replaceAllOn(req.url, "/", "\\");
		if (req.url == "/" || req.url == "") fileName = '/index.html';
		console.log("File name: " + fileName);
		utils.getFile((localFolder + fileName), res, page404, (parts[parts.length-1] == "html"));
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

db.initializeDatabase();
explorer.initializeGPExplorerImages();

try {
	http.createServer(handlerHook)
		.listen(listeningPort);
} 
catch (ex) {
	console.log(ex.toString());
	callback(ex);
}
