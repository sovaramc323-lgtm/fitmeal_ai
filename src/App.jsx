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

const createSplit = () =>
  DAYS.map((_, index) => ({
    day: index + 1,
    workouts: [],
  }));

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

  const saveSetup = async () => {
    if (!name || !weight) {
      alert("Please enter your name and weight.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          weight: Number(weight),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save user");
      }

      localStorage.setItem("userId", data.userId);
      console.log("User saved:", data);
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Could not save data to MySQL. Make sure backend is running.");
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

          <button
            className={
              page === "profile"
                ? "selected"
                : ""
            }
            onClick={() =>
              setPage("profile")
            }
          >
            <span>○</span>
            Profile
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

      </main>

    </div>
  );
}

export default App;

const saveUser = async () => {
  if (!name || !weight) {
    alert("Please enter your name and weight");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        weight: Number(weight),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to save user");
    }

    console.log("User saved:", data);

    localStorage.setItem("userId", data.userId);

    alert("User data saved to MySQL successfully!");
  } catch (error) {
    console.error("Error saving user:", error);
    alert("Could not save data to MySQL. Make sure backend is running.");
  }
};

