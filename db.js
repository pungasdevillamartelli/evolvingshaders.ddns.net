
var likeSchema, Like, dislikeSchema, Dislike, entitiesSchema, Entity, errorEntriesSchema, ErrorEntry, adminLikeSchema, AdminLike;
var mongoose = require('mongoose');
var db = mongoose.createConnection('mongodb://localhost/pvmvisualization');

module.exports = {
	initializeDatabase: initializeDatabase,
	getEntityByIndex: getEntityByIndex,
	getWithCriteria: getWithCriteria,
	getAdminLikeWithCriteria: getAdminLikeWithCriteria,
	adminLikeObject: adminLikeObject,
	adminDislikeObject: adminDislikeObject,
	likeObject: likeObject,
	dislikeObject: dislikeObject,
	registerError: registerError,
	getEntity: getEntity,
	getDbEntity: getDbEntity,
	createEntity: createEntity,
	deleteEntity: deleteEntity,
	saveEntity: saveEntity
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

function getEntityByIndex(res, args) {	
	var args = args.index;
	var entity = Entity.find({ }, function(err, entities) {
		if (args < entities.length) {
			var result = replaceAllOn(entities[args].object, "\n", "");
			res.end(result);
		}
		else
			res.end("null");
	});
}

function getWithCriteria(res, req, args) {
	var a = Like.find({ entityClass: args.entityClass }, function(err, likes) {
		var value = Math.random() * likes.length;
		var result = likes[Math.floor(value)];
	
		if (result != null)	
			res.end(result.entity + " | " + result.entityClass + " | " + result.id);
		else
			res.end("none");
	}); 
}

function getAdminLikeWithCriteria(res, req, args) {
	var a = AdminLike.find( null /* { entityClass: args.entityClass } */, function(err, adminlikes) {
		var value = Math.random() * adminlikes.length;
		var result = adminlikes[Math.floor(value)];
		if (result != null)	
			res.end(result.entity + " | " + result.entityClass + " | " + result.id);
		else
			res.end("none");
	}); 
}

function adminLikeObject(res, args) {
	var id = uuid.v1();
	var value = new AdminLike({ id: id, entity: args.entity, entityClass: args.entityClass });
	value.save(printBDError);
	res.end(id);
}

function adminDislikeObject(res, req, args) {
	console.log("ID: " + args.id)
	var a = AdminLike.findOne( { id: args.id }, function(err, objects) {
		if (objects != null)
			objects.remove(function (err) {if (err) throw err; });
		console.log("Deleted " + args.id);
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

function registerError (res, args) {
	var id = uuid.v1();
	var value = new ErrorEntry({ id: id, description: args.description, code: args.code });
	console.log(value);
	//value.save(printBDError);
	res.end();
}

function printBDError (err, result) {
      if (err) throw err;
      console.log(result);
}

// User object functions
function createEntity (res, args) {
	var id = uuid.v1();
	var value = new Entity({ id: id, user: null, entity: args.entity, entityClass: args.entityClass });
	value.save(printBDError);
	res.end(id);
}

function saveEntity (res, args) {
	Entity.update(
		{ id: args.id }, 
		{ user: null, entity: args.entity, entityClass: args.entityClass },
		{ }, 
		function (error, count, status) { 
			if (error == null)
				res.end("ok");
			else
				res.end("error");
		}
	);
}

function getDbEntity (id, done) {
	var a = Entity.find( { id: id } , done);
}

function getEntity (res, req, args) {
	var a = Entity.find(  { id: args.id } , function(err, entities) {
		var result = entities[0];
		if (result != null)
			res.end(result.entity + " | " + result.entityClass + " | " + result.id);
		else
			res.end("none");
	}); 
}

function deleteEntity (res, args) {
	Entity.remove( { id: args.id }, 
		function () { res.end(args.id);	}
	);
}