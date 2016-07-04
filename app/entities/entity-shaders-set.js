var DefaultShaderSetTemplate = 
	"";	

function InterpolatedShaderSet (interpolation, shaders) {
	this.interpolation = interpolation;
	this.shaders = shaders;
	this.shaderProgram = null;
	this.vertexShaderSource = null;
	this.fragmentShaderSource = null;
	this.fragmentShaderTemplate = DefaultShaderSetTemplate;
	this.initSet();
}