precision mediump float;
const int RAY_MARCHING_ITERATIONS = 50;
const float RAY_MARCHING_TMAX = 50.0;
const float MATERIAL_SKY = -1.0;
const float MATERIAL_FLOOR = 1.49;
const float MATERIAL_BALL = 47.0;
const vec3 COLOR_SKY = vec3(0.8, 0.7, 0.5);
const vec3 COLOR_BALL = vec3(0.2, 0.5, 0.9);
const vec3 COLOR_FLOOR = vec3(0.2, 0.2, 0.2);
uniform float iGlobalTime;
uniform float time;
const vec2 iResolution = vec2(1.0, 1.0); 
varying float xx;
varying float yy;

float divideprotected(in float a, in float b) { if (b != 0.0) return a / b; else return 0.0; }
float sqr(in float a) { return pow(a, 2.0); }
	
vec2 hash(vec2 p) {
	p = vec2(dot(p, vec2(107.1,301.7)), dot(p, vec2(151.5,353.3)));
	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise(in vec2 p) {
    vec2 i = floor( p );
    vec2 f = fract( p );
    vec2 u = f*f*(3.0-2.0*f);
    return mix( mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)), 
                    dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), 
                    dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}

float distortion(vec3 pos) {
    float x = pos.x;
    float y = pos.y;
    float z = pos.z;
    float a = 100.0;
    float b = 25.0;
    return #{distortion(x y z) : lisp-math-function-xyz : : (/ (* (* (sin (* x 100.0)) (sin (* y 100.0))) (sin (* z 100.0))) 25.0) }#;
}

float objectFloor(vec3 pos, float level) {
	return pos.y - level - noise(pos.xz) / 1.5;
} 

float objectSphere(vec3 pos, float radius) {
	return length(pos + distortion(pos)) - radius;
} 

vec2 minValue(vec2 d1, vec2 d2) {
	return (d1.x < d2.x) ? d1 : d2;
}

vec3 rotationFunction1(vec3 pos) {
	return vec3(pos.x + cos(iGlobalTime + pos.z), 
                pos.y + 0.5 * sin(iGlobalTime + pos.z), 
                mod(pos.z + iGlobalTime * 4.0, 0.75)) - vec3(-1.25, 0.1, 0.2);
}

vec3 rotationFunction2(vec3 pos) {
	return vec3(pos.x + 0.1 * cos(iGlobalTime + pos.z), 
                pos.y + 0.5 * sin(iGlobalTime + pos.z), 
                mod(pos.z + iGlobalTime * 4.0, 0.75)) - vec3(-1.25, 0.1, 0.2);
}

vec3 rotationFunction(vec3 pos) {
	return mix(
        rotationFunction1(pos), 
        rotationFunction2(pos), 
        0.5 + sin(iGlobalTime) / 2.0);
}

vec2 hit(in vec3 pos) {
	vec3 sphereRotPoint = rotationFunction(pos);
    vec2 sphereRot = vec2(objectSphere(sphereRotPoint, 0.15), MATERIAL_BALL),
         sphereRotRot =
        	vec2(objectSphere(
        		sphereRotPoint + 
        		vec3(0.25 * cos(iGlobalTime * 2.0),
                     0.25 * sin(iGlobalTime * 2.0),
                     0.0),
                  0.06),
                 	MATERIAL_BALL),
        sphereRotRot2 = vec2(objectSphere(
        		sphereRotPoint + 
        		vec3(0.25 * cos(iGlobalTime * 2.0 + 6.28 * 0.33),
                     0.25 * sin(iGlobalTime * 2.0 + 6.28 * 0.33),
                     0.0),
                  0.06),
                 	MATERIAL_BALL),
        sphereRotRot3 = vec2(objectSphere(
        		sphereRotPoint + 
        		vec3(0.25 * cos(iGlobalTime * 2.0 + 6.28 * 0.66),
                     0.25 * sin(iGlobalTime * 2.0 + 6.28 * 0.66),
                     0.0),
                  0.06),
                 	MATERIAL_BALL),
        floorPlane = vec2(objectFloor(pos - vec3(0.25, -1.0, 0.0), 0.0), MATERIAL_FLOOR);
    
    vec2 res = minValue(minValue(minValue(sphereRotRot, minValue(sphereRotRot2, sphereRotRot3)), floorPlane), 
                   minValue(sphereRot, sphereRot));
    return res;
}

vec3 calcNormal(in vec3 pos) {
	vec3 eps = vec3(0.001, 0.0, 0.0);
	vec3 nor = vec3(
		hit(pos + eps.xyy).x - hit(pos - eps.xyy).x,
		hit(pos + eps.yxy).x - hit(pos - eps.yxy).x,
		hit(pos + eps.yyx).x - hit(pos - eps.yyx).x);
	return normalize(nor);
}

mat3 setCamera(in vec3 ro, in vec3 ta, float cr) {
	vec3 cw = normalize(ta-ro);
	vec3 cp = vec3(sin(cr), cos(cr), 0.0);
	vec3 cu = normalize(cross(cw, cp));
	vec3 cv = normalize(cross(cu, cw));
	return mat3(cu, cv, cw);
}

bool isMaterial (float material, float value) {
	return abs(material - value) < 0.01;
}

vec3 colorForMaterial(float material, vec3 p, vec2 screenPos) {
	if (isMaterial(material, MATERIAL_FLOOR))
        return 0.4 + COLOR_FLOOR * mod(floor(p.x * 4.0) + floor(p.z * 4.0), 2.0);
	else if (isMaterial(material, MATERIAL_BALL))
		return COLOR_BALL;
	else if (isMaterial(material, MATERIAL_SKY))
		return vec3(noise(vec2(p.x, p.y)));
	else
		return vec3(0.0, 1.0, 0.0);
}

vec2 castRayToWorld(in vec3 ro, in vec3 rd) {
	float tmin=1.0, tmax=RAY_MARCHING_TMAX, precis=0.01, t=tmin, m=-1.0;

	for (int i=0; i< RAY_MARCHING_ITERATIONS; i++) {
		vec2 p = hit(ro + rd * t);
		if ((precis > p.x) || (t > tmax)) break;
		t += p.x;
		m = p.y;
	}

	if (t > tmax) m = MATERIAL_SKY;
	return vec2(t, m);
}

vec3 render(in vec3 ro, in vec3 rd) {
	vec2 value = castRayToWorld(ro, rd);
	float distance = value.x;
	float material = value.y;
	vec3 pos = ro + distance * rd;
    vec3 color = colorForMaterial(material, pos, vec2(pos.x, exp(pos.y)));
	
	if (!isMaterial(material, MATERIAL_SKY)) {
		vec3 normal = calcNormal(pos);
		vec3 light = normalize(vec3(-0.6, 0.7, -0.5));	
		float dif = clamp(dot(normal, light), 0.0, 1.0);
		float amb = clamp(0.5+0.5*normal.y, 0.0, 1.0);
		vec3 value = vec3(dif);
		value += 1.2 * amb * vec3(0.50, 0.20, 1.0);
		color *= value;
	}
	
	return color;
} 

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
	vec2 q = fragCoord.xy / iResolution.xy;
	vec2 p = q * 2.0 - 1.0;
	p.x *= iResolution.x / iResolution.y;
    vec3 ro = vec3(-1.25, 0.25, 100.0 + iGlobalTime);
	vec3 ta = vec3(-3.5 , -1.1, 0.5);
	mat3 ca = setCamera(ro, ta, 0.0);
	vec3 rd = ca * normalize(vec3(p.xy, 2.5));
	fragColor = vec4(render(ro, rd), 1.0);
}

void main(void) {
	mainImage(gl_FragColor, vec2(xx, yy));
}
