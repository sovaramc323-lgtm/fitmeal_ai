import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

// =========================================================
// PALETTE
// -----------------------------------------------------------
// Ivory sculpted body + red muscle glow — deliberately echoes
// the "anatomy poster" reference image's look (white figure,
// red highlighted muscles) using flat-shaded 3D primitives
// instead of a painted/rendered asset.
// =========================================================
const SKIN = "#ece2dc";
const MUSCLE = "#c9314f";

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
      <meshStandardMaterial
        color={color}
        roughness={0.5}
        metalness={0.05}
        emissive={highlighted ? MUSCLE : "#000000"}
        emissiveIntensity={highlighted ? 0.45 : 0}
      />
    </mesh>
  );
}

// =========================================================
// BODY PARTS
// -----------------------------------------------------------
// Grouped so each rotating joint (shoulder/elbow/hip/knee) is
// a <group> whose ref gets its rotation.x set every frame by
// the animator below — mutating refs directly (not React
// state) keeps this cheap enough to run several instances of
// at once (one per visible exercise card).
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
// RIG — takes an anglesRef (mutable, updated per-frame by
// whoever drives the animation) and applies it to the four
// pivot pairs every frame.
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
// ANIMATOR — ping-pongs between pose.start and pose.end,
// writing into a ref every frame (no React state in the hot
// path). Calls onCycle() once per completed start->end->start
// loop, used for the little "N reps" counter.
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
// SCENE — shared lights/ground for every canvas instance.
// orbit=true adds drag-to-rotate (no auto-spin, no zoom/pan —
// per spec this is drag-only).
// =========================================================

function Scene({ children, orbit = false }) {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[2, 4, 3]} intensity={0.9} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} color="#ffdcdc" />
      {children}
      <ContactShadows position={[0, 0, 0]} opacity={0.35} blur={2} scale={3} far={2} />
      {orbit && (
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.7}
        />
      )}
    </>
  );
}

// =========================================================
// EXPORTED COMPONENTS
// =========================================================

// Small static single-pose figure — used for the step-by-step
// "SETUP / EXECUTE / CONTROL" mini illustrations. No animation,
// no drag; renders once on demand to stay cheap.
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

// Small looping thumbnail used in the exercise grid cards.
// Lazy-mounts its WebGL canvas only while scrolled into view
// (28 of these exist at once — always-on would be very heavy).
export function ExercisePosePair3D({ exercise, size = 72 }) {
  const { pose, highlight = [], title } = exercise;
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
      style={{ width: size, height: size, position: "relative" }}
    >
      {visible ? (
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 1.25, 3.1], fov: 34 }}
          gl={{ alpha: true }}
        >
          <Scene>
            <AnimatedHumanoid
              pose={pose}
              highlight={highlight}
              playing={playing}
              onCycle={() => setReps((r) => r + 1)}
            />
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
// continuously. This is the new piece: drop it into the
// expanded exercise card for the full rotatable view.
export function ExerciseFigure3DViewer({ exercise, size = 280 }) {
  const { pose, highlight = [] } = exercise;
  const [playing, setPlaying] = useState(true);

  return (
    <div className="exercise3DViewer">
      <div style={{ height: size }}>
        <Canvas
          dpr={[1, 2]}
          shadows
          camera={{ position: [0, 1.3, 3.4], fov: 34 }}
          gl={{ alpha: true }}
        >
          <Scene orbit>
            <AnimatedHumanoid pose={pose} highlight={highlight} playing={playing} />
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
