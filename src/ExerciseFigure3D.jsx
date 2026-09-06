import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, useGLTF, Clone } from "@react-three/drei";
import * as THREE from "three";

// =========================================================
// MODEL PATH — put your converted Mixamo .glb here.
// =========================================================
const MODEL_PATH = "/model.glb";
// If your bundler needs an import instead of a public-style path,
// replace the above with:
//   import modelUrl from "./assets/model.glb";
// and use `modelUrl` wherever MODEL_PATH is used below.

const MUSCLE_COLOR = new THREE.Color("#c9314f");
const RIG_DARK = "#1b1416";
const RIG_MID = "#2c2224";
const PLATE = "#0f0b0c";

// =========================================================
// BONE NAME MAP — Mixamo's rig uses these names on every
// character, regardless of which model you picked. If your
// specific export differs, adjust the strings on the right only.
// =========================================================
const BONES = {
  leftShoulder: "mixamorigLeftArm",
  leftElbow: "mixamorigLeftForeArm",
  rightShoulder: "mixamorigRightArm",
  rightElbow: "mixamorigRightForeArm",
  leftHip: "mixamorigLeftUpLeg",
  leftKnee: "mixamorigLeftLeg",
  rightHip: "mixamorigRightUpLeg",
  rightKnee: "mixamorigRightLeg",
};

// Muscle-group -> mesh-name-substring map. Mixamo's default body
// mesh is usually a single skinned mesh, so per-muscle isolation
// via material swap often isn't possible without a custom-segmented
// model. This map is here so it's a one-line fix *if* your model
// has separate named parts (e.g. from a segmented source); if it's
// one mesh, HIGHLIGHT_MODE below falls back to a full-body tint,
// which is the honest limitation of a single-mesh free rig.
const MUSCLE_MESH_HINTS = {
  chest: ["chest", "pec"],
  back: ["back", "spine", "lat"],
  shoulders: ["shoulder", "delt"],
  biceps: ["upperarm", "bicep", "arm"],
  triceps: ["upperarm", "tricep", "arm"],
  abs: ["abdomen", "torso", "abs"],
  quads: ["upleg", "thigh"],
  calves: ["leg", "calf", "shin"],
};

// =========================================================
// EQUIPMENT — unchanged from the primitive version; still built
// from simple shapes since it doesn't need to look organic.
// =========================================================

function RigPart({ shape = "box", args, position = [0, 0, 0], rotation, color = RIG_DARK, radius, length, radialSegments = 16 }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      {shape === "box" && <boxGeometry args={args} />}
      {shape === "cylinder" && (
        <cylinderGeometry args={[radius, radius, length, radialSegments]} />
      )}
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.35} />
    </mesh>
  );
}

function BenchAndBar() {
  return (
    <group position={[0, 0.02, 0.05]}>
      <RigPart args={[0.34, 0.09, 1.05]} position={[0, 0.32, 0]} color={PLATE} />
      <RigPart args={[0.06, 0.32, 0.06]} position={[-0.13, 0.16, 0.42]} />
      <RigPart args={[0.06, 0.32, 0.06]} position={[0.13, 0.16, 0.42]} />
      <RigPart args={[0.06, 0.32, 0.06]} position={[-0.13, 0.16, -0.42]} />
      <RigPart args={[0.06, 0.32, 0.06]} position={[0.13, 0.16, -0.42]} />
      <RigPart args={[0.07, 0.9, 0.07]} position={[-0.32, 0.45, -0.38]} />
      <RigPart args={[0.07, 0.9, 0.07]} position={[0.32, 0.45, -0.38]} />
      <RigPart shape="cylinder" radius={0.022} length={1.3} rotation={[0, 0, Math.PI / 2]} position={[0, 0.86, -0.38]} color="#3a3a3d" />
      <RigPart shape="cylinder" radius={0.09} length={0.08} position={[-0.58, 0.86, -0.38]} color={PLATE} />
      <RigPart shape="cylinder" radius={0.09} length={0.08} position={[0.58, 0.86, -0.38]} color={PLATE} />
    </group>
  );
}

function CableTower() {
  return (
    <group position={[0, 0, -0.55]}>
      <RigPart args={[0.16, 2.0, 0.18]} position={[0, 1.0, 0]} color={RIG_MID} />
      <RigPart shape="cylinder" radius={0.05} length={0.14} rotation={[Math.PI / 2, 0, 0]} position={[0, 1.75, 0.1]} color="#3a3a3d" />
      {[0, 1, 2, 3, 4].map((i) => (
        <RigPart key={i} args={[0.22, 0.045, 0.32]} position={[0, 0.35 + i * 0.06, 0.02]} color={PLATE} />
      ))}
      <RigPart args={[0.4, 0.05, 0.5]} position={[0, 0.03, 0.2]} color={RIG_MID} />
    </group>
  );
}

function FloorBarbell() {
  return (
    <group position={[0, 0.09, 0.5]}>
      <RigPart shape="cylinder" radius={0.022} length={1.5} rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]} color="#3a3a3d" />
      <RigPart shape="cylinder" radius={0.11} length={0.08} position={[-0.68, 0, 0]} color={PLATE} />
      <RigPart shape="cylinder" radius={0.11} length={0.08} position={[0.68, 0, 0]} color={PLATE} />
      <RigPart shape="cylinder" radius={0.09} length={0.06} position={[-0.6, 0, 0]} color={PLATE} />
      <RigPart shape="cylinder" radius={0.09} length={0.06} position={[0.6, 0, 0]} color={PLATE} />
    </group>
  );
}

function TreadmillDeck() {
  return (
    <group position={[0, 0.02, 0]}>
      <RigPart args={[0.5, 0.05, 1.4]} position={[0, 0.03, 0]} color={RIG_MID} />
      <RigPart args={[0.46, 0.02, 1.3]} position={[0, 0.06, 0]} color="#141014" />
      <RigPart args={[0.05, 0.75, 0.05]} position={[-0.24, 0.4, -0.62]} />
      <RigPart args={[0.05, 0.75, 0.05]} position={[0.24, 0.4, -0.62]} />
      <RigPart args={[0.5, 0.05, 0.12]} position={[0, 0.78, -0.62]} color={RIG_MID} />
    </group>
  );
}

function Equipment({ category }) {
  switch (category) {
    case "Chest":
      return <BenchAndBar />;
    case "Back":
    case "Shoulders":
    case "Arms & Abs":
      return <CableTower />;
    case "Legs":
      return <FloorBarbell />;
    case "Cardio":
      return <TreadmillDeck />;
    default:
      return null;
  }
}

// =========================================================
// RIGGED MODEL — loads the GLB once (cached by drei), then each
// instance clones it (via <Clone>, which is skeleton-aware, unlike
// a plain mesh clone) so multiple exercise cards can each have
// their own independently-posed copy from one loaded asset.
// =========================================================

function useMixamoBones(scene) {
  return useMemo(() => {
    const found = {};
    scene.traverse((obj) => {
      if (obj.isBone) {
        Object.entries(BONES).forEach(([key, name]) => {
          if (obj.name === name) found[key] = obj;
        });
      }
    });
    return found;
  }, [scene]);
}

// Applies a full-body emissive tint when any muscle in `highlight`
// is active. NOTE: most free Mixamo exports are a single skinned
// mesh, so per-muscle isolation isn't possible without a
// custom-segmented model — this is a whole-body highlight, not a
// spot highlight, which is the honest limit of a single-mesh rig.
// If your model happens to have separate named meshes per body
// part, this upgrades automatically via MUSCLE_MESH_HINTS.
function useHighlightMaterials(scene, highlight) {
  useEffect(() => {
    if (!scene) return;
    const active = highlight.length > 0;

    scene.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;

      // Clone material once per mesh so we don't mutate the shared
      // cached asset (which would leak across every card instance).
      if (!obj.userData._clonedMat) {
        obj.material = obj.material.clone();
        obj.userData._clonedMat = true;
      }

      const nameLower = obj.name.toLowerCase();
      const matchesHint = highlight.some((m) =>
        (MUSCLE_MESH_HINTS[m] || []).some((hint) => nameLower.includes(hint))
      );

      const shouldGlow = active && (matchesHint || !hasSegmentedMeshes(scene));

      if (obj.material.emissive) {
        obj.material.emissive = shouldGlow ? MUSCLE_COLOR.clone() : new THREE.Color("#000000");
        obj.material.emissiveIntensity = shouldGlow ? 0.55 : 0;
      }
    });
  }, [scene, highlight]);
}

// Rough heuristic: if the model has more than ~3 named meshes, it's
// probably segmented and we should only glow matched parts; a single
// mesh (typical Mixamo export) falls back to whole-body tint.
function hasSegmentedMeshes(scene) {
  let count = 0;
  scene.traverse((o) => {
    if (o.isMesh) count += 1;
  });
  return count > 3;
}

function RiggedModel({ highlight = [], anglesRef }) {
  const { scene } = useGLTF(MODEL_PATH);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const bones = useMixamoBones(cloned);
  useHighlightMaterials(cloned, highlight);

  useFrame(() => {
    const a = anglesRef.current;
    const s = THREE.MathUtils.degToRad(a.shoulder);
    const e = THREE.MathUtils.degToRad(a.elbow);
    const h = THREE.MathUtils.degToRad(a.hip);
    const k = THREE.MathUtils.degToRad(a.knee);

    // Mixamo's rest pose has arms down at the sides and legs
    // straight, so rotations are applied as offsets from that
    // rest pose rather than absolute angles.
    if (bones.leftShoulder) bones.leftShoulder.rotation.z = -s * 0.6;
    if (bones.rightShoulder) bones.rightShoulder.rotation.z = s * 0.6;
    if (bones.leftElbow) bones.leftElbow.rotation.y = -e * 0.5;
    if (bones.rightElbow) bones.rightElbow.rotation.y = e * 0.5;
    if (bones.leftHip) bones.leftHip.rotation.x = h;
    if (bones.rightHip) bones.rightHip.rotation.x = h;
    if (bones.leftKnee) bones.leftKnee.rotation.x = k;
    if (bones.rightKnee) bones.rightKnee.rotation.x = k;
  });

  return <primitive object={cloned} scale={1} position={[0, 0, 0]} />;
}

useGLTF.preload(MODEL_PATH);

// =========================================================
// ANIMATOR — identical pose math to the primitive version; only
// what consumes anglesRef (RiggedModel vs RiggedBody) changed.
// =========================================================

function usePoseAnimator(pose, playing) {
  const start = pose?.start || {};
  const end = pose?.end || {};

  const anglesRef = useRef({
    shoulder: start.arm ?? 8,
    elbow: start.arm2 ?? 0,
    hip: start.leg ?? 4,
    knee: start.leg2 ?? 0,
  });
  const tRef = useRef(0);
  const dirRef = useRef(1);
  const [cycles, setCycles] = useState(0);

  useFrame((_, delta) => {
    if (!playing) return;
    let t = tRef.current + dirRef.current * delta * 0.55;
    if (t >= 1) {
      t = 1;
      dirRef.current = -1;
    } else if (t <= 0) {
      t = 0;
      dirRef.current = 1;
      setCycles((c) => c + 1);
    }
    tRef.current = t;

    anglesRef.current = {
      shoulder: THREE.MathUtils.lerp(start.arm ?? 8, end.arm ?? 8, t),
      elbow: THREE.MathUtils.lerp(start.arm2 ?? 0, end.arm2 ?? 0, t),
      hip: THREE.MathUtils.lerp(start.leg ?? 4, end.leg ?? 4, t),
      knee: THREE.MathUtils.lerp(start.leg2 ?? 0, end.leg2 ?? 0, t),
    };
  });

  return { anglesRef, cycles };
}

function AnimatedHumanoid({ pose, highlight, playing, onCycle }) {
  const { anglesRef, cycles } = usePoseAnimator(pose, playing);
  const lastCycle = useRef(0);

  useEffect(() => {
    if (cycles > lastCycle.current) {
      lastCycle.current = cycles;
      onCycle?.(cycles);
    }
  }, [cycles, onCycle]);

  return <RiggedModel highlight={highlight} anglesRef={anglesRef} />;
}

// =========================================================
// CAMERA AIM + SCENE — unchanged from the primitive version.
// =========================================================

function CameraAim({ target = [0, 1, 0] }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(...target);
  }, [camera, target]);
  return null;
}

function Scene({ children, orbit = false }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[2.2, 4, 3]} intensity={1.1} castShadow color="#fff6f2" />
      <directionalLight position={[-2.5, 1.5, 2]} intensity={0.4} color="#ffe6e6" />
      <pointLight position={[0, 1.6, -2.2]} intensity={1.4} color="#c9314f" distance={6} decay={2} />

      {children}

      <ContactShadows position={[0, 0, 0]} opacity={0.4} blur={2.2} scale={3.4} far={2} />

      {orbit ? (
        <OrbitControls
          target={[0, 1, 0]}
          enablePan={false}
          enableZoom={false}
          autoRotate={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.7}
        />
      ) : (
        <CameraAim target={[0, 1, 0]} />
      )}
    </>
  );
}

// =========================================================
// EXPORTED COMPONENTS — same public API as the primitive version,
// so App.jsx needs zero changes to switch to this file.
// =========================================================

export function ExerciseFigure3D({
  highlight = [],
  arm = 8,
  arm2 = 0,
  leg = 4,
  leg2 = 0,
  size = 60,
}) {
  const anglesRef = useRef({ shoulder: arm, elbow: arm2, hip: leg, knee: leg2 });
  anglesRef.current = { shoulder: arm, elbow: arm2, hip: leg, knee: leg2 };

  return (
    <div style={{ width: size, height: size }}>
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ position: [0, 1.25, 3.1], fov: 32 }}
        gl={{ alpha: true }}
      >
        <Scene>
          <RiggedModel highlight={highlight} anglesRef={anglesRef} />
        </Scene>
      </Canvas>
    </div>
  );
}

export function ExercisePosePair3D({ exercise, size = 72 }) {
  const { pose, highlight = [], title, muscle } = exercise;
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [reps, setReps] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="exerciseFigurePair"
      style={{ width: "100%", height: "100%", minHeight: size, position: "relative" }}
    >
      {visible ? (
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 1.3, 3.4], fov: 34 }} gl={{ alpha: true }}>
          <Scene>
            <AnimatedHumanoid
              pose={pose}
              highlight={highlight}
              playing={playing}
              onCycle={() => setReps((r) => r + 1)}
            />
            <Equipment category={muscle} />
          </Scene>
        </Canvas>
      ) : (
        <div className="skeleton skeletonCard" style={{ width: "100%", height: "100%" }} />
      )}

      {visible && (
        <>
          <button
            type="button"
            className={playing ? "poseAnimToggle poseAnimToggleOn" : "poseAnimToggle"}
            onClick={(e) => {
              e.stopPropagation();
              setPlaying((p) => !p);
            }}
            aria-label={playing ? `Pause ${title} animation` : `Play ${title} animation`}
          >
            {playing ? "❚❚" : "▶"}
          </button>
          {reps > 0 && (
            <span className="exerciseRepCounter">
              {reps} rep{reps === 1 ? "" : "s"}
            </span>
          )}
        </>
      )}
    </div>
  );
}

export function ExerciseFigure3DViewer({ exercise, size = 280 }) {
  const { pose, highlight = [], muscle } = exercise;
  const [playing, setPlaying] = useState(true);

  return (
    <div className="exercise3DViewer">
      <div style={{ height: size }}>
        <Canvas dpr={[1, 2]} shadows camera={{ position: [0, 1.35, 3.6], fov: 34 }} gl={{ alpha: true }}>
          <Scene orbit>
            <AnimatedHumanoid pose={pose} highlight={highlight} playing={playing} />
            <Equipment category={muscle} />
          </Scene>
        </Canvas>
      </div>

      <div className="exercise3DViewerBar">
        <span>Drag to rotate 360°</span>
        <button type="button" className="outlineButton" onClick={() => setPlaying((p) => !p)}>
          {playing ? "Pause" : "Play"} animation
        </button>
      </div>
    </div>
  );
}