import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

// =========================================================
// PALETTE
// -----------------------------------------------------------
// Ivory sculpted body + red muscle glow — echoes the "anatomy
// poster" reference (white figure, red highlighted muscles,
// dark gym equipment) using flat-shaded 3D primitives instead
// of a painted/rendered asset.
// =========================================================
const SKIN = "#ece2dc";
const MUSCLE = "#c9314f";
const RIG_DARK = "#1b1416";
const RIG_MID = "#2c2224";
const PLATE = "#0f0b0c";

// =========================================================
// PRIMITIVES
// =========================================================

function Part({
  shape = "capsule",
  length = 0.2,
  radius = 0.05,
  args,
  position = [0, 0, 0],
  color = SKIN,
  highlighted = false,
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      {shape === "capsule" && (
        <capsuleGeometry args={[radius, length, 8, 16]} />
      )}
      {shape === "sphere" && <sphereGeometry args={[radius, 28, 28]} />}
      {shape === "box" && <boxGeometry args={args} />}
      <meshPhysicalMaterial
        color={color}
        roughness={highlighted ? 0.32 : 0.38}
        metalness={0.04}
        clearcoat={0.55}
        clearcoatRoughness={0.25}
        emissive={highlighted ? MUSCLE : "#000000"}
        emissiveIntensity={highlighted ? 0.5 : 0}
      />
    </mesh>
  );
}

// Flat dark metal used for gym equipment — visually distinct from the
// glossy ivory body so the figure always reads as the subject.
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

// =========================================================
// EQUIPMENT — one simple prop per exercise category, built from
// the same primitive language as the body. Purely set dressing;
// none of it is rigged or animated.
// =========================================================

function BenchAndBar() {
  return (
    <group position={[0, 0.02, 0.05]}>
      {/* bench pad */}
      <RigPart args={[0.34, 0.09, 1.05]} position={[0, 0.32, 0]} color={PLATE} />
      {/* legs */}
      <RigPart args={[0.06, 0.32, 0.06]} position={[-0.13, 0.16, 0.42]} />
      <RigPart args={[0.06, 0.32, 0.06]} position={[0.13, 0.16, 0.42]} />
      <RigPart args={[0.06, 0.32, 0.06]} position={[-0.13, 0.16, -0.42]} />
      <RigPart args={[0.06, 0.32, 0.06]} position={[0.13, 0.16, -0.42]} />
      {/* uprights */}
      <RigPart args={[0.07, 0.9, 0.07]} position={[-0.32, 0.45, -0.38]} />
      <RigPart args={[0.07, 0.9, 0.07]} position={[0.32, 0.45, -0.38]} />
      {/* bar resting in rack (start pose) */}
      <RigPart
        shape="cylinder"
        radius={0.022}
        length={1.3}
        rotation={[0, 0, Math.PI / 2]}
        position={[0, 0.86, -0.38]}
        color="#3a3a3d"
      />
      <RigPart shape="cylinder" radius={0.09} length={0.08} position={[-0.58, 0.86, -0.38]} color={PLATE} />
      <RigPart shape="cylinder" radius={0.09} length={0.08} position={[0.58, 0.86, -0.38]} color={PLATE} />
    </group>
  );
}

function CableTower() {
  return (
    <group position={[0, 0, -0.55]}>
      {/* tower column */}
      <RigPart args={[0.16, 2.0, 0.18]} position={[0, 1.0, 0]} color={RIG_MID} />
      {/* pulley at top */}
      <RigPart shape="cylinder" radius={0.05} length={0.14} rotation={[Math.PI / 2, 0, 0]} position={[0, 1.75, 0.1]} color="#3a3a3d" />
      {/* weight stack */}
      {[0, 1, 2, 3, 4].map((i) => (
        <RigPart
          key={i}
          args={[0.22, 0.045, 0.32]}
          position={[0, 0.35 + i * 0.06, 0.02]}
          color={PLATE}
        />
      ))}
      {/* base */}
      <RigPart args={[0.4, 0.05, 0.5]} position={[0, 0.03, 0.2]} color={RIG_MID} />
    </group>
  );
}

function FloorBarbell() {
  return (
    <group position={[0, 0.09, 0.5]}>
      <RigPart
        shape="cylinder"
        radius={0.022}
        length={1.5}
        rotation={[0, 0, Math.PI / 2]}
        position={[0, 0, 0]}
        color="#3a3a3d"
      />
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

// Maps the exercise's `muscle` category (see EXERCISES in App.jsx)
// to a piece of equipment. Falls back to no prop for anything
// unmapped rather than guessing.
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
// BODY PARTS
// =========================================================

function Torso({ highlight }) {
  const has = (m) => highlight.includes(m);
  return (
    <group position={[0, 1.15, 0]}>
      <Part shape="box" args={[0.26, 0.18, 0.16]} position={[0, -0.25, 0]} />

      {[0, 1, 2].map((row) =>
        [-1, 1].map((col) => (
          <Part
            key={`ab-${row}-${col}`}
            shape="box"
            args={[0.09, 0.075, 0.05]}
            position={[col * 0.055, -0.02 - row * 0.085, 0.11]}
            color={has("abs") ? MUSCLE : SKIN}
            highlighted={has("abs")}
          />
        ))
      )}

      {[-1, 1].map((side) => (
        <Part
          key={`chest-${side}`}
          shape="sphere"
          radius={0.11}
          position={[side * 0.1, 0.22, 0.09]}
          color={has("chest") ? MUSCLE : SKIN}
          highlighted={has("chest")}
        />
      ))}

      <Part
        shape="box"
        args={[0.3, 0.42, 0.08]}
        position={[0, 0.1, -0.1]}
        color={has("back") ? MUSCLE : SKIN}
        highlighted={has("back")}
      />

      <Part shape="capsule" length={0.05} radius={0.045} position={[0, 0.42, 0]} />
      <Part shape="sphere" radius={0.13} position={[0, 0.58, 0]} />
    </group>
  );
}

function ArmRig({ side, shoulderRef, elbowRef, highlight }) {
  const dir = side === "left" ? -1 : 1;
  const has = (m) => highlight.includes(m);
  return (
    <group ref={shoulderRef} position={[dir * 0.21, 1.42, 0]}>
      <Part
        shape="sphere"
        radius={0.075}
        color={has("shoulders") ? MUSCLE : SKIN}
        highlighted={has("shoulders")}
      />
      <Part
        length={0.22}
        radius={0.05}
        position={[0, -0.17, 0.025]}
        color={has("biceps") ? MUSCLE : SKIN}
        highlighted={has("biceps")}
      />
      <Part
        length={0.22}
        radius={0.05}
        position={[0, -0.17, -0.025]}
        color={has("triceps") ? MUSCLE : SKIN}
        highlighted={has("triceps")}
      />
      <group ref={elbowRef} position={[0, -0.34, 0]}>
        <Part length={0.26} radius={0.042} position={[0, -0.15, 0]} />
        <Part shape="sphere" radius={0.045} position={[0, -0.3, 0]} />
      </group>
    </group>
  );
}

function LegRig({ side, hipRef, kneeRef, highlight }) {
  const dir = side === "left" ? -1 : 1;
  const has = (m) => highlight.includes(m);
  return (
    <group ref={hipRef} position={[dir * 0.11, 0.9, 0]}>
      <Part
        length={0.4}
        radius={0.085}
        position={[0, -0.22, 0]}
        color={has("quads") ? MUSCLE : SKIN}
        highlighted={has("quads")}
      />
      <group ref={kneeRef} position={[0, -0.45, 0]}>
        <Part
          length={0.36}
          radius={0.065}
          position={[0, -0.2, 0]}
          color={has("calves") ? MUSCLE : SKIN}
          highlighted={has("calves")}
        />
        <Part shape="box" args={[0.09, 0.05, 0.18]} position={[0, -0.42, 0.05]} />
      </group>
    </group>
  );
}

// =========================================================
// RIG
// =========================================================

function RiggedBody({ highlight = [], anglesRef }) {
  const shoulderL = useRef();
  const shoulderR = useRef();
  const elbowL = useRef();
  const elbowR = useRef();
  const hipL = useRef();
  const hipR = useRef();
  const kneeL = useRef();
  const kneeR = useRef();

  useFrame(() => {
    const a = anglesRef.current;
    const s = THREE.MathUtils.degToRad(a.shoulder);
    const e = THREE.MathUtils.degToRad(a.elbow);
    const h = THREE.MathUtils.degToRad(a.hip);
    const k = THREE.MathUtils.degToRad(a.knee);
    if (shoulderL.current) shoulderL.current.rotation.x = s;
    if (shoulderR.current) shoulderR.current.rotation.x = s;
    if (elbowL.current) elbowL.current.rotation.x = e;
    if (elbowR.current) elbowR.current.rotation.x = e;
    if (hipL.current) hipL.current.rotation.x = h;
    if (hipR.current) hipR.current.rotation.x = h;
    if (kneeL.current) kneeL.current.rotation.x = k;
    if (kneeR.current) kneeR.current.rotation.x = k;
  });

  return (
    <group>
      <Torso highlight={highlight} />
      <ArmRig side="left" shoulderRef={shoulderL} elbowRef={elbowL} highlight={highlight} />
      <ArmRig side="right" shoulderRef={shoulderR} elbowRef={elbowR} highlight={highlight} />
      <LegRig side="left" hipRef={hipL} kneeRef={kneeL} highlight={highlight} />
      <LegRig side="right" hipRef={hipR} kneeRef={kneeR} highlight={highlight} />
    </group>
  );
}

// =========================================================
// ANIMATOR
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

  return <RiggedBody highlight={highlight} anglesRef={anglesRef} />;
}

// =========================================================
// CAMERA AIM — a camera's position and where it points are two
// separate things in three.js. OrbitControls auto-aims at its
// target, but when orbit is off nothing else does, so every
// non-orbit view needs this to actually frame the figure.
// =========================================================

function CameraAim({ target = [0, 1, 0] }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(...target);
  }, [camera, target]);
  return null;
}

// =========================================================
// SCENE — studio 3-point lighting (key + fill + rim) plus a low
// red ambient glow behind the subject, echoing the reference's
// look. orbit=true adds drag-to-rotate (no auto-spin, no zoom/pan).
// =========================================================

function Scene({ children, orbit = false }) {
  return (
    <>
      {/* soft overall fill so shadows never go fully black */}
      <ambientLight intensity={0.35} />

      {/* key light — main modeling light, warm-white, front-right-high */}
      <directionalLight position={[2.2, 4, 3]} intensity={1.1} castShadow color="#fff6f2" />

      {/* fill light — softer, opposite side, keeps shadow side readable */}
      <directionalLight position={[-2.5, 1.5, 2]} intensity={0.4} color="#ffe6e6" />

      {/* rim/back light — the red glow-edge from the reference image */}
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
// EXPORTED COMPONENTS
// =========================================================

// Small static single-pose figure — SETUP / EXECUTE / CONTROL mini
// illustrations. No animation, no drag, no equipment (too small to
// read); renders once on demand to stay cheap.
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
          <RiggedBody highlight={highlight} anglesRef={anglesRef} />
        </Scene>
      </Canvas>
    </div>
  );
}

// Looping thumbnail used in the exercise grid cards. Lazy-mounts its
// WebGL canvas only while scrolled into view, and now fills its
// parent card slot instead of a fixed 72px box, so the card's own
// CSS controls the actual on-screen size.
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
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 1.3, 3.4], fov: 34 }}
          gl={{ alpha: true }}
        >
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

// Big interactive viewer — drag to orbit 360°, animation loops
// continuously, equipment included. Drop into the expanded
// exercise card for the full rotatable view.
export function ExerciseFigure3DViewer({ exercise, size = 280 }) {
  const { pose, highlight = [], muscle } = exercise;
  const [playing, setPlaying] = useState(true);

  return (
    <div className="exercise3DViewer">
      <div style={{ height: size }}>
        <Canvas
          dpr={[1, 2]}
          shadows
          camera={{ position: [0, 1.35, 3.6], fov: 34 }}
          gl={{ alpha: true }}
        >
          <Scene orbit>
            <AnimatedHumanoid pose={pose} highlight={highlight} playing={playing} />
            <Equipment category={muscle} />
          </Scene>
        </Canvas>
      </div>

      <div className="exercise3DViewerBar">
        <span>Drag to rotate 360°</span>
        <button
          type="button"
          className="outlineButton"
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? "Pause" : "Play"} animation
        </button>
      </div>
    </div>
  );
}