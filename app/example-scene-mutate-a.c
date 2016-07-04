precision highp float;
varying float xx, yy;
uniform float time;

void mainImage(out vec4 fragColor, in vec2 fragCoord){
	float x = (xx+length(asin(mod(vec3(fragCoord,abs(1.0468)),dot(fragCoord,fragCoord)))));
	fragColor = vec4(normalize(yy),acos(time+10.0),asin((yy+normalize(floor(x)))),x);
}

void main(void) {
	mainImage(gl_FragColor, vec2(xx, yy));
}
