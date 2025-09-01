const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const db = new sqlite3.Database("library.db");

// Middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: "library-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Initialize database tables
db.serialize(() => {
  // Students table
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);

  // Admin table
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);

  // Books table
  db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT UNIQUE NOT NULL,
    available INTEGER DEFAULT 1
  )`);

  // Logs table
  db.run(`CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    book_id INTEGER,
    issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    return_date DATETIME,
    FOREIGN KEY (student_id) REFERENCES students (id),
    FOREIGN KEY (book_id) REFERENCES books (id)
  )`);

  // Insert sample data
  const hashedPassword = bcrypt.hashSync("password123", 10);
  const adminHashedPassword = bcrypt.hashSync("pass@1234", 10);

  db.run(
    `INSERT OR IGNORE INTO students (name, email, password) VALUES 
    ('Om Kulkarni', 'omkulkarni@email.com', ?),
    ('Pratik Kamble', 'pratikkamble@email.com', ?),
    ('Aditya Shinde', 'adityashinde@email.com', ?),
    ('Shruti Patil', 'pratikkamble@email.com', ?),
    ('Sachin Deshmukh', 'sachindeshmukh@email.com', ?)`,
    [hashedPassword, hashedPassword, hashedPassword]
  );

  // Insert admin user
  db.run(
    `INSERT OR IGNORE INTO admins (username, password) VALUES ('admin#12', ?)`,
    [adminHashedPassword]
  );

  db.run(`INSERT OR IGNORE INTO books (title, author, isbn) VALUES 
    ('The Great Gatsby', 'F. Scott Fitzgerald', '978-0-7432-7356-5'),
    ('To Kill a Mockingbird', 'Harper Lee', '978-0-06-112008-4'),
    ('1984', 'George Orwell', '978-0-452-28423-4'),
    ('Pride and Prejudice', 'Jane Austen', '978-0-14-143951-8'),
    ('The Catcher in the Rye', 'J.D. Salinger', '978-0-316-76948-0')`);
});

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.studentId) {
    next();
  } else {
    res.redirect("/login");
  }
};

// Admin authentication middleware
const requireAdminAuth = (req, res, next) => {
  if (req.session.adminId) {
    next();
  } else {
    res.redirect("/admin-login");
  }
};

// Routes
app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM students WHERE email = ?", [email], (err, user) => {
    if (err) {
      return res.render("login", { error: "Database error" });
    }

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.render("login", { error: "Invalid email or password" });
    }

    req.session.studentId = user.id;
    req.session.studentName = user.name;
    res.redirect("/dashboard");
  });
});

app.get("/register", (req, res) => {
  res.render("register", { error: null, success: null });
});

app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    "INSERT INTO students (name, email, password) VALUES (?, ?, ?)",
    [name, email, hashedPassword],
    function (err) {
      if (err) {
        return res.render("register", {
          error: "Email already exists",
          success: null,
        });
      }
      res.render("register", {
        error: null,
        success: "Registration successful! You can now login.",
      });
    }
  );
});

app.get("/dashboard", requireAuth, (req, res) => {
  const studentId = req.session.studentId;

  // Get borrowed books with issue/return info
  db.all(
    `
    SELECT b.title, b.author, l.issue_date, l.return_date, l.id as log_id
    FROM logs l
    JOIN books b ON l.book_id = b.id
    WHERE l.student_id = ?
    ORDER BY l.issue_date DESC
  `,
    [studentId],
    (err, books) => {
      if (err) {
        return res.render("dashboard", {
          studentName: req.session.studentName,
          books: [],
          totalBorrowed: 0,
        });
      }

      res.render("dashboard", {
        studentName: req.session.studentName,
        books: books || [],
        totalBorrowed: books ? books.length : 0,
      });
    }
  );
});

app.get("/admin-login", (req, res) => {
  res.render("admin-login", { error: null });
});

app.post("/admin-login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM admins WHERE username = ?",
    [username],
    (err, admin) => {
      if (err) {
        return res.render("admin-login", { error: "Database error" });
      }

      if (!admin || !bcrypt.compareSync(password, admin.password)) {
        return res.render("admin-login", {
          error: "Invalid username or password",
        });
      }

      req.session.adminId = admin.id;
      req.session.adminUsername = admin.username;
      res.redirect("/admin");
    }
  );
});

app.get("/admin", requireAdminAuth, (req, res) => {
  // Get all books
  db.all("SELECT * FROM books ORDER BY title", (err, books) => {
    if (err) {
      return res.render("admin", { books: [], students: [], message: null });
    }

    // Get all students
    db.all(
      "SELECT id, name, email FROM students ORDER BY name",
      (err2, students) => {
        if (err2) {
          return res.render("admin", {
            books: books || [],
            students: [],
            message: null,
          });
        }

        res.render("admin", {
          books: books || [],
          students: students || [],
          message: null,
          session: req.session,
        });
      }
    );
  });
});

app.post("/admin/add-book", requireAdminAuth, (req, res) => {
  const { title, author, isbn } = req.body;

  db.run(
    "INSERT INTO books (title, author, isbn) VALUES (?, ?, ?)",
    [title, author, isbn],
    function (err) {
      if (err) {
        return res.redirect("/admin?error=Failed to add book");
      }
      res.redirect("/admin?success=Book added successfully");
    }
  );
});

app.post("/admin/issue-book", requireAdminAuth, (req, res) => {
  const { bookId, studentId } = req.body;

  // Check if book is available
  db.get(
    "SELECT * FROM books WHERE id = ? AND available = 1",
    [bookId],
    (err, book) => {
      if (err || !book) {
        return res.redirect("/admin?error=Book not available");
      }

      // Issue the book
      db.run(
        "INSERT INTO logs (student_id, book_id) VALUES (?, ?)",
        [studentId, bookId],
        function (err) {
          if (err) {
            return res.redirect("/admin?error=Failed to issue book");
          }

          // Update book availability
          db.run(
            "UPDATE books SET available = 0 WHERE id = ?",
            [bookId],
            (err) => {
              if (err) {
                return res.redirect(
                  "/admin?error=Failed to update book status"
                );
              }
              res.redirect("/admin?success=Book issued successfully");
            }
          );
        }
      );
    }
  );
});

app.post("/admin/return-book", requireAdminAuth, (req, res) => {
  const { logId } = req.body;

  // Get the log entry to find the book
  db.get(
    "SELECT * FROM logs WHERE id = ? AND return_date IS NULL",
    [logId],
    (err, log) => {
      if (err || !log) {
        return res.redirect("/admin?error=Invalid return request");
      }

      // Update return date
      db.run(
        "UPDATE logs SET return_date = CURRENT_TIMESTAMP WHERE id = ?",
        [logId],
        (err) => {
          if (err) {
            return res.redirect("/admin?error=Failed to return book");
          }

          // Update book availability
          db.run(
            "UPDATE books SET available = 1 WHERE id = ?",
            [log.book_id],
            (err) => {
              if (err) {
                return res.redirect(
                  "/admin?error=Failed to update book availability"
                );
              }
              res.redirect("/admin?success=Book returned successfully");
            }
          );
        }
      );
    }
  );
});

app.get("/admin/issued-books", requireAdminAuth, (req, res) => {
  db.all(
    `
    SELECT l.id as log_id, b.title, b.author, s.name as student_name, l.issue_date
    FROM logs l
    JOIN books b ON l.book_id = b.id
    JOIN students s ON l.student_id = s.id
    WHERE l.return_date IS NULL
    ORDER BY l.issue_date DESC
  `,
    (err, issuedBooks) => {
      if (err) {
        return res.render("issued-books", { books: [] });
      }
      res.render("issued-books", { books: issuedBooks || [] });
    }
  );
});

app.get("/admin/reports", requireAdminAuth, (req, res) => {
  // Get books not returned
  db.all(
    `
    SELECT b.title, b.author, s.name as student_name, l.issue_date
    FROM logs l
    JOIN books b ON l.book_id = b.id
    JOIN students s ON l.student_id = s.id
    WHERE l.return_date IS NULL
    ORDER BY l.issue_date
  `,
    (err, notReturned) => {
      if (err) {
        notReturned = [];
      }

      // Get top 3 students
      db.all(
        `
      SELECT s.name, s.email, COUNT(l.id) as book_count
      FROM students s
      LEFT JOIN logs l ON s.id = l.student_id
      GROUP BY s.id, s.name, s.email
      ORDER BY book_count DESC
      LIMIT 3
    `,
        (err2, topStudents) => {
          if (err2) {
            topStudents = [];
          }

          res.render("reports", {
            notReturned: notReturned || [],
            topStudents: topStudents || [],
          });
        }
      );
    }
  );
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

app.get("/admin-logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin-login");
});

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
  console.log("Sample login: omkulkarni@email.com / password123");
});
