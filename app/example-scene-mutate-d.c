precision highp float;
varying float xx, yy;
uniform float time;

void main(void) {
	vec2 vector = vec3(1.0, 2.0, 3.0).xx;
	float a = vector.x;
	a = (vector.xy * vector.yx).x;
}
