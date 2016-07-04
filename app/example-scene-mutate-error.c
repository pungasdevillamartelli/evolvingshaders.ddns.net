precision mediump float;
varying float xx, yy;

void mainImage(out vec4 fragColor, in vec2 fragCoord){
	float x;
	x = 0.0;
	if (xx > 0.9) x = 1.0;
	if (yy > 0.9) x = 1.0;
	if (xx < 0.1) x = 1.0; 
	if (yy < 0.1) x = 1.0;
	fragColor = vec4(x, 0.0, 0.0, 1.0);
}

void main(void) {
	mainImage(gl_FragColor, vec2(xx, yy));
}
