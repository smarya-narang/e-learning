// E-Learning Platform (Frontend Only, LocalStorage)
// Covers key SRS features as a static SPA: auth, role-based access, course & quiz CRUD (faculty), quiz attempts (student),
// instant evaluation, points, badges, and leaderboard.
// All data is stored in localStorage. Not for production use.

/* ---------------------------- Utilities & Storage ---------------------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const uid = () => Math.random().toString(36).slice(2, 10);

const DB_KEY = "elearn_db_v1";
const AUTH_KEY = "elearn_auth_v1";

const defaultBadges = [
  { id: "starter", label: "Starter", threshold: 10 },
  { id: "bronze", label: "Bronze Brain", threshold: 50 },
  { id: "silver", label: "Silver Scholar", threshold: 150 },
  { id: "gold", label: "Golden Guru", threshold: 300 }
];

const seedData = () => ({
  users: [
    { id: "u-admin", name: "Admin", email: "admin@example.com", passHash: "", role: "admin", points: 0, badges: [] },
    { id: "u-fac", name: "Prof. Ada", email: "ada@example.com", passHash: "", role: "faculty", points: 0, badges: [] },
    { id: "u-stu", name: "Student Sam", email: "sam@example.com", passHash: "", role: "student", points: 20, badges: ["starter"] },
  ],
  courses: [
    {
      id: "c-js",
      title: "Intro to JavaScript",
      description: "Basics of JS, variables, functions, arrays.",
      facultyId: "u-fac",
      materials: [
        { id: uid(), title: "Lecture Slides - Week 1", url: "https://developer.mozilla.org/" }
      ],
      quizzes: [
        {
          id: "q-js-1",
          title: "JS Basics Quiz",
          questions: [
            { id: uid(), text: "Which keyword declares a variable?", options: ["var", "let", "const", "all of the above"], correctIndex: 3 },
            { id: uid(), text: "Arrays in JS are:", options: ["Immutable", "Mutable", "Not supported", "Only numbers"], correctIndex: 1 }
          ]
        }
      ]
    }
  ],
  attempts: [
    // {userId, quizId, courseId, score, total, answers:[index...] , createdAt}
  ],
  badges: defaultBadges
});

const loadDB = () => {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) return JSON.parse(raw);
  const s = seedData();
  saveDB(s);
  return s;
};
const saveDB = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));

const setAuth = (obj) => localStorage.setItem(AUTH_KEY, JSON.stringify(obj));
const getAuth = () => {
  const raw = localStorage.getItem(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
};
const clearAuth = () => localStorage.removeItem(AUTH_KEY);

/* ---------------------------- Simple Router ---------------------------- */
const routes = {};
function route(path, render) { routes[path] = render; }
function navigate(path) { location.hash = "#" + path; }

window.addEventListener("hashchange", renderApp);
window.addEventListener("load", renderApp);

/* ---------------------------- Crypto (hash password) ---------------------------- */
async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/* ---------------------------- Nav ---------------------------- */
function renderNav() {
  const nav = $("#nav");
  const auth = getAuth();
  const items = [];
  items.push(`<a class="btn" href="#home">Home</a>`);
  items.push(`<a class="btn" href="#leaderboard">Leaderboard</a>`);
  if (!auth) {
    items.push(`<a class="btn primary" href="#login">Login</a>`);
    items.push(`<a class="btn" href="#register">Register</a>`);
  } else {
    if (auth.role === "student") items.push(`<a class="btn" href="#dashboard-student">Student Dashboard</a>`);
    if (auth.role === "faculty") items.push(`<a class="btn" href="#dashboard-faculty">Faculty Dashboard</a>`);
    if (auth.role === "admin") items.push(`<a class="btn" href="#dashboard-admin">Admin Dashboard</a>`);
    items.push(`<button class="btn warn" id="logoutBtn">Logout</button>`);
  }
  nav.innerHTML = items.join("");
  const logoutBtn = $("#logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearAuth();
      renderNav();
      navigate("home");
    });
  }
}

/* ---------------------------- Core Renders ---------------------------- */
function h1(t){return `<h1>${t}</h1>`}

function renderHome() {
  const db = loadDB();
  return `
  <div class="grid cols-2">
    <section class="card">
      <div class="card-head"><h2>Welcome</h2></div>
      <div class="card-body">
        <p class="lead">A modern E‑Learning Platform with gamification: authentication, role-based access, course & quiz management, instant evaluation, points, badges, and a leaderboard.</p>
        <p class="small">Try logging in as: <br/>
        <code>admin@example.com</code> (admin), <code>ada@example.com</code> (faculty), <code>sam@example.com</code> (student). Any password will be reset once you set one at Login.</p>
        <div class="actions">
          <a class="btn primary" href="#register">Get Started</a>
          <a class="btn ghost" href="#login">I have an account</a>
        </div>
      </div>
    </section>
    <section class="card">
      <div class="card-head"><h2>At a Glance</h2><span class="badge ok">Fast</span></div>
      <div class="card-body grid cols-2">
        <div>
          <div class="kpi">${db.users.length}</div>
          <div class="small">Users</div>
        </div>
        <div>
          <div class="kpi">${db.courses.length}</div>
          <div class="small">Courses</div>
        </div>
        <div>
          <div class="kpi">${db.attempts.length}</div>
          <div class="small">Quiz Attempts</div>
        </div>
        <div>
          <div class="kpi">${db.badges.length}</div>
          <div class="small">Badges</div>
        </div>
      </div>
    </section>
  </div>`;
}

function renderLogin() {
  return `
  ${h1("Login")}
  <div class="card">
    <div class="card-body">
      <form id="loginForm" autocomplete="on">
        <label>Email</label>
        <input required type="email" name="email" placeholder="you@example.com"/>
        <label>Password</label>
        <input required type="password" name="password" placeholder="••••••••"/>
        <div class="actions" style="margin-top:12px">
          <button class="btn primary" type="submit">Login</button>
          <a class="btn ghost" href="#register">Create account</a>
        </div>
      </form>
    </div>
  </div>`;
}

function renderRegister() {
  return `
  ${h1("Create an Account")}
  <div class="card">
    <div class="card-body">
      <form id="regForm" autocomplete="on">
        <div class="form-row">
          <div>
            <label>Name</label>
            <input required name="name" placeholder="Your name"/>
          </div>
          <div>
            <label>Email</label>
            <input required type="email" name="email" placeholder="you@example.com"/>
          </div>
        </div>
        <div class="form-row">
          <div>
            <label>Password</label>
            <input required type="password" name="password" placeholder="Choose a password"/>
          </div>
          <div>
            <label>Role</label>
            <select name="role">
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
        </div>
        <div class="actions" style="margin-top:12px">
          <button class="btn primary" type="submit">Create account</button>
          <a class="btn ghost" href="#login">I have an account</a>
        </div>
      </form>
    </div>
  </div>`;
}

function renderLeaderboard() {
  const db = loadDB();
  const rows = db.users
    .filter(u => u.role === "student")
    .sort((a,b)=> (b.points||0) - (a.points||0))
    .slice(0, 10)
    .map((u,i)=>`<tr><td>${i+1}</td><td>${u.name}</td><td>${u.points||0}</td><td>${(u.badges||[]).map(id => db.badges.find(b=>b.id===id)?.label || id).join(", ") || "-"}</td></tr>`)
    .join("");
  return `
    ${h1("Leaderboard")}
    <div class="card">
      <div class="card-body">
        <table class="table">
          <thead><tr><th>#</th><th>Student</th><th>Points</th><th>Badges</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="4" class="empty">No students yet.</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  `;
}

/* ---------------------------- Student ---------------------------- */
function renderStudentDashboard() {
  const auth = getAuth();
  const db = loadDB();
  const me = db.users.find(u=>u.id===auth.userId);
  const myAttempts = db.attempts.filter(a=>a.userId===me.id).sort((a,b)=> b.createdAt - a.createdAt);
  const courses = db.courses;

  const attemptList = myAttempts.map(a=>{
    const course = courses.find(c=>c.id===a.courseId);
    const quiz = course?.quizzes?.find(q=>q.id===a.quizId);
    return `<tr>
      <td>${course?.title || "-"}</td>
      <td>${quiz?.title || "-"}</td>
      <td>${a.score}/${a.total}</td>
      <td>${new Date(a.createdAt).toLocaleString()}</td>
    </tr>`
  }).join("");

  const courseCards = courses.map(c=>`<div class="card">
    <div class="card-head"><h3>${c.title}</h3><span class="badge">${(c.quizzes?.length)||0} quiz(es)</span></div>
    <div class="card-body">
      <div class="actions">
        <a class="btn" href="#materials/${c.id}">View Materials</a>
        ${(c.quizzes||[]).map(q=>`<a class="btn" href="#quiz/${c.id}/${q.id}">Attempt: ${q.title}</a>`).join("") || `<span class="small">No quizzes</span>`}
      </div>
    </div>
  </div>`).join("");

  return `
  ${h1("Student Dashboard")}
  <div class="grid cols-3">
    <div class="card">
      <div class="card-body">
        <div class="kpi">${me.points||0}</div>
        <div class="small">Total Points</div>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <div class="kpi">${(me.badges||[]).length}</div>
        <div class="small">Badges</div>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <div class="kpi">${myAttempts.length}</div>
        <div class="small">Quiz Attempts</div>
      </div>
    </div>
  </div>

  <h2>Courses & Quizzes</h2>
  <div class="grid cols-2">${courseCards || `<div class="empty">No courses yet.</div>`}</div>

  <h2>Recent Attempts</h2>
  <div class="card">
    <div class="card-body">
      <table class="table"><thead><tr><th>Course</th><th>Quiz</th><th>Score</th><th>Date</th></tr></thead>
      <tbody>${attemptList || `<tr><td colspan="4" class="empty">No attempts yet.</td></tr>`}</tbody></table>
    </div>
  </div>
  `;
}

function renderQuiz(courseId, quizId) {
  const db = loadDB();
  const course = db.courses.find(c=>c.id===courseId);
  const quiz = course?.quizzes?.find(q=>q.id===quizId);
  if (!course || !quiz) return `<div class="empty">Quiz not found.</div>`;
  const qHtml = quiz.questions.map((q,idx)=>`
    <div class="card">
      <div class="card-body">
        <div><b>Q${idx+1}.</b> ${q.text}</div>
        <div style="margin-top:8px">
          ${q.options.map((opt,i)=>`
            <label style="display:flex;gap:8px;align-items:center;margin:6px 0">
              <input type="radio" name="q_${q.id}" value="${i}">
              <span>${opt}</span>
            </label>
          `).join("")}
        </div>
      </div>
    </div>
  `).join("");

  return `
    ${h1(`Attempt: ${quiz.title}`)}
    <div class="small">Course: ${course.title}</div>
    <form id="quizForm" style="margin-top:12px">
      ${qHtml}
      <div class="actions" style="margin-top:12px">
        <button class="btn primary" type="submit">Submit Quiz</button>
        <a class="btn ghost" href="#dashboard-student">Cancel</a>
      </div>
    </form>
  `;
}

function evaluateQuiz(courseId, quizId, form) {
  const db = loadDB();
  const auth = getAuth();
  const me = db.users.find(u=>u.id===auth.userId);
  const course = db.courses.find(c=>c.id===courseId);
  const quiz = course?.quizzes?.find(q=>q.id===quizId);
  if (!quiz) return;

  let score = 0;
  const answers = [];
  quiz.questions.forEach(q => {
    const v = form[`q_${q.id}`];
    const idx = v ? Number(v.value) : -1;
    answers.push(idx);
    if (idx === q.correctIndex) score += 1;
  });
  const total = quiz.questions.length;
  const pointsAwarded = score * 10;

  me.points = (me.points||0) + pointsAwarded;

  // badges
  me.badges = me.badges || [];
  db.badges.forEach(b => {
    if ((me.points||0) >= b.threshold && !me.badges.includes(b.id)){
      me.badges.push(b.id);
    }
  });

  db.attempts.push({
    id: uid(),
    userId: me.id,
    quizId,
    courseId,
    score,
    total,
    answers,
    createdAt: Date.now()
  });

  saveDB(db);

  const feedback = quiz.questions.map((q, i) => {
    const ok = answers[i] === q.correctIndex;
    return `<div class="card">
      <div class="card-body">
        <div><b>Q${i+1}.</b> ${q.text}</div>
        <div class="small">Your answer: ${answers[i] >= 0 ? q.options[answers[i]] : "—"}</div>
        <div class="small">Correct answer: <b>${q.options[q.correctIndex]}</b></div>
        <div class="badge ${ok?"ok":"warn"}">${ok ? "Correct" : "Incorrect"}</div>
      </div>
    </div>`;
  }).join("");

  $("#app").innerHTML = `
    ${h1("Quiz Results")}
    <div class="card">
      <div class="card-body">
        <div class="kpi">${score}/${total}</div>
        <div class="small">Points earned: ${pointsAwarded}</div>
        <div class="actions" style="margin-top:8px">
          <a class="btn ok" href="#dashboard-student">Back to Dashboard</a>
          <a class="btn" href="#leaderboard">View Leaderboard</a>
        </div>
      </div>
    </div>
    <h2>Feedback</h2>
    ${feedback}
  `;
}

/* ---------------------------- Faculty ---------------------------- */
function renderFacultyDashboard() {
  const auth = getAuth();
  const db = loadDB();
  const myCourses = db.courses.filter(c=>c.facultyId===auth.userId);

  const myCourseCards = myCourses.map(c=>`
    <div class="card">
      <div class="card-head">
        <h3>${c.title}</h3>
        <div class="actions">
          <a class="btn" href="#course/${c.id}">Open</a>
          <button class="btn warn" data-delcourse="${c.id}">Delete</button>
        </div>
      </div>
      <div class="card-body">
        <div class="tag">${c.quizzes?.length || 0} quizzes</div>
      </div>
    </div>
  `).join("");

  return `
    ${h1("Faculty Dashboard")}
    <div class="card">
      <div class="card-body">
        <form id="newCourseForm">
          <div class="form-row">
            <div>
              <label>Course Title</label>
              <input required name="title" placeholder="e.g., Data Structures"/>
            </div>
          </div>
          <div class="actions" style="margin-top:12px">
            <button class="btn primary" type="submit">Add Course</button>
          </div>
        </form>
      </div>
    </div>

    <h2>Your Courses</h2>
    <div class="grid cols-2">${myCourseCards || `<div class="empty">No courses yet. Create one above.</div>`}</div>
  `;
}

function renderCourseDetail(courseId) {
  const db = loadDB();
  const c = db.courses.find(x=>x.id===courseId);
  if(!c) return `<div class="empty">Course not found.</div>`;

  c.materials = c.materials || [];
  const materialsList = c.materials.map(m=>`
    <tr>
      <td><a href="${m.url}" target="_blank" rel="noopener">${m.title}</a></td>
      <td class="actions">
        <button class="btn warn" data-delmat="${m.id}">Delete</button>
      </td>
    </tr>
  `).join("");

  const quizList = (c.quizzes||[]).map(q=>`
    <tr>
      <td>${q.title}</td>
      <td>${q.questions.length}</td>
      <td class="actions">
        <a class="btn" href="#quiz-builder/${c.id}/${q.id}">Edit</a>
        <button class="btn warn" data-delquiz="${q.id}">Delete</button>
      </td>
    </tr>
  `).join("");

  return `
    ${h1(`Course: ${c.title}`)}

    <div class="card" style="margin-top:12px">
      <div class="card-body">
        <h3>Upload Material</h3>
        <form id="newMaterialForm">
          <div class="form-row">
            <div>
              <label>Title</label>
              <input required name="title" placeholder="e.g., Week 1 Slides"/>
            </div>
            <div>
              <label>URL</label>
              <input required type="url" name="url" placeholder="https://..."/>
            </div>
          </div>
          <div class="actions" style="margin-top:12px">
            <button class="btn primary" type="submit">Add Material</button>
          </div>
        </form>
      </div>
    </div>

    <h2>Materials</h2>
    <div class="card">
      <div class="card-body">
        <table class="table">
          <thead><tr><th>Title</th><th>Actions</th></tr></thead>
          <tbody>${materialsList || `<tr><td colspan="2" class="empty">No materials yet.</td></tr>`}</tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top:12px">
      <div class="card-body">
        <form id="newQuizForm">
          <div class="form-row">
            <div>
              <label>Quiz Title</label>
              <input required name="title" placeholder="e.g., Week 1 Quiz"/>
            </div>
          </div>
          <div class="actions" style="margin-top:12px">
            <button class="btn primary" type="submit">Add Quiz</button>
            <a class="btn ghost" href="#dashboard-faculty">Back</a>
          </div>
        </form>
      </div>
    </div>

    <h2>Quizzes</h2>
    <div class="card">
      <div class="card-body">
        <table class="table">
          <thead><tr><th>Title</th><th># Questions</th><th>Actions</th></tr></thead>
          <tbody>${quizList || `<tr><td colspan="3" class="empty">No quizzes yet.</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderQuizBuilder(courseId, quizId) {
  const db = loadDB();
  const c = db.courses.find(x=>x.id===courseId);
  const q = c?.quizzes?.find(x=>x.id===quizId);
  if(!c || !q) return `<div class="empty">Quiz not found.</div>`;

  const qRows = q.questions.map((ques, idx)=>`
  <div class="card">
    <div class="card-body">
      <div class="form-row">
        <div>
          <label>Question ${idx+1}</label>
          <input data-qid="${ques.id}" data-field="text" value="${escapeHtml(ques.text)}"/>
        </div>
        <div>
          <label>Correct Option Index (0‑${ques.options.length-1})</label>
          <input type="number" min="0" max="${ques.options.length-1}" data-qid="${ques.id}" data-field="correctIndex" value="${ques.correctIndex}"/>
        </div>
      </div>
      <label>Options (one per line)</label>
      <textarea rows="3" data-qid="${ques.id}" data-field="options">${escapeHtml(ques.options.join("\n"))}</textarea>
      <div class="actions" style="margin-top:8px">
        <button class="btn warn" data-delq="${ques.id}">Delete Question</button>
      </div>
    </div>
  </div>
  `).join("");

  return `
    ${h1(`Edit Quiz: ${q.title}`)}
    <div class="card">
      <div class="card-body">
        <form id="addQuestionForm">
          <div class="form-row">
            <div>
              <label>Question Text</label>
              <input name="text" required placeholder="Type the question"/>
            </div>
            <div>
              <label>Options (comma separated)</label>
              <input name="options" required placeholder="A,B,C,D"/>
            </div>
          </div>
          <div class="form-row">
            <div>
              <label>Correct Option Index (0‑based)</label>
              <input name="correctIndex" type="number" min="0" value="0"/>
            </div>
          </div>
          <div class="actions" style="margin-top:8px">
            <button class="btn primary" type="submit">Add Question</button>
            <a class="btn ghost" href="#course/${c.id}">Done</a>
          </div>
        </form>
      </div>
    </div>

    <h2>Questions</h2>
    ${qRows || `<div class="empty">No questions yet.</div>`}

    <div class="actions" style="margin-top:16px">
      <button class="btn ok" id="saveQuizBtn">Save Changes</button>
      <a class="btn ghost" href="#course/${c.id}">Back to Course</a>
    </div>
  `;
}

/* ---------------------------- Admin ---------------------------- */
function renderAdminDashboard() {
  const db = loadDB();
  const users = db.users.map(u=>`
    <tr>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td><span class="tag">${u.role}</span></td>
      <td>${u.points||0}</td>
      <td class="actions">
        <button class="btn" data-role="${u.id}" data-newrole="student">Make Student</button>
        <button class="btn" data-role="${u.id}" data-newrole="faculty">Make Faculty</button>
        <button class="btn warn" data-deluser="${u.id}">Delete</button>
      </td>
    </tr>
  `).join("");

  return `
    ${h1("Admin Dashboard")}
    <div class="grid cols-2">
      <div class="card">
        <div class="card-head"><h3>Users</h3></div>
        <div class="card-body">
          <table class="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Points</th><th>Actions</th></tr></thead>
            <tbody>${users || `<tr><td colspan="5" class="empty">No users.</td></tr>`}</tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Courses</h3></div>
        <div class="card-body">
          <table class="table">
            <thead><tr><th>Title</th><th>Faculty</th><th># Quizzes</th></tr></thead>
            <tbody>
              ${db.courses.map(c=>{
                const fac = db.users.find(u=>u.id===c.facultyId);
                return `<tr><td>${c.title}</td><td>${fac?.name||"-"}</td><td>${c.quizzes?.length||0}</td></tr>`
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/* ---------------------------- Event Binding & Guards ---------------------------- */
function bindEvents(path) {
  const auth = getAuth();

  if (path === "login") {
    $("#loginForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const email = (fd.get("email")+"").trim().toLowerCase();
      const pass = fd.get("password")+"";
      const db = loadDB();
      let user = db.users.find(u=>u.email === email);
      if (!user) {
        alert("No account found. Please register.");
        return navigate("register");
      }
      // set password if empty
      if (!user.passHash) {
        user.passHash = await sha256(pass);
        saveDB(db);
      }
      const ok = user.passHash === await sha256(pass);
      if (!ok) return alert("Invalid credentials.");
      setAuth({ userId: user.id, role: user.role, email: user.email, name: user.name });
      renderNav();
      if (user.role === "student") navigate("dashboard-student");
      else if (user.role === "faculty") navigate("dashboard-faculty");
      else navigate("dashboard-admin");
    });
  }

  if (path === "register") {
    $("#regForm")?.addEventListener("submit", async (e)=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const name = (fd.get("name")+"").trim();
      const email = (fd.get("email")+"").trim().toLowerCase();
      const role = fd.get("role")+"";
      const pass = fd.get("password")+"";
      const db = loadDB();
      if (db.users.some(u=>u.email===email)) return alert("Email already exists.");
      const user = { id: "u-" + uid(), name, email, role, passHash: await sha256(pass), points: 0, badges: [] };
      db.users.push(user);
      saveDB(db);
      setAuth({ userId: user.id, role: user.role, email: user.email, name: user.name });
      renderNav();
      navigate(role === "faculty" ? "dashboard-faculty" : "dashboard-student");
    });
  }

  if (path === "dashboard-faculty") {
    $("#newCourseForm")?.addEventListener("submit", (e)=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const title = (fd.get("title")+"").trim();
      const db = loadDB();
      db.courses.push({ id: "c-"+uid(), title, facultyId: auth.userId, quizzes: [], materials: [] });
      saveDB(db);
      navigate("dashboard-faculty");
    });
    $$("[data-delcourse]")?.forEach(btn=>btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-delcourse");
      const db = loadDB();
      const idx = db.courses.findIndex(c=>c.id===id && c.facultyId===auth.userId);
      if (idx>=0){
        if (confirm("Delete this course?")) {
          db.courses.splice(idx,1);
          saveDB(db);
          navigate("dashboard-faculty");
        }
      }
    }));
  }

  if (path.startsWith("course/")) {
    const [, courseId] = path.split("/");
    $("#newMaterialForm")?.addEventListener("submit", (e)=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const title = (fd.get("title")+"").trim();
      const url = (fd.get("url")+"").trim();
      const db = loadDB();
      const c = db.courses.find(x=>x.id===courseId);
      c.materials = c.materials || [];
      c.materials.push({ id: uid(), title, url });
      saveDB(db);
      navigate(`course/${courseId}`);
    });
    $("#newQuizForm")?.addEventListener("submit", (e)=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const title = (fd.get("title")+"").trim();
      const db = loadDB();
      const c = db.courses.find(x=>x.id===courseId);
      c.quizzes = c.quizzes || [];
      c.quizzes.push({ id: "q-"+uid(), title, questions: [] });
      saveDB(db);
      navigate(`course/${courseId}`);
    });
    $$("[data-delquiz]")?.forEach(btn => btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-delquiz");
      const db = loadDB();
      const c = db.courses.find(x=>x.id===courseId);
      const idx = c.quizzes.findIndex(q=>q.id===id);
      if (idx>=0 && confirm("Delete this quiz?")){
        c.quizzes.splice(idx,1);
        saveDB(db);
        navigate(`course/${courseId}`);
      }
    }));
    $$("[data-delmat]")?.forEach(btn => btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-delmat");
      const db = loadDB();
      const c = db.courses.find(x=>x.id===courseId);
      const idx = (c.materials||[]).findIndex(m=>m.id===id);
      if (idx>=0 && confirm("Delete this material?")){
        c.materials.splice(idx,1);
        saveDB(db);
        navigate(`course/${courseId}`);
      }
    }));
  }

  if (path.startsWith("quiz-builder/")) {
    const [, courseId, quizId] = path.split("/");
    $("#addQuestionForm")?.addEventListener("submit", (e)=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const text = (fd.get("text")+"").trim();
      const opts = (fd.get("options")+"").split(",").map(s=>s.trim()).filter(Boolean);
      const correctIndex = Number(fd.get("correctIndex"));
      if (correctIndex<0 || correctIndex>=opts.length) return alert("Correct index out of range.");
      const db = loadDB();
      const c = db.courses.find(x=>x.id===courseId);
      const q = c.quizzes.find(x=>x.id===quizId);
      q.questions.push({ id: uid(), text, options: opts, correctIndex });
      saveDB(db);
      navigate(`quiz-builder/${courseId}/${quizId}`);
    });

    // Save question edits
    $("#saveQuizBtn")?.addEventListener("click", ()=>{
      const db = loadDB();
      const c = db.courses.find(x=>x.id===courseId);
      const q = c.quizzes.find(x=>x.id===quizId);
      const inputs = $$("[data-qid][data-field]");
      const grouped = {};
      inputs.forEach(inp => {
        const id = inp.getAttribute("data-qid");
        const field = inp.getAttribute("data-field");
        grouped[id] = grouped[id] || {};
        grouped[id][field] = inp.value;
      });
      q.questions = q.questions.map(ques => {
        const g = grouped[ques.id];
        if (!g) return ques;
        const updated = {...ques};
        if ("text" in g) updated.text = g.text;
        if ("correctIndex" in g) updated.correctIndex = Number(g.correctIndex);
        if ("options" in g) updated.options = g.options.split("\n").map(s=>s.trim()).filter(Boolean);
        if (updated.correctIndex<0 || updated.correctIndex>=updated.options.length) updated.correctIndex = 0;
        return updated;
      });
      saveDB(db);
      alert("Quiz saved.");
    });

    $$("[data-delq]")?.forEach(btn => btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-delq");
      const db = loadDB();
      const c = db.courses.find(x=>x.id===courseId);
      const q = c.quizzes.find(x=>x.id===quizId);
      const idx = q.questions.findIndex(qq=>qq.id===id);
      if (idx>=0 && confirm("Delete this question?")){
        q.questions.splice(idx,1);
        saveDB(db);
        navigate(`quiz-builder/${courseId}/${quizId}`);
      }
    }));
  }

  if (path.startsWith("quiz/")) {
    const [, courseId, quizId] = path.split("/");
    $("#quizForm")?.addEventListener("submit", (e)=>{
      e.preventDefault();
      evaluateQuiz(courseId, quizId, e.target);
    });
  }

  if (path === "dashboard-admin") {
    $$("[data-role]")?.forEach(btn => btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-role");
      const newRole = btn.getAttribute("data-newrole");
      const db = loadDB();
      const u = db.users.find(x=>x.id===id);
      if (u){
        u.role = newRole;
        saveDB(db);
        navigate("dashboard-admin");
      }
    }));
    $$("[data-deluser]")?.forEach(btn => btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-deluser");
      const db = loadDB();
      const idx = db.users.findIndex(x=>x.id===id);
      if (idx>=0 && confirm("Delete this user?")){
        db.users.splice(idx,1);
        // cleanup attempts
        db.attempts = db.attempts.filter(a=>a.userId!==id);
        saveDB(db);
        navigate("dashboard-admin");
      }
    }));
    // Optional: allow admin to delete courses
    // Bind dynamically via data attribute if present
    $$("[data-adm-delcourse]")?.forEach(btn => btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("[data-adm-delcourse]");
    }));
  }
}

function guard(path) {
  const auth = getAuth();
  const pub = ["home", "login", "register", "leaderboard"];
  if (pub.includes(path)) return true;
  if (!auth) { navigate("login"); return false; }
  if (path.startsWith("dashboard-student") && auth.role!=="student") { navigate("home"); return false; }
  if (path.startsWith("dashboard-faculty") && auth.role!=="faculty") { navigate("home"); return false; }
  if (path.startsWith("dashboard-admin") && auth.role!=="admin") { navigate("home"); return false; }
  if (path.startsWith("course/") && auth.role!=="faculty") { navigate("home"); return false; }
  if (path.startsWith("quiz-builder/") && auth.role!=="faculty") { navigate("home"); return false; }
  if (path.startsWith("quiz/") && auth.role!=="student") { navigate("home"); return false; }
  return true;
}

/* ---------------------------- Render Engine ---------------------------- */
function renderApp() {
  renderNav();
  const hash = location.hash.replace(/^#/, "") || "home";
  if (!guard(hash)) return;
  const app = $("#app");
  let html = "";
  switch(true){
    case hash==="home": html = renderHome(); break;
    case hash==="login": html = renderLogin(); break;
    case hash==="register": html = renderRegister(); break;
    case hash==="leaderboard": html = renderLeaderboard(); break;
    case hash==="dashboard-student": html = renderStudentDashboard(); break;
    case hash==="dashboard-faculty": html = renderFacultyDashboard(); break;
    case hash==="dashboard-admin": html = renderAdminDashboard(); break;
    case /^materials\//.test(hash): {
      const [, cId] = hash.split("/");
      html = renderMaterials(cId);
      break;
    }
    case /^course\//.test(hash): html = renderCourseDetail(hash.split("/")[1]); break;
    case /^quiz-builder\//.test(hash): {
      const [, cId, qId] = hash.split("/");
      html = renderQuizBuilder(cId, qId);
      break;
    }
    case /^quiz\//.test(hash): {
      const [, cId, qId] = hash.split("/");
      html = renderQuiz(cId, qId);
      break;
    }
    default: html = `<div class="empty">Not Found</div>`; break;
  }
  app.innerHTML = html;
  bindEvents(hash);
}

/* ---------------------------- Helpers ---------------------------- */
function escapeHtml(s){
  return (s+"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

/* ---------------------------- Read-Only Materials View (Student) ---------------------------- */
function renderMaterials(courseId){
  const db = loadDB();
  const c = db.courses.find(x=>x.id===courseId);
  if(!c) return `<div class="empty">Course not found.</div>`;
  const items = (c.materials||[]).map(m=>`
    <tr>
      <td>${m.title}</td>
      <td><a class="btn" href="${m.url}" target="_blank" rel="noopener">Open</a></td>
    </tr>
  `).join("");
  return `
    ${h1(`Materials: ${c.title}`)}
    <div class="card">
      <div class="card-body">
        <table class="table">
          <thead><tr><th>Title</th><th></th></tr></thead>
          <tbody>${items || `<tr><td colspan="2" class="empty">No materials available.</td></tr>`}</tbody>
        </table>
        <div class="actions" style="margin-top:12px">
          <a class="btn ghost" href="#dashboard-student">Back</a>
        </div>
      </div>
    </div>
  `;
}

// Seed database once on first load
loadDB();
