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
    { name: "Cable Flyes", motion: "fly", steps: [
      { label: "Setup", text: "Stand between the cables, slight forward lean." },
      { label: "Execution", text: "Bring handles together in front of your chest in a wide arc." },
      { label: "Return", text: "Return slowly to the start position with control." },
    ]},
    { name: "Chest Press", motion: "press", steps: [
      { label: "Setup", text: "Sit back against the pad, grip handles at chest height." },
      { label: "Execution", text: "Press forward until arms extend." },
      { label: "Return", text: "Return slowly without locking elbows." },
    ]},
    { name: "Machine Fly", motion: "fly", steps: [
      { label: "Setup", text: "Sit tall, elbows slightly bent on the pads." },
      { label: "Execution", text: "Bring arms together in front of your chest, squeeze." },
      { label: "Return", text: "Open back out slowly." },
    ]},
    { name: "Smith Bench", motion: "press", steps: [
      { label: "Setup", text: "Lie on the bench under the bar and unrack it." },
      { label: "Execution", text: "Lower to mid-chest." },
      { label: "Return", text: "Press up until arms are extended." },
    ]},
  ]},
  { name: "Shoulders", exercises: [
    { name: "Lateral Raises", motion: "raise", steps: [
      { label: "Setup", text: "Hold handles at your sides." },
      { label: "Execution", text: "Raise arms out to shoulder height with a slight elbow bend." },
      { label: "Return", text: "Lower slowly back to your sides." },
    ]},
    { name: "Shoulder Press", motion: "press", steps: [
      { label: "Setup", text: "Sit upright, handles at shoulder height." },
      { label: "Execution", text: "Press straight up until arms extend." },
      { label: "Return", text: "Lower back to start." },
    ]},
    { name: "Reverse Pec Deck", motion: "reverseFly", steps: [
      { label: "Setup", text: "Face the pad, grip handles in front of you." },
      { label: "Execution", text: "Pull arms back and out, squeezing shoulder blades." },
      { label: "Return", text: "Return slowly to start." },
    ]},
    { name: "Smith Press", motion: "press", steps: [
      { label: "Setup", text: "Sit under the bar, grip slightly wider than shoulders." },
      { label: "Execution", text: "Press up until arms extend." },
      { label: "Return", text: "Lower to shoulder height." },
    ]},
  ]},
  { name: "Back", exercises: [
    { name: "Lat Pulldown", motion: "pulldown", steps: [
      { label: "Setup", text: "Sit with thighs locked under the pad." },
      { label: "Execution", text: "Pull the bar down to your upper chest, squeezing your shoulder blades." },
      { label: "Return", text: "Control it back up." },
    ]},
    { name: "Seated Row", motion: "row", steps: [
      { label: "Setup", text: "Sit with knees slightly bent, grip the handle." },
      { label: "Execution", text: "Pull toward your torso, elbows close." },
      { label: "Return", text: "Extend arms back out." },
    ]},
    { name: "Face Pulls", motion: "row", steps: [
      { label: "Setup", text: "Set the cable at face height." },
      { label: "Execution", text: "Pull the rope toward your face, elbows high." },
      { label: "Return", text: "Return slowly." },
    ]},
    { name: "Close Grip Pulldown", motion: "pulldown", steps: [
      { label: "Setup", text: "Use a close, narrow grip on the bar." },
      { label: "Execution", text: "Pull the bar down to your chest." },
      { label: "Return", text: "Extend back up under control." },
    ]},
  ]},
  { name: "Legs", exercises: [
    { name: "Leg Press", motion: "legPress", steps: [
      { label: "Setup", text: "Sit in the machine, feet shoulder-width on the platform." },
      { label: "Execution", text: "Lower until knees reach 90°." },
      { label: "Return", text: "Press back up without locking knees." },
    ]},
    { name: "Quad Extensions", motion: "extend", steps: [
      { label: "Setup", text: "Sit with shin pad above your ankles." },
      { label: "Execution", text: "Extend legs until straight, squeeze." },
      { label: "Return", text: "Lower slowly." },
    ]},
    { name: "Hammy Curls", motion: "legCurl", steps: [
      { label: "Setup", text: "Lie face down, pad behind your ankles." },
      { label: "Execution", text: "Curl legs up toward your glutes." },
      { label: "Return", text: "Lower with control." },
    ]},
    { name: "Smith Calf Raises", motion: "calf", steps: [
      { label: "Setup", text: "Stand with the bar on your shoulders, balls of feet on a raised platform." },
      { label: "Execution", text: "Rise onto your toes." },
      { label: "Return", text: "Lower slowly below level." },
    ]},
  ]},
  { name: "Arms & Abs", exercises: [
    { name: "Preacher Curl", motion: "curl", steps: [
      { label: "Setup", text: "Rest your arms on the angled pad." },
      { label: "Execution", text: "Curl the bar up towards your shoulders, squeezing at the top." },
      { label: "Return", text: "Lower slowly without locking out." },
    ]},
    { name: "Tricep Pushdown", motion: "pushdown", steps: [
      { label: "Setup", text: "Stand facing the cable machine, elbows tucked to your sides." },
      { label: "Execution", text: "Push the bar down until arms are straight." },
      { label: "Return", text: "Return slowly to start." },
    ]},
    { name: "Cable Crunch", motion: "crunch", steps: [
      { label: "Setup", text: "Kneel below the cable, rope behind your head." },
      { label: "Execution", text: "Crunch down, bringing elbows toward your knees." },
      { label: "Return", text: "Return slowly with control." },
    ]},
    { name: "Treadmill", motion: "walk", steps: [
      { label: "Setup", text: "Start at a light walking pace to warm up." },
      { label: "Execution", text: "Increase speed gradually." },
      { label: "Return", text: "Keep posture upright, cool down at the end." },
    ]},
  ]},
];
const MACHINE_ART = {
  press: (
    <>
      <rect x="95" y="20" width="8" height="110" className="mFrame" />
      <line x1="20" y1="70" x2="95" y2="70" className="mFrame" />
      <circle cx="50" cy="45" r="12" className="pHead" />
      <path d="M50 57 L50 100" className="pBody" />
      <path d="M50 65 L25 55" className="pBody" />
      <path d="M50 65 L75 55" className="pBody" />
      <path d="M50 100 L35 135" className="pBody" />
      <path d="M50 100 L65 135" className="pBody" />
      <rect x="98" y="35" width="10" height="14" className="mWeight" />
      <rect x="98" y="52" width="10" height="14" className="mWeight" />
    </>
  ),
  fly: (
    <>
      <path d="M18 70 Q50 40 82 70" className="mFrame" fill="none" />
      <circle cx="50" cy="45" r="12" className="pHead" />
      <path d="M50 57 L50 100" className="pBody" />
      <path d="M50 62 Q30 68 22 68" className="pBody" fill="none" />
      <path d="M50 62 Q70 68 78 68" className="pBody" fill="none" />
      <path d="M50 100 L35 135" className="pBody" />
      <path d="M50 100 L65 135" className="pBody" />
      <rect x="8" y="60" width="10" height="16" className="mWeight" />
      <rect x="82" y="60" width="10" height="16" className="mWeight" />
    </>
  ),
  reverseFly: (
    <>
      <path d="M18 55 Q50 85 82 55" className="mFrame" fill="none" />
      <circle cx="50" cy="45" r="12" className="pHead" />
      <path d="M50 57 L50 100" className="pBody" />
      <path d="M50 60 Q30 50 22 48" className="pBody" fill="none" />
      <path d="M50 60 Q70 50 78 48" className="pBody" fill="none" />
      <path d="M50 100 L35 135" className="pBody" />
      <path d="M50 100 L65 135" className="pBody" />
      <rect x="8" y="42" width="10" height="16" className="mWeight" />
      <rect x="82" y="42" width="10" height="16" className="mWeight" />
    </>
  ),
  raise: (
    <>
      <line x1="50" y1="130" x2="50" y2="30" className="mFrame" />
      <circle cx="50" cy="45" r="12" className="pHead" />
      <path d="M50 57 L50 100" className="pBody" />
      <path d="M50 65 L20 55" className="pBody" />
      <path d="M50 65 L80 55" className="pBody" />
      <path d="M50 100 L38 135" className="pBody" />
      <path d="M50 100 L62 135" className="pBody" />
      <rect x="15" y="48" width="8" height="12" className="mWeight" />
      <rect x="77" y="48" width="8" height="12" className="mWeight" />
    </>
  ),
  pulldown: (
    <>
      <line x1="50" y1="15" x2="50" y2="130" className="mFrame" />
      <circle cx="50" cy="15" r="4" className="mFrame" fill="none" />
      <path d="M25 25 L75 25" className="mFrame" />
      <circle cx="50" cy="55" r="12" className="pHead" />
      <path d="M50 67 L50 105" className="pBody" />
      <path d="M50 72 L25 28" className="pBody" />
      <path d="M50 72 L75 28" className="pBody" />
      <path d="M50 105 L38 135" className="pBody" />
      <path d="M50 105 L62 135" className="pBody" />
      <rect x="95" y="20" width="8" height="90" className="mWeight" />
    </>
  ),
  row: (
    <>
      <rect x="20" y="70" width="65" height="6" className="mFrame" />
      <circle cx="65" cy="45" r="12" className="pHead" />
      <path d="M65 57 L60 100" className="pBody" />
      <path d="M60 68 L30 72" className="pBody" />
      <path d="M60 100 L48 135" className="pBody" />
      <path d="M60 100 L72 135" className="pBody" />
      <rect x="8" y="65" width="10" height="14" className="mWeight" />
    </>
  ),
  curl: (
    <>
      <path d="M25 100 L75 100" className="mFrame" />
      <path d="M40 100 L40 65" className="mFrame" />
      <circle cx="50" cy="45" r="12" className="pHead" />
      <path d="M50 57 L50 95" className="pBody" />
      <path d="M50 70 L38 68" className="pBody" />
      <path d="M50 70 L62 68" className="pBody" />
      <path d="M50 95 L40 135" className="pBody" />
      <path d="M50 95 L60 135" className="pBody" />
      <rect x="35" y="60" width="10" height="10" className="mWeight" />
    </>
  ),
  pushdown: (
    <>
      <line x1="50" y1="10" x2="50" y2="60" className="mFrame" />
      <circle cx="50" cy="10" r="4" className="mFrame" fill="none" />
      <circle cx="50" cy="45" r="12" className="pHead" />
      <path d="M50 57 L50 100" className="pBody" />
      <path d="M50 62 L38 80" className="pBody" />
      <path d="M50 62 L62 80" className="pBody" />
      <path d="M50 100 L38 135" className="pBody" />
      <path d="M50 100 L62 135" className="pBody" />
      <rect x="95" y="20" width="8" height="60" className="mWeight" />
    </>
  ),
  legPress: (
    <>
      <path d="M20 130 L85 90" className="mFrame" />
      <circle cx="35" cy="105" r="12" className="pHead" />
      <path d="M40 113 L55 118" className="pBody" />
      <path d="M55 118 L75 100" className="pBody" />
      <path d="M55 118 L60 130" className="pBody" />
      <rect x="80" y="70" width="10" height="20" className="mWeight" />
    </>
  ),
  extend: (
    <>
      <path d="M25 60 L25 130" className="mFrame" />
      <circle cx="30" cy="45" r="12" className="pHead" />
      <path d="M30 57 L32 95" className="pBody" />
      <path d="M32 95 L28 130" className="pBody" />
      <path d="M32 95 L70 105" className="pBody" />
      <rect x="70" y="98" width="10" height="12" className="mWeight" />
    </>
  ),
  legCurl: (
    <>
      <path d="M20 90 L90 90" className="mFrame" />
      <circle cx="35" cy="80" r="12" className="pHead" />
      <path d="M40 88 L75 90" className="pBody" />
      <path d="M75 90 L60 65" className="pBody" />
      <rect x="8" y="83" width="10" height="12" className="mWeight" />
    </>
  ),
  calf: (
    <>
      <rect x="30" y="120" width="45" height="10" className="mFrame" />
      <line x1="45" y1="30" x2="45" y2="120" className="mFrame" />
      <circle cx="50" cy="45" r="12" className="pHead" />
      <path d="M50 57 L50 100" className="pBody" />
      <path d="M50 62 L30 55" className="pBody" />
      <path d="M50 62 L70 55" className="pBody" />
      <path d="M50 100 L42 122" className="pBody" />
      <path d="M50 100 L58 122" className="pBody" />
    </>
  ),
  crunch: (
    <>
      <line x1="50" y1="15" x2="50" y2="55" className="mFrame" />
      <circle cx="50" cy="70" r="12" className="pHead" />
      <path d="M55 80 Q65 100 55 115" className="pBody" fill="none" />
      <path d="M55 82 L48 55" className="pBody" />
      <path d="M55 115 L40 125" className="pBody" />
      <path d="M55 115 L70 130" className="pBody" />
    </>
  ),
  walk: (
    <>
      <rect x="15" y="120" width="90" height="8" className="mFrame" />
      <line x1="60" y1="120" x2="80" y2="60" className="mFrame" />
      <circle cx="55" cy="45" r="12" className="pHead" />
      <path d="M55 57 L55 95" className="pBody" />
      <path d="M55 65 L40 75" className="pBody" />
      <path d="M55 65 L70 55" className="pBody" />
      <path d="M55 95 L40 120" className="pBody" />
      <path d="M55 95 L68 118" className="pBody" />
    </>
  ),
};

function StickFigure({ motion }) {
  return (
    <svg viewBox="0 0 110 140" className="exerciseArt">
      {MACHINE_ART[motion] || MACHINE_ART.press}
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
    const [expandedExercise, setExpandedExercise] = useState(null);

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
                  {cat.exercises.map((ex) => {
                    const isOpen = expandedExercise === ex.name;
                    return (
                      <div
                        className={`exerciseCard ${isOpen ? "exerciseCardOpen" : ""}`}
                        key={ex.name}
                        onClick={() =>
                          setExpandedExercise(isOpen ? null : ex.name)
                        }
                      >
                        <div className="exerciseFigureWrap">
                          <StickFigure motion={ex.motion} />
                        </div>
                        <div className="exerciseInfo">
                          <span className="exerciseMuscle">{cat.name.toUpperCase()}</span>
                          <h3>{ex.name}</h3>
                          <span className="tapHint">
                            {isOpen ? "Tap to close ▲" : "Tap for steps ▼"}
                          </span>
                        </div>

                        {isOpen && (
                          <div className="exerciseSteps">
                            {ex.steps.map((step, i) => (
                              <div className="stepItem" key={step.label}>
                                <div className="stepArtWrap">
                                  <StickFigure motion={ex.motion} />
                                </div>
                                <div className="stepText">
                                  <span className="stepNumber">
                                    {i + 1}. {step.label}
                                  </span>
                                  <p>{step.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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