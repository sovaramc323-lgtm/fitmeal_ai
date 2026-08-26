import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "https://fitmealai-production.up.railway.app";

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

const EXERCISES = [
  ["Chest", "Bench Press", "🏋️", "Press the weight upward while keeping your shoulder blades stable."],
  ["Chest", "Cable Fly", "💪", "Bring the handles together slowly and squeeze the chest."],
  ["Back", "Lat Pulldown", "🔻", "Pull the bar toward your upper chest and control the return."],
  ["Back", "Seated Row", "↔️", "Pull toward your torso while keeping your spine neutral."],
  ["Shoulders", "Lateral Raise", "🪽", "Raise your arms to shoulder height with controlled movement."],
  ["Shoulders", "Shoulder Press", "⬆️", "Press overhead without arching your lower back."],
  ["Legs", "Leg Press", "🦵", "Lower the platform under control and drive through your feet."],
  ["Legs", "Leg Extension", "⚡", "Extend your knees smoothly and squeeze your quads."],
  ["Arms & Abs", "Bicep Curl", "💪", "Curl without swinging your elbows forward."],
  ["Arms & Abs", "Tricep Pushdown", "⬇️", "Keep elbows tucked and push the cable downward."],
  ["Arms & Abs", "Cable Crunch", "🔥", "Curl your torso down while keeping the movement controlled."],
  ["Cardio", "Treadmill", "🏃", "Start easy, build pace gradually and finish with a cooldown."],
];

const createSplit = () =>
  DAYS.map((_, i) => ({
    day: i + 1,
    workouts: [],
  }));

const toDateKey = (date) => date.toISOString().slice(0, 10);

const getWeekDates = () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toDateKey(d);
  });
};

function App() {
  const [page, setPage] = useState("dashboard");

  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [split, setSplit] = useState(createSplit());
  const [setup, setSetup] = useState(false);

  const [meal, setMeal] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [meals, setMeals] = useState([]);

  const [darkMode, setDarkMode] = useState(true);
  const [reminders, setReminders] = useState(true);

  const [token, setToken] = useState(
    localStorage.getItem("token") || ""
  );

  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [expandedExercise, setExpandedExercise] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState("");

  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [friendCode, setFriendCode] = useState("");
  const [addFriendCode, setAddFriendCode] = useState("");
  const [leaderboard, setLeaderboard] = useState(null);
  const [leaderboardTab, setLeaderboardTab] = useState("protein");
  const [statWeight, setStatWeight] = useState("");
  const [statBodyFat, setStatBodyFat] = useState("");

  const todayIndex = new Date().getDay();
  const todayName = DAYS[todayIndex];

  const today = split.find(
    (item) => item.day === todayIndex + 1
  );

  const tomorrowIndex = (todayIndex + 1) % 7;

  const tomorrow = split.find(
    (item) => item.day === tomorrowIndex + 1
  );

  const todayDate = useMemo(() => toDateKey(new Date()), []);
  const weekDates = useMemo(() => getWeekDates(), []);

  const todayMeals = useMemo(
    () => meals.filter((item) => item.date === todayDate),
    [meals, todayDate]
  );

  const totals = useMemo(
    () =>
      todayMeals.reduce(
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
    [todayMeals]
  );

  const weeklyTotals = useMemo(
    () =>
      weekDates.map((date) =>
        meals
          .filter((item) => item.date === date)
          .reduce(
            (total, item) => ({
              calories: total.calories + item.calories,
              protein: total.protein + item.protein,
              carbs: total.carbs + item.carbs,
            }),
            { calories: 0, protein: 0, carbs: 0 }
          )
      ),
    [meals, weekDates]
  );

  const aiScore = Math.min(
    100,
    Math.round(
      Math.min(totals.protein * 1.3, 45) +
      Math.min(totals.calories / 25, 35) +
      Math.min(todayMeals.length * 7, 20)
    )
  );

  const aiInsight =
    totals.protein < 40
      ? "Protein is your biggest opportunity today."
      : totals.calories < 1200
      ? "Your energy intake looks light. Consider a balanced meal."
      : todayMeals.length < 3
      ? "Your nutrition log needs another meal or snack."
      : "Your nutrition pattern is looking strong today.";

  useEffect(() => {
    const saved = localStorage.getItem("fitmealApp");

    if (saved) {
      try {
        const data = JSON.parse(saved);

        setName(data.name || "");
        setWeight(data.weight || "");
        setSplit(data.split || createSplit());
        setMeals(
          (data.meals || []).map((item) => ({
            ...item,
            date: item.date || toDateKey(new Date()),
          }))
        );
        setSetup(data.setup || false);
        setReminders(data.reminders ?? true);
        setDarkMode(data.darkMode ?? true);
      } catch {
        localStorage.removeItem("fitmealApp");
      }
    }
  }, []);

  useEffect(() => {
    const currentWeekStart = weekDates[0];

    localStorage.setItem(
      "fitmealApp",
      JSON.stringify({
        name,
        weight,
        split,
        meals: meals.filter(
          (item) => item.date >= currentWeekStart
        ),
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
    weekDates,
  ]);

  useEffect(() => {
    if (page === "leaderboard" && token) {
      fetchFriendCode();
      fetchFriends();
      fetchLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, token]);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const fetchFriendCode = async () => {
    try {
      const res = await fetch(`${API_URL}/api/friends/code`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setFriendCode(data.friendCode || "");
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch(`${API_URL}/api/friends`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setFriends(data.friends || []);
      setIncomingRequests(data.incoming || []);
      setOutgoingRequests(data.outgoing || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_URL}/api/leaderboard`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendFriendRequest = async () => {
    if (!addFriendCode.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/friends/request`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ code: addFriendCode.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Could not send request");
        return;
      }

      setAddFriendCode("");
      fetchFriends();
    } catch (err) {
      console.error(err);
    }
  };

  const respondToRequest = async (requestId, action) => {
    try {
      await fetch(`${API_URL}/api/friends/respond`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ requestId, action }),
      });
      fetchFriends();
      fetchLeaderboard();
    } catch (err) {
      console.error(err);
    }
  };

  const removeFriend = async (friendId) => {
    if (!confirm("Remove this friend?")) return;

    try {
      await fetch(`${API_URL}/api/friends/${friendId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      fetchFriends();
      fetchLeaderboard();
    } catch (err) {
      console.error(err);
    }
  };

  const logStats = async () => {
    if (!statWeight) {
      alert("Enter your current weight.");
      return;
    }

    try {
      await fetch(`${API_URL}/api/weight-log`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          weight: Number(statWeight),
          bodyFat: statBodyFat ? Number(statBodyFat) : null,
        }),
      });

      setWeight(String(statWeight));
      setStatWeight("");
      setStatBodyFat("");
      fetchLeaderboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async () => {
    setAuthError("");

    if (!loginEmail || !loginPassword) {
      setAuthError("Enter your email and password.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);

      setToken(data.token);
      setName(data.name || "");
      setWeight(data.weight || "");
      setSetup(true);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleRegister = async () => {
    setAuthError("");

    if (
      !name ||
      !weight ||
      !registerEmail ||
      !registerPassword
    ) {
      setAuthError("All fields are required.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email: registerEmail,
          password: registerPassword,
          weight: Number(weight),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Registration failed"
        );
      }

      localStorage.setItem("token", data.token);

      setToken(data.token);
      setSetup(true);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setSetup(false);
  };

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
      date: todayDate,
      name: meal,
      quantity: Number(quantity),
      calories: Math.round(
        data.calories * multiplier
      ),
      protein: Number(
        (data.protein * multiplier).toFixed(1)
      ),
      carbs: Number(
        (data.carbs * multiplier).toFixed(1)
      ),
    };

    setMeals((old) => [...old, newMeal]);
    setMeal("");
    setQuantity(100);
  };

  const removeMeal = (id) => {
    setMeals((old) =>
      old.filter((item) => item.id !== id)
    );
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
          "Your AI coach is ready. Check today's workout and nutrition.",
      });
    }
  };

  const resetApp = () => {
    if (!confirm("Reset all FitMeal AI data?")) return;

    localStorage.removeItem("fitmealApp");

    setName("");
    setWeight("");
    setSplit(createSplit());
    setMeals([]);
    setSetup(false);
    setPage("dashboard");
    setDarkMode(true);
  };

  const askAI = () => {
    const text = aiMessage.toLowerCase();

    if (text.includes("protein")) {
      return `You've logged ${totals.protein.toFixed(
        1
      )}g protein today. Consider chicken, eggs, paneer, dal or curd.`;
    }

    if (text.includes("calorie")) {
      return `You've logged ${Math.round(
        totals.calories
      )} kcal today. Keep your meals balanced around your activity.`;
    }

    if (text.includes("workout")) {
      return today?.workouts?.length
        ? `Today's focus is ${today.workouts.join(
            " + "
          )}. Stay controlled and prioritize good form.`
        : "Today is currently a recovery day. Recovery is part of progress.";
    }

    if (text.includes("meal")) {
      return "Try oats + milk + banana for breakfast, rice + dal + chicken for lunch, and paneer + roti for dinner.";
    }

    return `AI analysis: ${aiInsight} Your current FitMeal score is ${aiScore}/100.`;
  };

  /* ================= AUTH ================= */

  if (!token) {
    return (
      <div
        className={
          darkMode
            ? "setupScreen dark"
            : "setupScreen light"
        }
      >
        <div className="authGlow glowOne" />
        <div className="authGlow glowTwo" />

        <div className="setupCard authCard">
          <div className="aiLogoLarge">
            <span>F</span>
            <i>✦</i>
          </div>

          <div className="authEyebrow">
            AI FITNESS SYSTEM
          </div>

          <h1>FitMeal AI</h1>

          <p className="authSubtitle">
            Your intelligent nutrition and workout
            command center.
          </p>

          <div className="authTabs">
            <button
              className={
                authMode === "login"
                  ? "authTab active"
                  : "authTab"
              }
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
              }}
            >
              Log In
            </button>

            <button
              className={
                authMode === "register"
                  ? "authTab active"
                  : "authTab"
              }
              onClick={() => {
                setAuthMode("register");
                setAuthError("");
              }}
            >
              Create Account
            </button>
          </div>

          {authMode === "register" && (
            <>
              <label>Your name</label>
              <input
                placeholder="Enter your name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />

              <label>Body weight</label>
              <input
                type="number"
                placeholder="Weight in kg"
                value={weight}
                onChange={(e) =>
                  setWeight(e.target.value)
                }
              />

              <label>Email</label>
              <input
                placeholder="you@example.com"
                value={registerEmail}
                onChange={(e) =>
                  setRegisterEmail(e.target.value)
                }
              />

              <label>Password</label>
              <input
                type="password"
                placeholder="Create a password"
                value={registerPassword}
                onChange={(e) =>
                  setRegisterPassword(e.target.value)
                }
              />

              {authError && (
                <div className="authError">
                  ⚠ {authError}
                </div>
              )}

              <button
                className="mainButton"
                onClick={handleRegister}
              >
                Create My AI Profile →
              </button>
            </>
          )}

          {authMode === "login" && (
            <>
              <label>Email</label>
              <input
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) =>
                  setLoginEmail(e.target.value)
                }
              />

              <label>Password</label>
              <input
                type="password"
                placeholder="Your password"
                value={loginPassword}
                onChange={(e) =>
                  setLoginPassword(e.target.value)
                }
              />

              {authError && (
                <div className="authError">
                  ⚠ {authError}
                </div>
              )}

              <button
                className="mainButton"
                onClick={handleLogin}
              >
                Enter FitMeal AI →
              </button>
            </>
          )}

          <div className="authFeatures">
            <span>✦ AI INSIGHTS</span>
            <span>◈ NUTRITION</span>
            <span>▲ WORKOUTS</span>
          </div>
        </div>
      </div>
    );
  }

  /* ================= SETUP ================= */

  if (!setup) {
    return (
      <div
        className={
          darkMode
            ? "setupScreen dark"
            : "setupScreen light"
        }
      >
        <div className="setupCard setupWizard">
          <div className="setupWizardHeader">
            <div className="aiLogoLarge small">
              <span>F</span>
              <i>✦</i>
            </div>

            <div>
              <div className="authEyebrow">
                INITIALIZE YOUR SYSTEM
              </div>

              <h1>Build Your Plan</h1>

              <p>
                Tell FitMeal AI what your week looks
                like.
              </p>
            </div>
          </div>

          <div className="setupInputs">
            <div>
              <label>Name</label>
              <input
                placeholder="Your name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />
            </div>

            <div>
              <label>Weight</label>
              <input
                type="number"
                placeholder="kg"
                value={weight}
                onChange={(e) =>
                  setWeight(e.target.value)
                }
              />
            </div>
          </div>

          <div className="setupSectionTitle">
            <span>01</span>
            WEEKLY WORKOUT INTENT
          </div>

          {split.map((day) => (
            <div
              className="setupDay"
              key={day.day}
            >
              <div className="setupDayTitle">
                <strong>
                  {DAYS[day.day - 1]}
                </strong>

                <span>
                  {day.workouts.length
                    ? `${day.workouts.length} selected`
                    : "No focus selected"}
                </span>
              </div>

              <div className="checkGrid">
                {WORKOUTS.map((workout) => (
                  <label
                    key={workout}
                    className={
                      day.workouts.includes(workout)
                        ? "checked"
                        : ""
                    }
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

                    <span>{workout}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            className="mainButton"
            onClick={saveSetup}
          >
            Launch My Dashboard ✦
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
      <div className="ambient ambientOne" />
      <div className="ambient ambientTwo" />

      <aside className="sidebar">
        <div className="brand">
          <div className="logo">
            F
          </div>

          <div>
            <h2>FitMeal</h2>
            <span>AI Intelligence</span>
          </div>
        </div>

        <div className="aiSideStatus">
          <span />
          AI SYSTEM ONLINE
        </div>

        <nav>
          {[
            ["dashboard", "⌂", "Dashboard"],
            ["workout", "●", "Workout"],
            ["nutrition", "◈", "Nutrition"],
            ["planner", "□", "Meal Planner"],
            ["progress", "↗", "Progress"],
            ["exercises", "▲", "Exercises"],
            ["profile", "○", "Profile"],
            ["leaderboard", "★", "Leaderboard"],
          ].map(([key, icon, label]) => (
            <button
              key={key}
              className={
                page === key ? "selected" : ""
              }
              onClick={() => setPage(key)}
            >
              <span>{icon}</span>
              {label}

              {key === "dashboard" && (
                <small>AI</small>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebarBottom">
          <div className="sidebarScore">
            <div>
              <span>AI SCORE</span>
              <strong>{aiScore}</strong>
            </div>

            <div className="miniRing">
              <i
                style={{
                  "--score": `${aiScore * 3.6}deg`,
                }}
              />
            </div>
          </div>

          <button onClick={enableNotification}>
            🔔 Notifications
          </button>

          <button
            onClick={() =>
              setDarkMode(!darkMode)
            }
          >
            {darkMode
              ? "☀ Light Mode"
              : "☾ Dark Mode"}
          </button>

          <button
            className="logoutButton"
            onClick={logout}
          >
            ⇥ Log Out
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="smallTitle">
              FITMEAL AI / COMMAND CENTER
            </div>

            <h1>
              {page === "dashboard"
                ? `Welcome back, ${name}`
                : page === "workout"
                ? "Workout Intelligence"
                : page === "nutrition"
                ? "Nutrition Intelligence"
                : page === "planner"
                ? "AI Meal Planner"
                : page === "progress"
                ? "Progress Analytics"
                : page === "exercises"
                ? "Exercise Intelligence"
                : page === "profile"
                ? "Profile & Settings"
                : "Friends Leaderboard"}
            </h1>
          </div>

          <div className="topbarRight">
            <div className="systemBadge">
              <span />
              AI ONLINE
            </div>

            <div className="profileMini">
              <div className="avatar">
                {name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>{name}</strong>
                <span>{weight} kg</span>
              </div>
            </div>
          </div>
        </header>

        {/* ================= DASHBOARD ================= */}

        {page === "dashboard" && (
          <>
            <section className="hero">
              <div className="heroContent">
                <div className="heroEyebrow">
                  <span />
                  TODAY / {todayName.toUpperCase()}
                </div>

                <h2>
                  {today?.workouts?.length
                    ? today.workouts.join(" + ")
                    : "Recovery Day"}
                </h2>

                <p>
                  Your AI coach has analyzed your
                  current nutrition and workout
                  activity.
                </p>

                <div className="heroActions">
                  <button
                    onClick={() =>
                      setPage("workout")
                    }
                  >
                    View Workout
                  </button>

                  <button
                    className="secondary"
                    onClick={() =>
                      setPage("nutrition")
                    }
                  >
                    Log Nutrition
                  </button>
                </div>
              </div>

              <div className="heroCore">
                <div
                  className="heroRing"
                  style={{
                    "--progress": `${aiScore * 3.6}deg`,
                  }}
                >
                  <div>
                    <strong>
                      {aiScore}
                    </strong>
                    <span>AI SCORE</span>
                  </div>
                </div>

                <small>
                  DAILY READINESS
                </small>
              </div>
            </section>

            <section className="aiCoach">
              <div className="aiCoachGlow" />

              <div className="aiCoachHeader">
                <div className="aiOrb">
                  <span>✦</span>
                </div>

                <div>
                  <div className="aiStatus">
                    <span />
                    AI COACH ONLINE
                  </div>

                  <h2>
                    FitMeal Intelligence
                  </h2>

                  <p>
                    Live analysis of today's
                    fitness behavior.
                  </p>
                </div>

                <button
                  className="aiExpand"
                  onClick={() =>
                    setAiOpen(!aiOpen)
                  }
                >
                  {aiOpen
                    ? "Close AI"
                    : "Ask AI →"}
                </button>
              </div>

              <div className="aiBrief">
                <div className="aiBriefIcon">
                  ✦
                </div>

                <div>
                  <span>
                    TODAY'S AI INSIGHT
                  </span>

                  <h3>{aiInsight}</h3>

                  <p>
                    {totals.protein < 40
                      ? "Add a protein-rich food to move your daily score upward."
                      : "Keep your meals consistent and match your nutrition with today's activity."}
                  </p>
                </div>
              </div>

              <div className="aiRecommendations">
                <div className="aiRecommendation">
                  <b>🍗</b>
                  <div>
                    <small>
                      NUTRITION
                    </small>
                    <strong>
                      {totals.protein.toFixed(
                        1
                      )}
                      g protein
                    </strong>
                    <span>
                      {totals.protein < 40
                        ? "Needs attention"
                        : "On track"}
                    </span>
                  </div>
                </div>

                <div className="aiRecommendation">
                  <b>🔥</b>
                  <div>
                    <small>
                      ENERGY
                    </small>
                    <strong>
                      {Math.round(
                        totals.calories
                      )}{" "}
                      kcal
                    </strong>
                    <span>
                      Today's intake
                    </span>
                  </div>
                </div>

                <div className="aiRecommendation">
                  <b>🏋️</b>
                  <div>
                    <small>
                      WORKOUT
                    </small>
                    <strong>
                      {today?.workouts?.length
                        ? `${today.workouts.length} focus`
                        : "Recovery"}
                    </strong>
                    <span>
                      {today?.workouts?.length
                        ? today.workouts.join(
                            " • "
                          )
                        : "Rest day"}
                    </span>
                  </div>
                </div>
              </div>

              {aiOpen && (
                <div className="aiChat">
                  <div className="aiChatMessages">
                    <div className="aiChatBubble bot">
                      <span>✦</span>
                      Hi {name}. Ask me about
                      protein, calories, meals or
                      today's workout.
                    </div>

                    {aiMessage && (
                      <div className="aiChatBubble user">
                        {aiMessage}
                      </div>
                    )}

                    {aiMessage && (
                      <div className="aiChatBubble bot">
                        <span>✦</span>
                        {askAI()}
                      </div>
                    )}
                  </div>

                  <div className="aiChatInput">
                    <input
                      value={aiMessage}
                      onChange={(e) =>
                        setAiMessage(
                          e.target.value
                        )
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter"
                        ) {
                          setAiMessage(
                            e.currentTarget.value
                          );
                        }
                      }}
                      placeholder="Ask FitMeal AI..."
                    />

                    <button
                      onClick={() =>
                        setAiMessage(
                          aiMessage.trim()
                        )
                      }
                    >
                      ↑
                    </button>
                  </div>
                </div>
              )}

              <div className="aiFooter">
                <span>
                  ✦ FITMEAL AI ENGINE
                </span>

                <span>
                  Analysis generated from
                  today's activity
                </span>
              </div>
            </section>

            <section className="stats">
              <div className="stat">
                <div className="statIcon">
                  🔥
                </div>
                <span>CALORIES</span>
                <strong>
                  {Math.round(
                    totals.calories
                  )}
                </strong>
                <small>kcal today</small>
              </div>

              <div className="stat">
                <div className="statIcon">
                  🥩
                </div>
                <span>PROTEIN</span>
                <strong>
                  {totals.protein.toFixed(1)}
                  g
                </strong>
                <small>consumed</small>
              </div>

              <div className="stat">
                <div className="statIcon">
                  ⚡
                </div>
                <span>CARBS</span>
                <strong>
                  {totals.carbs.toFixed(1)}
                  g
                </strong>
                <small>consumed</small>
              </div>

              <div className="stat">
                <div className="statIcon">
                  ⚖
                </div>
                <span>BODY WEIGHT</span>
                <strong>{weight}</strong>
                <small>kg</small>
              </div>
            </section>

            <div className="dashboardGrid">
              <section className="panel">
                <div className="panelHeader">
                  <div>
                    <span className="panelEyebrow">
                      TODAY
                    </span>
                    <h2>
                      Workout Focus
                    </h2>
                  </div>

                  <button
                    className="textButton"
                    onClick={() =>
                      setPage("workout")
                    }
                  >
                    Open Plan →
                  </button>
                </div>

                <div className="todayWorkout">
                  {today?.workouts?.length ? (
                    today.workouts.map(
                      (workout) => (
                        <div
                          className="workoutChip"
                          key={workout}
                        >
                          <span>●</span>
                          {workout}
                        </div>
                      )
                    )
                  ) : (
                    <div className="emptyState">
                      <strong>
                        Recovery mode
                      </strong>
                      <span>
                        No workout selected
                        for today.
                      </span>
                    </div>
                  )}
                </div>
              </section>

              <section className="panel">
                <div className="panelHeader">
                  <div>
                    <span className="panelEyebrow">
                      NEXT UP
                    </span>
                    <h2>
                      Tomorrow
                    </h2>
                  </div>

                  <span className="badge">
                    DAY{" "}
                    {tomorrowIndex + 1}
                  </span>
                </div>

                <div className="tomorrowCard">
                  <div className="tomorrowIcon">
                    {tomorrow?.workouts?.length
                      ? "🏋️"
                      : "☾"}
                  </div>

                  <div>
                    <strong>
                      {tomorrow?.workouts
                        ?.length
                        ? tomorrow.workouts.join(
                            " + "
                          )
                        : "Rest Day"}
                    </strong>

                    <span>
                      {DAYS[
                        tomorrowIndex
                      ]}
                    </span>
                  </div>
                </div>

                <select
                  value={
                    tomorrow?.workouts?.[0] ||
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
                                  ? []
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
              </section>
            </div>

            <section className="panel quickMealPanel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    AI FOOD TRACKER
                  </span>
                  <h2>
                    Quick Meal Entry
                  </h2>
                </div>

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
                    setQuantity(
                      e.target.value
                    )
                  }
                  placeholder="grams"
                />

                <button onClick={addMeal}>
                  + Add Meal
                </button>
              </div>
            </section>
          </>
        )}

        {/* ================= WORKOUT ================= */}

        {page === "workout" && (
          <>
            <section className="pageIntro">
              <p>AI TRAINING SYSTEM</p>
              <h2>Workout Schedule</h2>
              <span>
                Build your weekly training split.
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
                      <b>TODAY</b>
                    )}
                  </div>

                  <div className="workoutOptions">
                    {WORKOUTS.map(
                      (workout) => (
                        <label
                          key={workout}
                          className={
                            day.workouts.includes(
                              workout
                            )
                              ? "workoutSelected"
                              : ""
                          }
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

                          <span>
                            {workout}
                          </span>
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
              <p>AI NUTRITION ENGINE</p>
              <h2>Nutrition Dashboard</h2>
              <span>
                Track food and monitor your daily
                nutrition profile.
              </span>
            </section>

            <div className="nutritionLarge">
              <div className="nutritionCard calories">
                <span>CALORIES</span>
                <strong>
                  {Math.round(
                    totals.calories
                  )}
                </strong>
                <small>kcal</small>
              </div>

              <div className="nutritionCard protein">
                <span>PROTEIN</span>
                <strong>
                  {totals.protein.toFixed(1)}
                </strong>
                <small>grams</small>
              </div>

              <div className="nutritionCard carbs">
                <span>CARBS</span>
                <strong>
                  {totals.carbs.toFixed(1)}
                </strong>
                <small>grams</small>
              </div>
            </div>

            <section className="panel weekPanel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    THIS WEEK
                  </span>
                  <h2>Weekly Breakdown</h2>
                </div>

                <span className="badge">
                  RESETS SUNDAY
                </span>
              </div>

              <div className="weekGrid">
                {weekDates.map((date, i) => (
                  <div
                    className={
                      date === todayDate
                        ? "weekDayCard currentDay"
                        : "weekDayCard"
                    }
                    key={date}
                  >
                    <span>
                      {DAYS[i]
                        .slice(0, 3)
                        .toUpperCase()}
                    </span>

                    <strong>
                      {Math.round(
                        weeklyTotals[i].calories
                      )}
                    </strong>

                    <small>kcal</small>
                    <small>
                      P{" "}
                      {weeklyTotals[
                        i
                      ].protein.toFixed(1)}
                      g
                    </small>
                    <small>
                      C{" "}
                      {weeklyTotals[
                        i
                      ].carbs.toFixed(1)}
                      g
                    </small>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    FOOD DATABASE
                  </span>
                  <h2>Add Food</h2>
                </div>
              </div>

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
                    setQuantity(
                      e.target.value
                    )
                  }
                  placeholder="grams"
                />

                <button onClick={addMeal}>
                  Add Food
                </button>
              </div>

              <div className="foodHints">
                {Object.keys(FOOD).map(
                  (food) => (
                    <button
                      key={food}
                      onClick={() =>
                        setMeal(food)
                      }
                    >
                      {food}
                    </button>
                  )
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    TODAY
                  </span>
                  <h2>Food Log</h2>
                </div>

                <span className="badge">
                  {todayMeals.length} MEALS
                </span>
              </div>

              {todayMeals.length === 0 ? (
                <div className="emptyState large">
                  <span>◈</span>
                  <strong>
                    No meals logged
                  </strong>
                  <p>
                    Add your first meal above
                    and let FitMeal AI analyze
                    your day.
                  </p>
                </div>
              ) : (
                <div className="foodList">
                  {todayMeals.map((item) => (
                    <div
                      className="foodRow"
                      key={item.id}
                    >
                      <div className="foodAvatar">
                        {item.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>
                          {item.name}
                        </strong>
                        <span>
                          {item.quantity}g
                        </span>
                      </div>

                      <b>
                        {item.calories} kcal
                      </b>

                      <span>
                        P{" "}
                        {item.protein}g
                      </span>

                      <span>
                        C{" "}
                        {item.carbs}g
                      </span>

                      <button
                        className="deleteBtn"
                        onClick={() =>
                          removeMeal(
                            item.id
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ================= PLANNER ================= */}

        {page === "planner" && (
          <>
            <section className="pageIntro">
              <p>AI MEAL INTELLIGENCE</p>
              <h2>Meal Planner</h2>
              <span>
                Simple meal ideas matched to your
                training day.
              </span>
            </section>

            <div className="plannerHero">
              <div className="plannerOrb">
                ✦
              </div>

              <div>
                <span>
                  AI RECOMMENDATION
                </span>

                <h2>
                  {totals.protein < 40
                    ? "Prioritize protein today."
                    : "Keep your nutrition consistent."}
                </h2>

                <p>
                  FitMeal AI recommends
                  nutrient-dense meals around
                  your activity.
                </p>
              </div>
            </div>

            <div className="mealCards">
              {[
                [
                  "BREAKFAST",
                  "Oats + Milk + Banana",
                  "Carbs + protein to start the day.",
                  "08:00",
                ],
                [
                  "LUNCH",
                  "Rice + Dal + Chicken",
                  "Balanced meal for recovery and energy.",
                  "13:30",
                ],
                [
                  "PRE-WORKOUT",
                  "Banana + Oats",
                  "Simple fuel before training.",
                  "16:30",
                ],
                [
                  "POST-WORKOUT",
                  "Chicken + Rice",
                  "Protein and carbs after training.",
                  "19:00",
                ],
                [
                  "SNACK",
                  "Curd + Banana",
                  "Light and convenient snack.",
                  "11:00",
                ],
                [
                  "DINNER",
                  "Paneer + Roti",
                  "Balanced evening meal.",
                  "21:00",
                ],
              ].map(
                ([type, title, text, time]) => (
                  <div
                    className="mealCard"
                    key={type}
                  >
                    <div className="mealCardTop">
                      <span>{type}</span>
                      <b>{time}</b>
                    </div>

                    <div className="mealEmoji">
                      {type ===
                      "BREAKFAST"
                        ? "🥣"
                        : type ===
                          "LUNCH"
                        ? "🍛"
                        : type ===
                          "PRE-WORKOUT"
                        ? "🍌"
                        : type ===
                          "POST-WORKOUT"
                        ? "🍗"
                        : type ===
                          "SNACK"
                        ? "🥛"
                        : "🫓"}
                    </div>

                    <h3>{title}</h3>
                    <p>{text}</p>

                    <button
                      onClick={() => {
                        const first =
                          title
                            .split("+")[0]
                            .trim()
                            .toLowerCase();

                        if (FOOD[first]) {
                          setMeal(first);
                          setPage(
                            "nutrition"
                          );
                        }
                      }}
                    >
                      Log Ingredient →
                    </button>
                  </div>
                )
              )}
            </div>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    DAILY FLOW
                  </span>
                  <h2>Meal Timing</h2>
                </div>
              </div>

              <div className="timeline">
                {[
                  ["08:00", "Breakfast"],
                  ["11:00", "Snack"],
                  ["13:30", "Lunch"],
                  ["16:30", "Pre-Workout"],
                  ["19:00", "Post-Workout"],
                  ["21:00", "Dinner"],
                ].map(
                  ([time, label]) => (
                    <div key={time}>
                      <b>{time}</b>
                      <span>{label}</span>
                    </div>
                  )
                )}
              </div>
            </section>
          </>
        )}

        {/* ================= PROGRESS ================= */}

        {page === "progress" && (
          <>
            <section className="pageIntro">
              <p>AI ANALYTICS</p>
              <h2>Progress Center</h2>
              <span>
                A live overview of your current
                activity.
              </span>
            </section>

            <div className="progressHero">
              <div className="progressBigRing">
                <div>
                  <strong>
                    {aiScore}
                  </strong>
                  <span>
                    AI SCORE
                  </span>
                </div>
              </div>

              <div>
                <span>
                  PERFORMANCE STATUS
                </span>

                <h2>
                  {aiScore >= 75
                    ? "Excellent momentum"
                    : aiScore >= 45
                    ? "Building momentum"
                    : "Time to activate"}
                </h2>

                <p>
                  Your score combines today's
                  nutrition logging, protein
                  intake and meal consistency.
                </p>
              </div>
            </div>

            <div className="progressGrid">
              <div>
                <span>
                  WORKOUT DAYS
                </span>

                <strong>5 / 7</strong>

                <div className="progressBar">
                  <i
                    style={{
                      width: "71%",
                    }}
                  />
                </div>

                <small>
                  Weekly target
                </small>
              </div>

              <div>
                <span>
                  MEALS LOGGED
                </span>

                <strong>
                  {todayMeals.length}
                </strong>

                <div className="progressBar">
                  <i
                    style={{
                      width: `${Math.min(
                        todayMeals.length *
                          15,
                        100
                      )}%`,
                    }}
                  />
                </div>

                <small>
                  Daily consistency
                </small>
              </div>

              <div>
                <span>
                  PROTEIN TODAY
                </span>

                <strong>
                  {totals.protein.toFixed(
                    1
                  )}
                  g
                </strong>

                <div className="progressBar">
                  <i
                    style={{
                      width: `${Math.min(
                        totals.protein *
                          1.25,
                        100
                      )}%`,
                    }}
                  />
                </div>

                <small>
                  AI target tracking
                </small>
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
                        totals.calories /
                          20,
                        100
                      )}%`,
                    }}
                  />
                </div>

                <small>
                  Daily energy
                </small>
              </div>
            </div>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    AI FEEDBACK
                  </span>

                  <h2>
                    Today's Analysis
                  </h2>
                </div>
              </div>

              <div className="analysisGrid">
                <div>
                  <span>✦</span>
                  <strong>
                    Nutrition
                  </strong>
                  <p>
                    {aiInsight}
                  </p>
                </div>

                <div>
                  <span>⚡</span>
                  <strong>
                    Consistency
                  </strong>
                  <p>
                    {todayMeals.length >= 3
                      ? "Good logging consistency today."
                      : "Log more meals to improve your data quality."}
                  </p>
                </div>

                <div>
                  <span>🏋️</span>
                  <strong>
                    Training
                  </strong>
                  <p>
                    {today?.workouts
                      ?.length
                      ? "Your training focus is ready."
                      : "Recovery day detected."}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ================= EXERCISES ================= */}

        {page === "exercises" && (
          <>
            <section className="pageIntro">
              <p>AI EXERCISE INTELLIGENCE</p>
              <h2>Exercise Library</h2>
              <span>
                Explore movement cues and training
                guidance.
              </span>
            </section>

            <div className="exerciseAIBar">
              <div className="exerciseAIIcon">
                ✦
              </div>

              <div>
                <span>
                  FORM ASSISTANT ONLINE
                </span>

                <strong>
                  Select an exercise to view
                  technique cues.
                </strong>
              </div>

              <button
                onClick={() =>
                  setPage("workout")
                }
              >
                View Workout →
              </button>
            </div>

            <div className="exerciseGrid">
              {EXERCISES.map(
                (
                  [
                    muscle,
                    title,
                    icon,
                    description,
                  ],
                  index
                ) => {
                  const open =
                    expandedExercise ===
                    title;

                  return (
                    <div
                      className={`exerciseCard ${
                        open
                          ? "exerciseCardOpen"
                          : ""
                      }`}
                      key={title}
                      onClick={() =>
                        setExpandedExercise(
                          open
                            ? null
                            : title
                        )
                      }
                    >
                      <div className="exerciseVisual">
                        <div className="exerciseNumber">
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </div>

                        <div className="exerciseIcon">
                          {icon}
                        </div>

                        <div className="exerciseGridGlow" />
                      </div>

                      <div className="exerciseInfo">
                        <span>
                          {muscle.toUpperCase()}
                        </span>

                        <h3>{title}</h3>

                        <p>
                          {description}
                        </p>

                        <b>
                          {open
                            ? "CLOSE GUIDE ↑"
                            : "OPEN FORM GUIDE ↓"}
                        </b>
                      </div>

                      {open && (
                        <div className="exerciseSteps">
                          {[
                            [
                              "01",
                              "SETUP",
                              "Position yourself correctly and brace your body.",
                            ],
                            [
                              "02",
                              "EXECUTE",
                              description,
                            ],
                            [
                              "03",
                              "CONTROL",
                              "Return slowly and keep the movement controlled.",
                            ],
                          ].map(
                            ([
                              number,
                              label,
                              text,
                            ]) => (
                              <div
                                className="stepItem"
                                key={number}
                              >
                                <span>
                                  {number}
                                </span>

                                <div>
                                  <b>
                                    {label}
                                  </b>

                                  <p>
                                    {text}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}

        {/* ================= PROFILE ================= */}

        {page === "profile" && (
          <>
            <section className="pageIntro">
              <p>ACCOUNT CONTROL</p>
              <h2>Profile & Settings</h2>
              <span>
                Manage your FitMeal AI experience.
              </span>
            </section>

            <section className="profileHero">
              <div className="profileBigAvatar">
                {name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <span>FITMEAL MEMBER</span>
                <h2>{name}</h2>
                <p>
                  Current weight:{" "}
                  <strong>
                    {weight} kg
                  </strong>
                </p>
              </div>

              <div className="profileScore">
                <span>AI SCORE</span>
                <strong>{aiScore}</strong>
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    INTERFACE
                  </span>
                  <h2>Appearance</h2>
                </div>
              </div>

              <div className="appearanceSetting">
                <div>
                  <strong>
                    Interface theme
                  </strong>

                  <p>
                    Switch between dark and light
                    FitMeal AI.
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
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    PREFERENCES
                  </span>
                  <h2>
                    Notifications
                  </h2>
                </div>
              </div>

              <div className="settingRow">
                <div>
                  <strong>
                    AI reminders
                  </strong>

                  <p>
                    Receive reminders about your
                    daily plan.
                  </p>
                </div>

                <button
                  className={
                    reminders
                      ? "toggle active"
                      : "toggle"
                  }
                  onClick={() =>
                    setReminders(
                      !reminders
                    )
                  }
                >
                  <i />
                </button>
              </div>

              <button
                className="outlineButton"
                onClick={
                  enableNotification
                }
              >
                Enable Browser Notifications
              </button>
            </section>

            <section className="panel dangerPanel">
              <div>
                <span className="panelEyebrow">
                  DANGER ZONE
                </span>

                <h2>
                  Reset Application
                </h2>

                <p>
                  Remove your saved profile,
                  workout split and meal history.
                </p>
              </div>

              <button
                className="danger"
                onClick={resetApp}
              >
                Reset All Data
              </button>
            </section>
          </>
        )}

        {/* ================= LEADERBOARD ================= */}

        {page === "leaderboard" && (
          <>
            <section className="pageIntro">
              <p>AI SOCIAL COMPETITION</p>
              <h2>Friends Leaderboard</h2>
              <span>
                Compete with friends on protein, weight loss and body fat loss.
              </span>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    YOUR CODE
                  </span>
                  <h2>Add Friends</h2>
                </div>
              </div>

              <div className="quickMeal">
                <input
                  value={friendCode}
                  readOnly
                  placeholder="Your friend code"
                />
                <input
                  value={addFriendCode}
                  onChange={(e) =>
                    setAddFriendCode(e.target.value)
                  }
                  placeholder="Enter a friend's code"
                />
                <button onClick={sendFriendRequest}>
                  + Add Friend
                </button>
              </div>

              {incomingRequests.length > 0 &&
                incomingRequests.map((req) => (
                  <div className="friendRow" key={req.requestId}>
                    <div className="friendRankBadge">
                      {req.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="friendRowInfo">
                      <strong>{req.name}</strong>
                      <span>wants to be friends</span>
                    </div>
                    <div className="friendRowActions">
                      <button
                        className="acceptBtn"
                        onClick={() =>
                          respondToRequest(req.requestId, "accept")
                        }
                      >
                        Accept
                      </button>
                      <button
                        className="deleteBtn"
                        onClick={() =>
                          respondToRequest(req.requestId, "decline")
                        }
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}

              {outgoingRequests.length > 0 &&
                outgoingRequests.map((req) => (
                  <div className="friendRow" key={req.requestId}>
                    <div className="friendRankBadge">
                      {req.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="friendRowInfo">
                      <strong>{req.name}</strong>
                      <span>request pending</span>
                    </div>
                  </div>
                ))}

              {friends.length === 0 ? (
                <div className="emptyState" style={{ marginTop: 12 }}>
                  <strong>No friends yet</strong>
                  <span>Share your code above to start a leaderboard.</span>
                </div>
              ) : (
                friends.map((f) => (
                  <div className="friendRow" key={f.id}>
                    <div className="friendRankBadge">
                      {f.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="friendRowInfo">
                      <strong>{f.name}</strong>
                      <span>{f.points} pts all-time</span>
                    </div>
                    <button
                      className="deleteBtn"
                      onClick={() => removeFriend(f.id)}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </section>

            <section className="panel quickMealPanel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    WEEKLY CHECK-IN
                  </span>
                  <h2>Log Today's Stats</h2>
                </div>
              </div>

              <div className="quickMeal">
                <input
                  type="number"
                  value={statWeight}
                  onChange={(e) => setStatWeight(e.target.value)}
                  placeholder="Weight (kg)"
                />
                <input
                  type="number"
                  value={statBodyFat}
                  onChange={(e) => setStatBodyFat(e.target.value)}
                  placeholder="Body fat % (optional)"
                />
                <button onClick={logStats}>Save</button>
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    {leaderboard
                      ? `WEEK OF ${leaderboard.weekStart}`
                      : "THIS WEEK"}
                  </span>
                  <h2>Leaderboard</h2>
                </div>

                <div className="themeToggle tabToggle">
                  {[
                    ["protein", "Protein"],
                    ["weightLoss", "Weight Loss"],
                    ["bodyFatLoss", "Body Fat"],
                  ].map(([key, label]) => (
                    <span
                      key={key}
                      className={
                        leaderboardTab === key ? "activeTheme" : ""
                      }
                      onClick={() => setLeaderboardTab(key)}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {!leaderboard ||
              leaderboard.rankings[leaderboardTab].length === 0 ? (
                <div className="emptyState large">
                  <span>★</span>
                  <strong>Not enough data yet</strong>
                  <p>
                    Add a friend and log a few days of stats to see
                    rankings.
                  </p>
                </div>
              ) : (
                leaderboard.rankings[leaderboardTab].map(
                  (row, index) => (
                    <div className="leaderboardRow" key={row.id}>
                      <div className="friendRankBadge">
                        {index === 0
                          ? "🥇"
                          : index === 1
                          ? "🥈"
                          : index === 2
                          ? "🥉"
                          : index + 1}
                      </div>
                      <div className="friendRowInfo">
                        <strong>{row.name}</strong>
                        <span>
                          {leaderboardTab === "protein"
                            ? "this week"
                            : leaderboardTab === "weightLoss"
                            ? "lost this week"
                            : "body fat lost this week"}
                        </span>
                      </div>
                      <div className="friendRowValue">
                        {leaderboardTab === "protein"
                          ? `${row.value.toFixed(1)}g`
                          : leaderboardTab === "weightLoss"
                          ? `${row.value > 0 ? row.value.toFixed(1) : 0} kg`
                          : `${row.value > 0 ? row.value.toFixed(1) : 0}%`}
                      </div>
                    </div>
                  )
                )
              )}
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">ALL-TIME</span>
                  <h2>Points Standings</h2>
                </div>
              </div>

              {leaderboard &&
                leaderboard.points.map((p, index) => (
                  <div className="leaderboardRow" key={p.id}>
                    <div className="friendRankBadge">{index + 1}</div>
                    <div className="friendRowInfo">
                      <strong>{p.name}</strong>
                      <span>Earned by winning weekly challenges</span>
                    </div>
                    <div className="friendRowValue">{p.points} pts</div>
                  </div>
                ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;