"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber"; // Import useThree
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Helper to add barycentric coordinates to a geometry if they don't exist
const addBarycentricCoordinates = (geometry) => {
	if (!geometry.attributes.barycentric) {
		const positionAttribute = geometry.attributes.position;
		const count = positionAttribute.count; // Number of vertices

		// Each vertex needs a barycentric coord (1,0,0), (0,1,0), or (0,0,1)
		// Data is per-vertex, so for each triangle (3 vertices), we set these.
		const barycentric = new Float32Array(count * 3);

		for (let i = 0; i < count; i++) {
			const remainder = i % 3;
			if (remainder === 0) {
				// First vertex of a triangle
				barycentric[i * 3 + 0] = 1;
				barycentric[i * 3 + 1] = 0;
				barycentric[i * 3 + 2] = 0;
			} else if (remainder === 1) {
				// Second vertex
				barycentric[i * 3 + 0] = 0;
				barycentric[i * 3 + 1] = 1;
				barycentric[i * 3 + 2] = 0;
			} else {
				// Third vertex
				barycentric[i * 3 + 0] = 0;
				barycentric[i * 3 + 1] = 0;
				barycentric[i * 3 + 2] = 1;
			}
		}
		geometry.setAttribute(
			"barycentric",
			new THREE.BufferAttribute(barycentric, 3)
		);
	}
};

function Model({ progress }) {
	// progress is 0-100
	const { scene } = useGLTF("/progress/scene.gltf");
	const modelRef = useRef();
	const processedGeometries = useRef(new Set()); // To track geometries that have barycentric coords

	const inactiveMaterialStyle = useMemo(
		() => ({
			color: new THREE.Color(0x33ff33), // Bright green for "glowing" wireframe
		}),
		[]
	);

	// Calculate the model's local bounding box once the scene is loaded
	const localBoundingBox = useMemo(() => {
		if (!scene) return null;
		const box = new THREE.Box3().setFromObject(scene);
		return box;
	}, [scene]);

	useEffect(() => {
		if (!scene || !localBoundingBox) return;

		const currentProgressNormalized = progress / 100;

		scene.traverse((child) => {
			if (child.isMesh) {
				// Add barycentric coordinates if not already processed for this geometry
				if (!processedGeometries.current.has(child.geometry.uuid)) {
					addBarycentricCoordinates(child.geometry);
					processedGeometries.current.add(child.geometry.uuid);
				}

				if (!child.material.userData.isCustomizedForProgress) {
					child.material = child.material.clone();
					child.material.userData.isCustomizedForProgress = true;

					child.material.userData.uniforms = {
						uProgress: { value: currentProgressNormalized },
						uBoundingBoxMin: { value: localBoundingBox.min },
						uBoundingBoxMax: { value: localBoundingBox.max },
						uInactiveColor: { value: inactiveMaterialStyle.color },
						// uWireframeThickness: { value: 0.05 }, // Optional: if you want to control thickness via uniform
					};

					child.material.onBeforeCompile = (shader) => {
						shader.uniforms.uProgress =
							child.material.userData.uniforms.uProgress;
						shader.uniforms.uBoundingBoxMin =
							child.material.userData.uniforms.uBoundingBoxMin;
						shader.uniforms.uBoundingBoxMax =
							child.material.userData.uniforms.uBoundingBoxMax;
						shader.uniforms.uInactiveColor =
							child.material.userData.uniforms.uInactiveColor;
						// if (child.material.userData.uniforms.uWireframeThickness) {
						//  shader.uniforms.uWireframeThickness = child.material.userData.uniforms.uWireframeThickness;
						// }

						shader.vertexShader = shader.vertexShader
							.replace(
								`#include <common>`,
								`#include <common>
								attribute vec3 barycentric; // Added for wireframe
								varying vec3 vBarycentric;  // Added for wireframe
								varying vec3 vLocalPos;`
							)
							.replace(
								`#include <begin_vertex>`,
								`#include <begin_vertex>
								vLocalPos = position;
								vBarycentric = barycentric;` // Pass barycentric to fragment
							);

						const fragmentShaderDeclarations = `
							uniform vec3 uBoundingBoxMin;
							uniform vec3 uBoundingBoxMax;
							uniform vec3 uInactiveColor;
							uniform float uProgress;
							// uniform float uWireframeThickness; // Optional: if controlled by uniform
							varying vec3 vLocalPos;
							varying vec3 vBarycentric; // Added for wireframe
						`;

						shader.fragmentShader =
							fragmentShaderDeclarations + shader.fragmentShader;

						shader.fragmentShader = shader.fragmentShader.replace(
							`#include <dithering_fragment>`,
							`#include <dithering_fragment>
							float normalizedProgressCoord = 0.0;
							if ((uBoundingBoxMax.z - uBoundingBoxMin.z) > 0.0001) {
								normalizedProgressCoord = (vLocalPos.z - uBoundingBoxMin.z) / (uBoundingBoxMax.z - uBoundingBoxMin.z);
							} else {
								normalizedProgressCoord = (uProgress > 0.5) ? 0.0 : 1.0;
							}
							
							if (normalizedProgressCoord < (1.0 - uProgress)) {
								// Wireframe rendering for inactive part
								float wireThickness = 0.05; // Adjust this value for line thickness (0.0 to 1.0 range for barycentric)
                                // Use fwidth for anti-aliased lines based on barycentric coordinates
                                vec3 d = fwidth(vBarycentric);
                                vec3 a3 = smoothstep(vec3(0.0), d * 1.5, vBarycentric); // Antialiased barycentric
                                float minBary = min(a3.x, min(a3.y, a3.z));

                                if (minBary < wireThickness) { // If close to an edge
                                    gl_FragColor.rgb = uInactiveColor; // Glowing green
                                    gl_FragColor.a = 1.0;             // Opaque wire
                                } else { // Face center
                                    discard; // Make face transparent
                                }
							}
						`
						);
						// Ensure material is transparent if we are using discard,
						// or if faces are meant to be transparent.
						// This might be implicitly handled if original material is opaque and we discard.
						// If original material has transparency, this could interact.
						// For simplicity, assuming discard works as intended here.
					};
					child.material.needsUpdate = true;
				} else {
					if (child.material.userData.uniforms) {
						child.material.userData.uniforms.uProgress.value =
							currentProgressNormalized;
					}
				}
			}
		});
	}, [scene, progress, localBoundingBox, inactiveMaterialStyle]);

	if (!scene) return null;

	return (
		<primitive
			ref={modelRef}
			object={scene}
			scale={30}
			rotation={[0, -Math.PI / 2, 0]}
		/>
	);
}

useGLTF.preload("/progress/scene.gltf");

// Helper component to adjust camera aspect for stretching
function CameraAspectAdjuster({ stretchX }) {
	const { camera, size } = useThree();

	useEffect(() => {
		if (
			size.width > 0 &&
			size.height > 0 &&
			stretchX !== 0 &&
			camera.isPerspectiveCamera
		) {
			const originalAspect = size.width / size.height;
			camera.aspect = originalAspect / stretchX;
			camera.updateProjectionMatrix();
		}
	}, [camera, size, stretchX]);

	return null;
}

export default function ModelViewer({ progressPercentage, stretchX = 1.4 }) {
	// Added stretchX prop
	return (
		<div style={{ height: "230px", width: "100%", marginBottom: "2rem" }}>
			<Canvas camera={{ position: [0, 0, 15], fov: 30 }}>
				{" "}
				{/* Initial camera settings */}
				<CameraAspectAdjuster stretchX={stretchX} />{" "}
				{/* Component to adjust aspect */}
				<ambientLight intensity={0.8} />
				<directionalLight position={[10, 10, 10]} intensity={1} />
				<directionalLight position={[-10, -10, -5]} intensity={0.3} />
				<Suspense fallback={null}>
					<Model progress={progressPercentage} />
				</Suspense>
				<OrbitControls enableZoom={true} enablePan={true} />
			</Canvas>
		</div>
	);
}
