import { useEffect, useMemo, useState } from "react";
import "./App.css";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const WORKOUTS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Abs",
  "Cardio",
  "Rest",
];

const FOOD = {
  rice: { calories: 130, protein: 2.7, carbs: 28 },
  roti: { calories: 297, protein: 9, carbs: 46 },
  chicken: { calories: 239, protein: 27, carbs: 0 },
  egg: { calories: 155, protein: 13, carbs: 1.1 },
  paneer: { calories: 265, protein: 18, carbs: 6 },
  milk: { calories: 61, protein: 3.2, carbs: 4.8 },
  oats: { calories: 389, protein: 17, carbs: 66 },
  banana: { calories: 89, protein: 1.1, carbs: 23 },
  dal: { calories: 116, protein: 9, carbs: 20 },
  potato: { calories: 77, protein: 2, carbs: 17 },
  bread: { calories: 265, protein: 9, carbs: 49 },
  curd: { calories: 61, protein: 3.5, carbs: 4.7 },
};
const EXERCISE_CATEGORIES = [
  { name: "Chest", exercises: [
    { name: "Cable Flyes", motion: "fly", instructions: "Stand between the cables, slight forward lean. Bring handles together in front of your chest in a wide arc, then return slowly with control." },
    { name: "Chest Press", motion: "press", instructions: "Sit back against the pad, grip handles at chest height. Press forward until arms extend, then return slowly without locking elbows." },
    { name: "Machine Fly", motion: "fly", instructions: "Sit tall, elbows slightly bent on the pads. Bring arms together in front of your chest, squeeze, then open back out slowly." },
    { name: "Smith Bench", motion: "press", instructions: "Lie on the bench under the bar. Unrack, lower to mid-chest, then press up until arms are extended." },
  ]},
  { name: "Shoulders", exercises: [
    { name: "Lateral Raises", motion: "raise", instructions: "Hold handles at your sides. Raise arms out to shoulder height with a slight elbow bend, then lower slowly." },
    { name: "Shoulder Press", motion: "press", instructions: "Sit upright, handles at shoulder height. Press straight up until arms extend, then lower back to start." },
    { name: "Reverse Pec Deck", motion: "reverseFly", instructions: "Face the pad, grip handles in front of you. Pull arms back and out, squeezing shoulder blades, then return slowly." },
    { name: "Smith Press", motion: "press", instructions: "Sit under the bar, grip slightly wider than shoulders. Press up until arms extend, then lower to shoulder height." },
  ]},
  { name: "Back", exercises: [
    { name: "Lat Pulldown", motion: "pulldown", instructions: "Sit with thighs locked under the pad. Pull the bar down to your upper chest, squeezing your shoulder blades, then control it back up." },
    { name: "Seated Row", motion: "row", instructions: "Sit with knees slightly bent, grip the handle. Pull toward your torso, elbows close, then extend arms back out." },
    { name: "Face Pulls", motion: "row", instructions: "Set the cable at face height. Pull the rope toward your face, elbows high, then return slowly." },
    { name: "Close Grip Pulldown", motion: "pulldown", instructions: "Use a close, narrow grip. Pull the bar down to your chest, then extend back up under control." },
  ]},
  { name: "Legs", exercises: [
    { name: "Leg Press", motion: "legPress", instructions: "Sit in the machine, feet shoulder-width on the platform. Lower until knees reach 90°, then press back up without locking knees." },
    { name: "Quad Extensions", motion: "extend", instructions: "Sit with shin pad above your ankles. Extend legs until straight, squeeze, then lower slowly." },
    { name: "Hammy Curls", motion: "legCurl", instructions: "Lie face down, pad behind your ankles. Curl legs up toward your glutes, then lower with control." },
    { name: "Smith Calf Raises", motion: "calf", instructions: "Stand with the bar on your shoulders, balls of feet on a raised platform. Rise onto your toes, then lower slowly below level." },
  ]},
  { name: "Arms & Abs", exercises: [
    { name: "Preacher Curl", motion: "curl", instructions: "Rest your arms on the angled pad. Curl the bar up towards your shoulders, squeezing at the top, then lower slowly without locking out." },
    { name: "Tricep Pushdown", motion: "pushdown", instructions: "Stand facing the cable machine, elbows tucked to your sides. Push the bar down until arms are straight, then return slowly to start." },
    { name: "Cable Crunch", motion: "crunch", instructions: "Kneel below the cable, rope behind your head. Crunch down, bringing elbows toward your knees, then return slowly with control." },
    { name: "Treadmill", motion: "walk", instructions: "Start at a light walking pace to warm up, then increase speed gradually. Keep your posture upright." },
  ]},
];

const MOTION_CONFIG = {
  press:      { armL: [35, -15], armR: [-35, 15], dur: 1.3 },
  fly:        { armL: [70, 10],  armR: [-70, -10], dur: 1.4 },
  reverseFly: { armL: [70, 10],  armR: [-70, -10], dur: 1.4 },
  raise:      { armL: [15, 80],  armR: [-15, -80], dur: 1.3 },
  pulldown:   { armL: [80, 20],  armR: [-80, -20], dur: 1.3 },
  row:        { armL: [80, 20],  armR: [-80, -20], dur: 1.3 },
  curl:       { armL: [50, 0],   armR: [-50, 0],   dur: 1.2 },
  pushdown:   { armL: [50, 0],   armR: [-50, 0],   dur: 1.2 },
  legPress:   { legL: [20, -10], legR: [-20, 10],  dur: 1.3 },
  extend:     { legL: [20, -10], legR: [-20, 10],  dur: 1.3 },
  legCurl:    { legL: [20, -10], legR: [-20, 10],  dur: 1.3 },
  calf:       { bob: true, dur: 1.1 },
  crunch:     { spine: [0, 15], dur: 1.2 },
  walk:       { legL: [20, -20], legR: [-20, 20], dur: 0.8 },
};

function StickFigure({ motion }) {
  const cfg = MOTION_CONFIG[motion] || {};
  const dur = `${cfg.dur || 1.3}s`;
  const armVals = (r) => `${r[0]} 50 38; ${r[1]} 50 38; ${r[0]} 50 38`;
  const legVals = (r) => `${r[0]} 50 80; ${r[1]} 50 80; ${r[0]} 50 80`;

  return (
    <svg viewBox="0 0 100 140" className="stickFigure">
      <g>
        {cfg.bob && (
          <animateTransform attributeName="transform" type="translate"
            values="0 0;0 -6;0 0" dur={dur} repeatCount="indefinite" />
        )}
        <g>
          {cfg.spine && (
            <animateTransform attributeName="transform" type="rotate"
              values={`${cfg.spine[0]} 50 80;${cfg.spine[1]} 50 80;${cfg.spine[0]} 50 80`}
              dur={dur} repeatCount="indefinite" />
          )}
          <line className="sfSpine" x1="50" y1="30" x2="50" y2="80" />
        </g>
        <g>
          {cfg.legL && (
            <animateTransform attributeName="transform" type="rotate"
              values={legVals(cfg.legL)} dur={dur} repeatCount="indefinite" />
          )}
          <line className="sfLegL" x1="50" y1="80" x2="35" y2="125" />
        </g>
        <g>
          {cfg.legR && (
            <animateTransform attributeName="transform" type="rotate"
              values={legVals(cfg.legR)} dur={dur} repeatCount="indefinite" />
          )}
          <line className="sfLegR" x1="50" y1="80" x2="65" y2="125" />
        </g>
        <g>
          {cfg.armL && (
            <animateTransform attributeName="transform" type="rotate"
              values={armVals(cfg.armL)} dur={dur} repeatCount="indefinite" />
          )}
          <line className="sfArmL" x1="50" y1="38" x2="25" y2="55" />
        </g>
        <g>
          {cfg.armR && (
            <animateTransform attributeName="transform" type="rotate"
              values={armVals(cfg.armR)} dur={dur} repeatCount="indefinite" />
          )}
          <line className="sfArmR" x1="50" y1="38" x2="75" y2="55" />
        </g>
        <circle className="sfHead" cx="50" cy="18" r="11" />
      </g>
    </svg>
  );
}

const createSplit = () =>
  DAYS.map((_, index) => ({
    day: index + 1,
    workouts: [],
  }));
  const API_URL = "https://fitmealai-production.up.railway.app";

function App() {
  const [page, setPage] = useState("dashboard");

  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [split, setSplit] = useState(createSplit());
  const [setup, setSetup] = useState(false);

  const [meal, setMeal] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [meals, setMeals] = useState([]);

  const [reminders, setReminders] = useState(true);

  // DARK MODE BY DEFAULT
  const [darkMode, setDarkMode] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const handleLogin = async () => {
    setAuthError("");
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setName(data.name);
      setWeight(data.weight);
      setSetup(true);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleRegister = async () => {
    setAuthError("");
    if (!name || !registerEmail || !registerPassword || !weight) {
      setAuthError("All fields are required.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: registerEmail, password: registerPassword, weight: Number(weight) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed");
      localStorage.setItem("token", data.token);
      setToken(data.token);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setSetup(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem("fitmealApp");

    if (saved) {
      const data = JSON.parse(saved);

      setName(data.name || "");
      setWeight(data.weight || "");
      setSplit(data.split || createSplit());
      setMeals(data.meals || []);
      setSetup(data.setup || false);
      setReminders(data.reminders ?? true);
      setDarkMode(data.darkMode ?? true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "fitmealApp",
      JSON.stringify({
        name,
        weight,
        split,
        meals,
        setup,
        reminders,
        darkMode,
      })
    );
  }, [
    name,
    weight,
    split,
    meals,
    setup,
    reminders,
    darkMode,
  ]);

  const todayIndex = new Date().getDay();
  const todayName = DAYS[todayIndex];

  const today = split.find(
    (item) => item.day === todayIndex + 1
  );

  const tomorrowIndex = (todayIndex + 1) % 7;

  const tomorrow = split.find(
    (item) => item.day === tomorrowIndex + 1
  );

  const totals = useMemo(
    () =>
      meals.reduce(
        (total, item) => ({
          calories: total.calories + item.calories,
          protein: total.protein + item.protein,
          carbs: total.carbs + item.carbs,
        }),
        {
          calories: 0,
          protein: 0,
          carbs: 0,
        }
      ),
    [meals]
  );

  const toggleWorkout = (day, workout) => {
    setSplit((old) =>
      old.map((item) => {
        if (item.day !== day) return item;

        const exists = item.workouts.includes(workout);

        return {
          ...item,
          workouts: exists
            ? item.workouts.filter((w) => w !== workout)
            : [...item.workouts, workout],
        };
      })
    );
  };

  const addMeal = () => {
    const key = meal.toLowerCase().trim();

    if (!FOOD[key]) {
      alert(
        "Food not found. Try rice, roti, chicken, egg, paneer, milk, oats, banana, dal, potato, bread or curd."
      );
      return;
    }

    const data = FOOD[key];
    const multiplier = Number(quantity) / 100;

    const newMeal = {
      id: Date.now(),
      name: meal,
      quantity: Number(quantity),
      calories: Math.round(data.calories * multiplier),
      protein: Number(
        (data.protein * multiplier).toFixed(1)
      ),
      carbs: Number(
        (data.carbs * multiplier).toFixed(1)
      ),
    };

    setMeals([...meals, newMeal]);
    setMeal("");
    setQuantity(100);
  };

  const removeMeal = (id) => {
    setMeals(meals.filter((item) => item.id !== id));
  };

  const saveSetup = () => {
    if (!name || !weight) {
      alert("Please enter your name and weight.");
      return;
    }
    setSetup(true);
    setPage("dashboard");
  };


  const enableNotification = async () => {
    if (!("Notification" in window)) {
      alert("Notifications are not supported.");
      return;
    }

    const permission =
      await Notification.requestPermission();

    if (permission === "granted") {
      new Notification("FitMeal AI", {
        body:
          "Check today's workout, meals and recovery plan.",
      });
    }
  };

  const resetApp = () => {
    if (confirm("Reset all FitMeal AI data?")) {
      localStorage.removeItem("fitmealApp");

      setName("");
      setWeight("");
      setSplit(createSplit());
      setMeals([]);
      setSetup(false);
      setPage("dashboard");
      setDarkMode(true);
    }
  };

  /* ================= SETUP ================= */
  if (!token) {
    return (
      <div className={darkMode ? "setupScreen dark" : "setupScreen light"}>
        <div className="setupCard">
          <div className="logoBig">F</div>
          <h1>FitMeal AI</h1>
          <p>{authMode === "login" ? "Log in to your account." : "Create your account."}</p>

          {authMode === "register" && (
            <>
              <input placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
              <input type="number" placeholder="Weight in kg" value={weight} onChange={(e) => setWeight(e.target.value)} />
              <input placeholder="Email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} />
              <input type="password" placeholder="Password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} />
              {authError && <p style={{ color: "red" }}>{authError}</p>}
              <button className="mainButton" onClick={handleRegister}>Sign Up</button>
              <p className="muted">Already have an account?{" "}
                <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => { setAuthMode("login"); setAuthError(""); }}>Log In</span>
              </p>
            </>
          )}

          {authMode === "login" && (
            <>
              <input placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
              <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              {authError && <p style={{ color: "red" }}>{authError}</p>}
              <button className="mainButton" onClick={handleLogin}>Log In</button>
              <p className="muted">New here?{" "}
                <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => { setAuthMode("register"); setAuthError(""); }}>Sign Up</span>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }
  if (!setup) {
    return (
      <div
        className={
          darkMode
            ? "setupScreen dark"
            : "setupScreen light"
        }
      >
        <div className="setupCard">

          <div className="logoBig">F</div>

          <h1>FitMeal AI</h1>

          <p>
            Your personalized fitness and meal
            planning assistant.
          </p>

          <input
            placeholder="Enter your name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <input
            type="number"
            placeholder="Weight in kg"
            value={weight}
            onChange={(e) =>
              setWeight(e.target.value)
            }
          />

          <h2>Set Your Weekly Workout Split</h2>

          <p className="muted">
            Select multiple workouts for each day.
          </p>

          {split.map((day) => (
            <div className="setupDay" key={day.day}>

              <strong>
                {DAYS[day.day - 1]}
              </strong>

              <div className="checkGrid">

                {WORKOUTS.map((workout) => (

                  <label key={workout}>

                    <input
                      type="checkbox"
                      checked={day.workouts.includes(
                        workout
                      )}
                      onChange={() =>
                        toggleWorkout(
                          day.day,
                          workout
                        )
                      }
                    />

                    {workout}

                  </label>

                ))}

              </div>

            </div>
          ))}

          <button
            className="mainButton"
            onClick={saveSetup}
          >
            Create My Plan
          </button>

        </div>
      </div>
    );
  }

  /* ================= MAIN APP ================= */

  return (
    <div
      className={
        darkMode
          ? "appShell dark"
          : "appShell light"
      }
    >

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">

          <div className="logo">
            F
          </div>

          <div>
            <h2>FitMeal</h2>
            <span>AI Planner</span>
          </div>

        </div>

        <nav>

          <button
            className={
              page === "dashboard"
                ? "selected"
                : ""
            }
            onClick={() =>
              setPage("dashboard")
            }
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={
              page === "workout"
                ? "selected"
                : ""
            }
            onClick={() =>
              setPage("workout")
            }
          >
            <span>●</span>
            Workout
          </button>

          <button
            className={
              page === "nutrition"
                ? "selected"
                : ""
            }
            onClick={() =>
              setPage("nutrition")
            }
          >
            <span>◈</span>
            Nutrition
          </button>

          <button
            className={
              page === "planner"
                ? "selected"
                : ""
            }
            onClick={() =>
              setPage("planner")
            }
          >
            <span>□</span>
            Meal Planner
          </button>

          <button
            className={
              page === "progress"
                ? "selected"
                : ""
            }
            onClick={() =>
              setPage("progress")
            }
          >
            <span>↗</span>
            Progress
          </button>

                          <button className={page === "exercises" ? "selected" : ""} onClick={() => setPage("exercises")}>
            <span>▲</span> Exercises
          </button>
          <button className={page === "profile" ? "selected" : ""} onClick={() => setPage("profile")}>
            <span>○</span> Profile
          </button>
        </nav>

        <div className="sidebarBottom">

          <button
            onClick={enableNotification}
          >
            🔔 Notifications
          </button>

          {/* THEME TOGGLE */}

          <button
            className="themeButton"
            onClick={() =>
              setDarkMode(!darkMode)
            }
          >
            {darkMode
              ? "☀ Light Mode"
              : "☾ Dark Mode"}
          </button>

        </div>

      </aside>

      {/* MAIN */}

      <main className="main">

        <header className="topbar">

          <div>

            <p className="smallTitle">
              FITNESS DASHBOARD
            </p>

           <h1>
  {page === "dashboard"
    ? `Welcome back, ${name}`
    : page === "workout"
    ? "Workout"
    : page === "nutrition"
    ? "Nutrition"
    : page === "planner"
    ? "Meal Planner"
    : page === "progress"
    ? "Progress"
    : page === "exercises"
    ? "Exercises"
    : "Profile"}
</h1>

          </div>

          <div className="profileMini">

            <div className="avatar">
              {name.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{name}</strong>
              <span>{weight} kg</span>
            </div>

          </div>

        </header>

        {/* ================= DASHBOARD ================= */}

        {page === "dashboard" && (
          <>

            <div className="hero">

              <div>

                <p>
                  Today • {todayName}
                </p>

                <h2>
                  {today?.workouts.length
                    ? today.workouts.join(" + ")
                    : "Rest Day"}
                </h2>

                <p>
                  Follow your saved workout split
                  and stay consistent today.
                </p>

              </div>

              <div className="heroDay">

                DAY

                <strong>
                  {todayIndex + 1}
                </strong>

                OF 7

              </div>

            </div>

            <div className="stats">

              <div className="stat">
                <span>Calories</span>
                <strong>
                  {Math.round(
                    totals.calories
                  )}
                </strong>
                <small>
                  kcal today
                </small>
              </div>

              <div className="stat">
                <span>Protein</span>
                <strong>
                  {totals.protein.toFixed(1)}g
                </strong>
                <small>
                  consumed
                </small>
              </div>

              <div className="stat">
                <span>Carbs</span>
                <strong>
                  {totals.carbs.toFixed(1)}g
                </strong>
                <small>
                  consumed
                </small>
              </div>

              <div className="stat">
                <span>Body Weight</span>
                <strong>
                  {weight}
                </strong>
                <small>
                  kg
                </small>
              </div>

            </div>

            <div className="twoColumn">

              <section className="panel">

                <div className="panelHeader">

                  <h2>
                    Today's Workout
                  </h2>

                  <button
                    className="textButton"
                    onClick={() =>
                      setPage("workout")
                    }
                  >
                    View Plan →
                  </button>

                </div>

                <div className="todayWorkout">

                  {today?.workouts.length ? (
                    today.workouts.map(
                      (workout) => (
                        <div
                          className="workoutChip"
                          key={workout}
                        >
                          {workout}
                        </div>
                      )
                    )
                  ) : (
                    <p>
                      Rest and recovery today.
                    </p>
                  )}

                </div>

              </section>

              <section className="panel">

                <div className="panelHeader">

                  <h2>
                    Tomorrow
                  </h2>

                  <span className="badge">
                    NEXT
                  </span>

                </div>

                <div className="tomorrowCard">

                  <strong>
                    Day {tomorrowIndex + 1}
                  </strong>

                  <h3>
                    {tomorrow?.workouts.length
                      ? tomorrow.workouts.join(
                          " + "
                        )
                      : "Rest Day"}
                  </h3>

                  <select
                    value={
                      tomorrow?.workouts[0] ||
                      "Rest"
                    }
                    onChange={(e) => {

                      const selected =
                        e.target.value;

                      setSplit((old) =>
                        old.map((item) =>
                          item.day ===
                          tomorrowIndex + 1
                            ? {
                                ...item,
                                workouts:
                                  selected ===
                                  "Rest"
                                    ? ["Rest"]
                                    : [selected],
                              }
                            : item
                        )
                      );

                    }}
                  >

                    {WORKOUTS.map(
                      (workout) => (
                        <option
                          key={workout}
                          value={workout}
                        >
                          {workout}
                        </option>
                      )
                    )}

                  </select>

                </div>

              </section>

            </div>

            <section className="panel">

              <div className="panelHeader">

                <h2>
                  Quick Meal Entry
                </h2>

                <button
                  className="textButton"
                  onClick={() =>
                    setPage("nutrition")
                  }
                >
                  Full Nutrition →
                </button>

              </div>

              <div className="quickMeal">

                <input
                  value={meal}
                  onChange={(e) =>
                    setMeal(e.target.value)
                  }
                  placeholder="What did you eat? e.g. chicken"
                />

                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(e.target.value)
                  }
                  placeholder="grams"
                />

                <button
                  onClick={addMeal}
                >
                  Add Meal
                </button>

              </div>

            </section>

          </>
        )}

        {/* ================= WORKOUT ================= */}

        {page === "workout" && (
          <>

            <section className="pageIntro">

              <p>
                YOUR WEEKLY ROUTINE
              </p>

              <h2>
                Workout Schedule
              </h2>

              <span>
                Select multiple muscle groups
                for each day.
              </span>

            </section>

            <div className="workoutSchedule">

              {split.map((day) => (

                <div
                  className={`workoutDay ${
                    day.day ===
                    todayIndex + 1
                      ? "current"
                      : ""
                  }`}
                  key={day.day}
                >

                  <div className="dayTitle">

                    <div>

                      <span>
                        DAY {day.day}
                      </span>

                      <h3>
                        {DAYS[day.day - 1]}
                      </h3>

                    </div>

                    {day.day ===
                      todayIndex + 1 && (
                      <b>
                        TODAY
                      </b>
                    )}

                  </div>

                  <div className="workoutOptions">

                    {WORKOUTS.map(
                      (workout) => (

                        <label
                          className={
                            day.workouts.includes(
                              workout
                            )
                              ? "workoutSelected"
                              : ""
                          }
                          key={workout}
                        >

                          <input
                            type="checkbox"
                            checked={day.workouts.includes(
                              workout
                            )}
                            onChange={() =>
                              toggleWorkout(
                                day.day,
                                workout
                              )
                            }
                          />

                          {workout}

                        </label>

                      )
                    )}

                  </div>

                </div>

              ))}

            </div>

          </>
        )}

        {/* ================= NUTRITION ================= */}

        {page === "nutrition" && (
          <>

            <section className="pageIntro">

              <p>
                DAILY NUTRITION
              </p>

              <h2>
                Track What You Eat
              </h2>

              <span>
                Enter your food and the app
                calculates nutrition automatically.
              </span>

            </section>

            <div className="nutritionLarge">

              <div>
                <span>CALORIES</span>

                <strong>
                  {Math.round(
                    totals.calories
                  )}
                </strong>

                <small>
                  kcal
                </small>
              </div>

              <div>
                <span>PROTEIN</span>

                <strong>
                  {totals.protein.toFixed(1)}
                </strong>

                <small>
                  grams
                </small>
              </div>

              <div>
                <span>CARBS</span>

                <strong>
                  {totals.carbs.toFixed(1)}
                </strong>

                <small>
                  grams
                </small>
              </div>

            </div>

            <section className="panel">

              <h2>
                Add Food
              </h2>

              <div className="foodForm">

                <input
                  value={meal}
                  onChange={(e) =>
                    setMeal(e.target.value)
                  }
                  placeholder="rice / chicken / egg / oats..."
                />

                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(e.target.value)
                  }
                  placeholder="Quantity in grams"
                />

                <button
                  onClick={addMeal}
                >
                  Add Food
                </button>

              </div>

              <p className="muted">
                Available demo foods: rice,
                roti, chicken, egg, paneer,
                milk, oats, banana, dal,
                potato, bread, curd.
              </p>

            </section>

            <section className="panel">

              <h2>
                Today's Food Log
              </h2>

              {meals.length === 0 ? (
                <div className="empty">
                  No meals logged today.
                </div>
              ) : (
                meals.map((item) => (

                  <div
                    className="foodRow"
                    key={item.id}
                  >

                    <div>
                      <strong>
                        {item.name}
                      </strong>

                      <span>
                        {item.quantity}g
                      </span>
                    </div>

                    <div>
                      {item.calories} kcal
                    </div>

                    <div>
                      P {item.protein}g
                    </div>

                    <div>
                      C {item.carbs}g
                    </div>

                    <button
                      className="deleteBtn"
                      onClick={() =>
                        removeMeal(item.id)
                      }
                    >
                      Remove
                    </button>

                  </div>

                ))
              )}

            </section>

          </>
        )}

        {/* ================= PLANNER ================= */}

        {page === "planner" && (
          <>

            <section className="pageIntro">

              <p>
                PERSONALIZED MEALS
              </p>

              <h2>
                Meal Planner
              </h2>

              <span>
                Simple meal ideas around
                your workout schedule.
              </span>

            </section>

            <div className="mealCards">

              <div>
                <span>BREAKFAST</span>
                <h3>
                  Oats + Milk + Banana
                </h3>
                <p>
                  A simple carbohydrate and
                  protein-containing breakfast.
                </p>
              </div>

              <div>
                <span>LUNCH</span>
                <h3>
                  Rice + Dal + Chicken
                </h3>
                <p>
                  Balanced meal for the
                  middle of the day.
                </p>
              </div>

              <div>
                <span>PRE-WORKOUT</span>
                <h3>
                  Banana + Oats
                </h3>
                <p>
                  Convenient food before
                  training.
                </p>
              </div>

              <div>
                <span>POST-WORKOUT</span>
                <h3>
                  Chicken + Rice
                </h3>
                <p>
                  Protein and carbohydrates
                  after training.
                </p>
              </div>

              <div>
                <span>SNACK</span>
                <h3>
                  Curd + Banana
                </h3>
                <p>
                  Simple snack option.
                </p>
              </div>

              <div>
                <span>DINNER</span>
                <h3>
                  Paneer + Roti
                </h3>
                <p>
                  Easy dinner combination.
                </p>
              </div>

            </div>

            <section className="panel">

              <h2>
                Meal Timing
              </h2>

              <div className="timeline">

                <div>
                  <b>08:00 AM</b>
                  <span>Breakfast</span>
                </div>

                <div>
                  <b>11:00 AM</b>
                  <span>Snack</span>
                </div>

                <div>
                  <b>01:30 PM</b>
                  <span>Lunch</span>
                </div>

                <div>
                  <b>04:30 PM</b>
                  <span>Pre-Workout</span>
                </div>

                <div>
                  <b>07:00 PM</b>
                  <span>Post-Workout</span>
                </div>

                <div>
                  <b>09:00 PM</b>
                  <span>Dinner</span>
                </div>

              </div>

            </section>

          </>
        )}

        {/* ================= PROGRESS ================= */}

        {page === "progress" && (
          <>

            <section className="pageIntro">

              <p>
                YOUR ACTIVITY
              </p>

              <h2>
                Progress
              </h2>

              <span>
                A simple overview of your
                current activity and nutrition.
              </span>

            </section>

            <div className="progressGrid">

              <div>
                <span>
                  WORKOUT DAYS
                </span>

                <strong>
                  5 / 7
                </strong>

                <div className="progressBar">
                  <i
                    style={{
                      width: "71%",
                    }}
                  />
                </div>

              </div>

              <div>
                <span>
                  MEALS LOGGED
                </span>

                <strong>
                  {meals.length}
                </strong>

                <div className="progressBar">
                  <i
                    style={{
                      width: `${Math.min(
                        meals.length * 15,
                        100
                      )}%`,
                    }}
                  />
                </div>

              </div>

              <div>
                <span>
                  PROTEIN TODAY
                </span>

                <strong>
                  {totals.protein.toFixed(1)}g
                </strong>

                <div className="progressBar">
                  <i
                    style={{
                      width: `${Math.min(
                        totals.protein,
                        100
                      )}%`,
                    }}
                  />
                </div>

              </div>

              <div>
                <span>
                  CALORIES LOGGED
                </span>

                <strong>
                  {Math.round(
                    totals.calories
                  )}
                </strong>

                <div className="progressBar">
                  <i
                    style={{
                      width: `${Math.min(
                        totals.calories / 20,
                        100
                      )}%`,
                    }}
                  />
                </div>

              </div>

            </div>

          </>
        )}

        {/* ================= PROFILE ================= */}

        {page === "profile" && (
          <>

            <section className="pageIntro">

              <p>
                ACCOUNT
              </p>

              <h2>
                Profile & Settings
              </h2>

              <span>
                Manage your personal information,
                preferences and appearance.
              </span>

            </section>

            <section className="profileCard">

              <div className="bigAvatar">
                {name.charAt(0).toUpperCase()}
              </div>

              <h2>
                {name}
              </h2>

              <p>
                Current weight:{" "}
                <strong>
                  {weight} kg
                </strong>
              </p>

            </section>

            {/* THEME SETTINGS */}

            <section className="panel">

              <h2>
                Appearance
              </h2>

              <div className="appearanceSetting">

                <div>

                  <strong>
                    Theme
                  </strong>

                  <p>
                    Choose how FitMeal AI
                    looks on your screen.
                  </p>

                </div>

                <button
                  className="themeToggle"
                  onClick={() =>
                    setDarkMode(!darkMode)
                  }
                >

                  <span
                    className={
                      darkMode
                        ? "activeTheme"
                        : ""
                    }
                  >
                    ☾ Dark
                  </span>

                  <span
                    className={
                      !darkMode
                        ? "activeTheme"
                        : ""
                    }
                  >
                    ☀ Light
                  </span>

                </button>

              </div>

            </section>

            <section className="panel">

              <h2>
                Workout Settings
              </h2>

              <button
                onClick={() =>
                  setPage("workout")
                }
              >
                Edit Workout Split
              </button>

              <button
                className="notificationBtn"
                onClick={enableNotification}
              >
                Enable Notifications
              </button>

            </section>

            <section className="panel dangerPanel">

              <h2>
                Reset Application
              </h2>

              <p>
                This will remove your saved
                profile, workout split and
                meal history.
              </p>

              <button
                className="danger"
                onClick={resetApp}
              >
                Reset All Data
              </button>

            </section>

          </>
        )}
                {page === "exercises" && (
          <>
            <section className="pageIntro">
              <p>EXERCISE LIBRARY</p>
              <h2>Machines & Form Guide</h2>
              <span>See how to use each machine correctly, with an animated form guide.</span>
            </section>

            {EXERCISE_CATEGORIES.map((cat) => (
              <section className="panel" key={cat.name}>
                <h2>{cat.name}</h2>
                <div className="exerciseGrid">
                  {cat.exercises.map((ex) => (
                    <div className="exerciseCard" key={ex.name}>
                      <div className="exerciseFigureWrap">
                        <StickFigure motion={ex.motion} />
                      </div>
                      <div className="exerciseInfo">
                        <span className="exerciseMuscle">{cat.name.toUpperCase()}</span>
                        <h3>{ex.name}</h3>
                        <p>{ex.instructions}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </main>

    </div>
  );
}
export default App;