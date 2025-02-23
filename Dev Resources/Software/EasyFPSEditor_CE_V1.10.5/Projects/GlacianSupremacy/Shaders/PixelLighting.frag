#version 120

#define MULTIPLYER 0.8
#define DIFFUSE_MULTIPLYER 2.5
#define PIXELATE 2
#define LOG2 1.442695

uniform sampler2D Texture0;
uniform float enabledLights;
varying vec3 position;
varying vec3 normal;
//varying float fogFactor;

void main()
{
	if (gl_FragCoord.z < position.z) {
		gl_FragColor = vec4(1, 1, 1, 1); 
		return;
	};
	/*gl_FogFragCoord = length(position);
	float fogFactor = 1 - exp2( -gl_Fog.density * 
					   gl_Fog.density * 
					   gl_FogFragCoord * 
					   gl_FogFragCoord * 
					   LOG2 );
	fogFactor = clamp(fogFactor, 0.0, 1.0);*/
	//float fogFactor = 1.0 - (gl_Fog.end + gl_FragCoord.z/gl_FragCoord.w) / (gl_Fog.end - gl_Fog.start);
	//fogFactor += 1.0;
	//fogFactor /= 2.0;
	//fogFactor = clamp(fogFactor, 0.0, 1.0);
	float depth = gl_FragCoord.z / gl_FragCoord.w;
	float fogFactor = (gl_Fog.end - depth) / (gl_Fog.end - gl_Fog.start);
	fogFactor = clamp(fogFactor, 0.0, 1.0);
	//float fogFactor = gl_Fog.start - (gl_Fog.end + ) / ;

	vec4 finalColor = gl_LightSource[0].ambient / gl_LightSource[0].quadraticAttenuation * MULTIPLYER;
	vec3 lengthVector = gl_LightSource[0].position.xyz;
	vec3 normalizedLengthVector = normalize(lengthVector);
	float vectorLength = length(lengthVector);
	float NdotL = dot(normal, normalizedLengthVector);
		
	if (NdotL > 0.0) {
		float lightIntensity = max(0.0, NdotL);
		finalColor += lightIntensity * (gl_LightSource[0].diffuse / gl_LightSource[0].quadraticAttenuation * DIFFUSE_MULTIPLYER);
	};
	
	
	for (int i = 1; i < enabledLights; i++) {
		lengthVector = gl_LightSource[i].position.xyz - position;
		normalizedLengthVector = normalize(lengthVector);
		vectorLength = length(lengthVector);
		NdotL = dot(normal, normalizedLengthVector);
		if (NdotL > 0.0) {
			if (gl_LightSource[i].quadraticAttenuation > 0) {
				float lightAttenuation = NdotL * (1.f - vectorLength / gl_LightSource[i].quadraticAttenuation);
				if (gl_LightSource[i].spotCutoff == 180) {
					if (vectorLength < gl_LightSource[i].quadraticAttenuation) {
						finalColor += lightAttenuation * (gl_LightSource[i].diffuse / gl_LightSource[i].quadraticAttenuation * DIFFUSE_MULTIPLYER);
					};
				} else {
					float spotEffect = dot(normalize(gl_LightSource[i].spotDirection), -normalizedLengthVector);
					
					//Cutoff
					float outterCutoff = gl_LightSource[i].spotCosCutoff + 0.05;
					float innerCutoff = gl_LightSource[i].spotCosCutoff;
					float cutoffDifference = innerCutoff-outterCutoff;
					float cutoffEffect = 1 - clamp((spotEffect - outterCutoff) / cutoffDifference, 0.0, 1.0);
					
					if(spotEffect > gl_LightSource[i].spotCosCutoff) {
						float lightIntensity = max(0.0, lightAttenuation * cutoffEffect);
						finalColor += lightIntensity * (gl_LightSource[i].diffuse / gl_LightSource[i].quadraticAttenuation * DIFFUSE_MULTIPLYER);
					};
				};
			};
		};
	};
	
	finalColor.a = 1;
	vec4 texColor = texture2D(Texture0,gl_TexCoord[0].st);
	vec4 fogColor = gl_Fog.color;
	fogColor.a = texColor.a;
    gl_FragColor = mix(fogColor, texColor * finalColor, fogFactor);  
}