
module.exports = {
	replaceAll: replaceAll,
	datePrint: datePrint,
	replaceAllOn: replaceAllOn,
	getFile: getFile	
}

var fs = require('fs');

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
