import React, { useEffect, useMemo, useState } from "react";

/*
  SVG EXERCISE FIGURES
  ---------------------
  No GLB.
  No Three.js.
  No WebGL.
  Keeps the same exports used by App.jsx:
    - ExerciseFigure3D
    - ExercisePosePair3D
    - ExerciseFigure3DViewer
*/

const SKIN = "#c9c9cf";
const SKIN_DARK = "#92929b";
const MUSCLE = "#c42a44";
const MUSCLE_SOFT = "#9f263b";
const LINE = "#55555f";
const EQUIPMENT = "#777780";

function isHighlighted(highlight = [], names = []) {
  return names.some((name) =>
    highlight.some((h) => String(h).toLowerCase() === name.toLowerCase())
  );
}

function jointColor(highlight, names) {
  return isHighlighted(highlight, names) ? MUSCLE : SKIN;
}

/* ---------------------------------------------------------
   SVG MANNEQUIN
--------------------------------------------------------- */

function ExerciseSVG({
  highlight = [],
  arm = 8,
  arm2 = 0,
  leg = 4,
  leg2 = 0,
  animated = false,
}) {
  const armAngle = Number(arm) || 0;
  const elbowAngle = Number(arm2) || 0;
  const legAngle = Number(leg) || 0;
  const kneeAngle = Number(leg2) || 0;

  const shoulder = jointColor(highlight, ["shoulders", "shoulder"]);
  const chest = jointColor(highlight, ["chest"]);
  const back = jointColor(highlight, ["back", "lats"]);
  const biceps = jointColor(highlight, ["biceps"]);
  const triceps = jointColor(highlight, ["triceps"]);
  const abs = jointColor(highlight, ["abs", "core"]);
  const quads = jointColor(highlight, ["quads", "legs"]);
  const calves = jointColor(highlight, ["calves"]);

  return (
    <svg
      viewBox="0 0 220 300"
      className="exerciseFigureSvg"
      role="img"
      aria-label="Exercise anatomical figure"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        overflow: "visible",
      }}
    >
      <defs>
        <linearGradient id="figureBodyGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eeeeF2" />
          <stop offset="55%" stopColor={SKIN} />
          <stop offset="100%" stopColor={SKIN_DARK} />
        </linearGradient>

        <radialGradient id="figureMuscleGradient">
          <stop offset="0%" stopColor="#e64a63" />
          <stop offset="100%" stopColor={MUSCLE_SOFT} />
        </radialGradient>
      </defs>

      <g
        transform="translate(110 150)"
        style={{
          transformOrigin: "110px 150px",
          transformBox: "fill-box",
        }}
      >
        {/* HEAD */}
        <circle
          cx="0"
          cy="-108"
          r="25"
          fill="url(#figureBodyGradient)"
          stroke={LINE}
          strokeWidth="3"
        />

        {/* NECK */}
        <rect
          x="-11"
          y="-86"
          width="22"
          height="24"
          rx="8"
          fill={SKIN}
          stroke={LINE}
          strokeWidth="3"
        />

        {/* TORSO */}
        <path
          d="M-38-65
             Q-18-78 0-72
             Q18-78 38-65
             L48-8
             Q43 30 30 52
             L-30 52
             Q-43 30-48-8Z"
          fill="url(#figureBodyGradient)"
          stroke={LINE}
          strokeWidth="3"
        />

        {/* CHEST */}
        <path
          d="M-39-54 Q-19-68 0-54 Q19-68 39-54 L34-28 Q15-20 0-31 Q-15-20-34-28Z"
          fill={chest}
          opacity="0.95"
        />

        {/* BACK / SIDE */}
        <path
          d="M-43-42 Q-54-22-39 5 L-30 34 L-22 12 L-28-18Z"
          fill={back}
          opacity="0.8"
        />
        <path
          d="M43-42 Q54-22 39 5 L30 34 L22 12 L28-18Z"
          fill={back}
          opacity="0.8"
        />

        {/* ABS */}
        <rect
          x="-24"
          y="-18"
          width="48"
          height="62"
          rx="17"
          fill={abs}
          opacity="0.9"
        />

        <path d="M0-14V40" stroke={LINE} strokeWidth="2" opacity="0.45" />
        <path d="M-21 0H21M-20 18H20M-18 35H18" stroke={LINE} strokeWidth="1.5" opacity="0.35" />

        {/* LEFT ARM */}
        <g
          style={{
            transformOrigin: "-39px -52px",
            transform: `rotate(${armAngle}deg)`,
            transition: animated ? "transform .25s ease" : undefined,
          }}
        >
          <path
            d="M-39-57 Q-53-62-62-48 L-82-3 Q-87 8-78 14 Q-69 18-63 7 L-42-31Z"
            fill={shoulder}
            stroke={LINE}
            strokeWidth="3"
          />

          <g
            style={{
              transformOrigin: "-77px 10px",
              transform: `rotate(${elbowAngle}deg)`,
              transition: animated ? "transform .25s ease" : undefined,
            }}
          >
            <path
              d="M-78 7 Q-86 18-88 34 L-94 70 Q-95 82-84 84 Q-74 85-72 73 L-68 36 Q-66 23-69 13Z"
              fill={biceps}
              stroke={LINE}
              strokeWidth="3"
            />

            <circle
              cx="-78"
              cy="10"
              r="7"
              fill={triceps}
              stroke={LINE}
              strokeWidth="2"
            />

            <circle
              cx="-83"
              cy="83"
              r="7"
              fill={SKIN}
              stroke={LINE}
              strokeWidth="2"
            />
          </g>
        </g>

        {/* RIGHT ARM */}
        <g
          style={{
            transformOrigin: "39px -52px",
            transform: `rotate(${-armAngle}deg)`,
            transition: animated ? "transform .25s ease" : undefined,
          }}
        >
          <path
            d="M39-57 Q53-62 62-48 L82-3 Q87 8 78 14 Q69 18 63 7 L42-31Z"
            fill={shoulder}
            stroke={LINE}
            strokeWidth="3"
          />

          <g
            style={{
              transformOrigin: "77px 10px",
              transform: `rotate(${-elbowAngle}deg)`,
              transition: animated ? "transform .25s ease" : undefined,
            }}
          >
            <path
              d="M78 7 Q86 18 88 34 L94 70 Q95 82 84 84 Q74 85 72 73 L68 36 Q66 23 69 13Z"
              fill={biceps}
              stroke={LINE}
              strokeWidth="3"
            />

            <circle
              cx="78"
              cy="10"
              r="7"
              fill={triceps}
              stroke={LINE}
              strokeWidth="2"
            />

            <circle
              cx="83"
              cy="83"
              r="7"
              fill={SKIN}
              stroke={LINE}
              strokeWidth="2"
            />
          </g>
        </g>

        {/* LEFT LEG */}
        <g
          style={{
            transformOrigin: "-20px 49px",
            transform: `rotate(${legAngle}deg)`,
            transition: animated ? "transform .25s ease" : undefined,
          }}
        >
          <path
            d="M-30 45 Q-18 39-7 45 L-10 108 Q-11 119-21 120 Q-31 120-32 109Z"
            fill={quads}
            stroke={LINE}
            strokeWidth="3"
          />

          <g
            style={{
              transformOrigin: "-21px 116px",
              transform: `rotate(${kneeAngle}deg)`,
              transition: animated ? "transform .25s ease" : undefined,
            }}
          >
            <circle
              cx="-21"
              cy="116"
              r="8"
              fill={SKIN}
              stroke={LINE}
              strokeWidth="2"
            />

            <path
              d="M-29 121 Q-17 118-12 125 L-7 176 Q-6 188-17 189 Q-29 189-31 177Z"
              fill={calves}
              stroke={LINE}
              strokeWidth="3"
            />

            <path
              d="M-18 187 Q-5 185 5 192 Q8 199-2 201 L-31 200 Q-36 195-31 190Z"
              fill={SKIN_DARK}
              stroke={LINE}
              strokeWidth="3"
            />
          </g>
        </g>

        {/* RIGHT LEG */}
        <g
          style={{
            transformOrigin: "20px 49px",
            transform: `rotate(${-legAngle}deg)`,
            transition: animated ? "transform .25s ease" : undefined,
          }}
        >
          <path
            d="M30 45 Q18 39 7 45 L10 108 Q11 119 21 120 Q31 120 32 109Z"
            fill={quads}
            stroke={LINE}
            strokeWidth="3"
          />

          <g
            style={{
              transformOrigin: "21px 116px",
              transform: `rotate(${-kneeAngle}deg)`,
              transition: animated ? "transform .25s ease" : undefined,
            }}
          >
            <circle
              cx="21"
              cy="116"
              r="8"
              fill={SKIN}
              stroke={LINE}
              strokeWidth="2"
            />

            <path
              d="M29 121 Q17 118 12 125 L7 176 Q6 188 17 189 Q29 189 31 177Z"
              fill={calves}
              stroke={LINE}
              strokeWidth="3"
            />

            <path
              d="M18 187 Q5 185-5 192 Q-8 199 2 201 L31 200 Q36 195 31 190Z"
              fill={SKIN_DARK}
              stroke={LINE}
              strokeWidth="3"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------
   EQUIPMENT
--------------------------------------------------------- */

function Equipment({ category }) {
  const type = String(category || "").toLowerCase();

  if (type.includes("chest")) {
    return (
      <svg className="exerciseEquipmentSvg" viewBox="0 0 220 100">
        <rect x="35" y="68" width="150" height="8" rx="4" fill={EQUIPMENT} />
        <rect x="70" y="42" width="80" height="10" rx="5" fill={EQUIPMENT} />
        <rect x="88" y="20" width="44" height="8" rx="4" fill={EQUIPMENT} />
        <path d="M90 48L65 68M130 48L155 68" stroke={EQUIPMENT} strokeWidth="7" />
      </svg>
    );
  }

  if (type.includes("legs")) {
    return (
      <svg className="exerciseEquipmentSvg" viewBox="0 0 220 100">
        <rect x="45" y="68" width="130" height="8" rx="4" fill={EQUIPMENT} />
        <rect x="70" y="42" width="80" height="9" rx="4" fill={EQUIPMENT} />
        <circle cx="52" cy="73" r="12" fill="none" stroke={EQUIPMENT} strokeWidth="5" />
        <circle cx="168" cy="73" r="12" fill="none" stroke={EQUIPMENT} strokeWidth="5" />
      </svg>
    );
  }

  if (type.includes("back")) {
    return (
      <svg className="exerciseEquipmentSvg" viewBox="0 0 220 100">
        <path
          d="M65 78V25M155 78V25M65 30H155"
          stroke={EQUIPMENT}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path d="M80 30L105 55M140 30L115 55" stroke={EQUIPMENT} strokeWidth="6" />
      </svg>
    );
  }

  return null;
}

/* ---------------------------------------------------------
   SIMPLE ANIMATION
--------------------------------------------------------- */

function usePoseAnimation(pose, playing) {
  const start = pose?.start || {};
  const end = pose?.end || {};

  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!playing) return undefined;

    let frame;
    let startTime = null;

    const tick = (time) => {
      if (startTime === null) startTime = time;

      const elapsed = (time - startTime) / 1000;
      const value = (Math.sin(elapsed * Math.PI * 1.2) + 1) / 2;

      setPhase(value);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const lerp = (a, b) =>
    Number(a ?? 0) + (Number(b ?? 0) - Number(a ?? 0)) * phase;

  return {
    arm: lerp(start.arm ?? 8, end.arm ?? 8),
    arm2: lerp(start.arm2 ?? 0, end.arm2 ?? 0),
    leg: lerp(start.leg ?? 4, end.leg ?? 4),
    leg2: lerp(start.leg2 ?? 0, end.leg2 ?? 0),
  };
}

/* ---------------------------------------------------------
   EXERCISE FIGURE
--------------------------------------------------------- */

export function ExerciseFigure3D({
  highlight = [],
  arm = 8,
  arm2 = 0,
  leg = 4,
  leg2 = 0,
  size = 60,
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ExerciseSVG
        highlight={highlight}
        arm={arm}
        arm2={arm2}
        leg={leg}
        leg2={leg2}
      />
    </div>
  );
}

/* ---------------------------------------------------------
   EXERCISE CARD FIGURE + PLAY/PAUSE
--------------------------------------------------------- */

export function ExercisePosePair3D({ exercise, size = 72 }) {
  const {
    pose = {},
    highlight = [],
    title = "Exercise",
    muscle = "",
  } = exercise || {};

  const [playing, setPlaying] = useState(true);
  const [reps, setReps] = useState(0);

  const angles = usePoseAnimation(pose, playing);

  useEffect(() => {
    if (!playing) return undefined;

    const timer = setInterval(() => {
      setReps((r) => r + 1);
    }, 2200);

    return () => clearInterval(timer);
  }, [playing]);

  return (
    <div
      className="exerciseFigurePair"
      style={{
        width: "100%",
        height: "100%",
        minHeight: size,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ExerciseSVG
        highlight={highlight}
        arm={angles.arm}
        arm2={angles.arm2}
        leg={angles.leg}
        leg2={angles.leg2}
        animated
      />

      <Equipment category={muscle} />

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
    </div>
  );
}

/* ---------------------------------------------------------
   LARGE FORM GUIDE VIEWER
--------------------------------------------------------- */

export function ExerciseFigure3DViewer({ exercise, size = 280 }) {
  const {
    pose = {},
    highlight = [],
    muscle = "",
  } = exercise || {};

  const [playing, setPlaying] = useState(true);

  const angles = usePoseAnimation(pose, playing);

  return (
    <div className="exercise3DViewer">
      <div
        style={{
          height: size,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ExerciseSVG
          highlight={highlight}
          arm={angles.arm}
          arm2={angles.arm2}
          leg={angles.leg}
          leg2={angles.leg2}
          animated
        />

        <Equipment category={muscle} />

        <button
          type="button"
          className={playing ? "poseAnimToggle poseAnimToggleOn" : "poseAnimToggle"}
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause animation" : "Play animation"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
      </div>
    </div>
  );
}

export default ExerciseFigure3D;