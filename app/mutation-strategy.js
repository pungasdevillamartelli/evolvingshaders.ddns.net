
function MutationTarget(target, evaluator) {
	this.target = target;
	this.evaluator = evaluator;
}

function VariationStrategy (target, evaluator) {
	this.evaluator = evaluator;
	this.target = target;
	this.entity = entity;
	this.method() = method;
}

function Mutate () {
	this.prototype = VariationStrategy;
	
	this.method = function (entity) {
		var result;
			
		$.ajax({
			type : 'GET',
			url : "/mutate",
			data : { target: this.target, a: entity },
			dataType : "text",
			success : function(data) {
				result = data.split("|");
			},
			error : function(data) {
				console.log('Call failed');
			}
		});
		
		return result;	
	}
}

function Crossover () {
	this.prototype = VariationStrategy;
	
	this.method = function (a, b) {
		var result;
			
		$.ajax({
			type : 'GET',
			url : "/crossover",
			data : { target: this.target, a: a, b: b },
			dataType : "text",
			success : function(data) {
				result = data.split("|");
			},
			error : function(data) {
				console.log('Call failed');
			}
		});
		
		return result;
	}
}

function Search () {
	this.prototype = VariationStrategy;
	
	this.method = function (entity) {
		var result;
			
		$.ajax({
			type : 'GET',
			url : "/search",
			data : { target: this.target, 
					 a: a, 
					 b: b, 
					 algorithm: "simple-smooth-animation-evaluator" 
					},
			dataType : "text",
			success : function(data) {
				result = data.split("|");
			},
			error : function(data) {
				console.log('Call failed');
			}
		});
		
		return result;
	}
}

