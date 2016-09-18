
var likeSchema, Like, dislikeSchema, Dislike, entitiesSchema, Entity, errorEntriesSchema, ErrorEntry, adminLikeSchema, AdminLike;
var mongoose = require('mongoose');
var db = mongoose.createConnection('mongodb://localhost/pvmvisualization');

module.exports = {
	initializeDatabase: initializeDatabase,
	getEntityByIndex: getEntityByIndex,
	getWithCriteria: getWithCriteria,
	getAdminLikeWithCriteria: getAdminLikeWithCriteria,
	deleteEntity: deleteEntity,
	adminLikeObject: adminLikeObject,
	adminDislikeObject: getEntityByIndex,
	likeObject: likeObject,
	dislikeObject: dislikeObject,
	registerShaderEntity: registerShaderEntity,
	registerError: registerError
}

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
	var a = AdminLike.find( null /* { entityClass: arguments.entityClass } */, function(err, adminlikes) {
		var value = Math.random() * adminlikes.length;
		var result = adminlikes[Math.floor(value)];
		if (result != null)	
			res.end(result.entity + " | " + result.entityClass + " | " + result.id);
		else
			res.end("none");
	}); 
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

function adminDislikeObject(res, req, arguments) {
	console.log("ID: " + arguments.id)
	var a = AdminLike.findOne( { id: arguments.id }, function(err, objects) {
		if (objects != null)
			objects.remove(function (err) {if (err) throw err; });
		console.log("Deleted " + arguments.id);
	}); 
	res.end("ok");
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
	res.end(id);
}

function registerShaderEntity(res, object) {
	var id = uuid.v1();
	var value = new Entity({ id: id, object: object.object.toString(), type: "entity-shader" });
	value.save(printBDError);
	res.end(id);
}

function registerError (res, args) {
	var id = uuid.v1();
	var value = new ErrorEntry({ id: id, description: args.description, code: args.code });
	console.log(value);
	//value.save(printBDError);
	res.end();
}

var printBDError = function (err, result) {
      if (err) throw err;
      console.log(result);
};
