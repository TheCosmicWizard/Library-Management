# 📚 Library Management System

A **Library Management System** built with **Node.js, Express, EJS, and SQLite**, featuring **dual authentication** (Students & Admins), book tracking, reports, and overdue management.  
Designed for educational purposes and real-world library workflows.

---

## ✨ Features

### 👥 Dual Authentication
- **Student Login** → View personal dashboard, borrowed books, and history.  
- **Admin Login** → Full control over books, students, and reports.  
- Secure password hashing (bcrypt) & session-based authentication.  

### 📚 Book Management
- Add, edit, delete books with **real-time availability status**.  
- ISBN validation with duplicate prevention.  
- Automatic status updates when books are issued/returned.  

### 📋 Issue & Return
- Issue books to registered students.  
- Process returns with **date tracking**.  
- Overdue & unreturned book detection.  
- Full transaction history maintained.  

### 🎓 Student Features
- Personal borrowing history.  
- Track issued & returned books.  
- Lifetime stats: total books borrowed.  
- Intuitive student dashboard.  

### 👨‍💼 Admin Features
- Manage complete book inventory.  
- Oversee student registration.  
- Monitor issued & overdue books.  
- Generate reports & statistics.  

### 📊 Reports & Analytics
- Books not yet returned (overdue).  
- **Top 3 most active borrowers**.  
- Borrowing trends & statistics.  
- Real-time system status view.  

---

# 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v14+)  
- npm (comes with Node.js)  

### Installation
```bash
# Clone repository
git clone https://github.com/<your-username>/library-management-system.git
cd library-management-system
```


### Install dependencies
```bash
# Install all required dependencies
npm install
```

### Run Application
```bash
# Development (auto restart on changes)
npm run dev

# Production
npm start
```


# 🌐 Access
Open browser → [http://localhost:3000](http://localhost:3000)  

Database & sample data auto-created on first run.

---

## 🔐 Sample Login Credentials

### 👥 Student Access
**Sample Login:**  
- Email: `omkulkarni@email.com`  
- Password: `password123`  

### 👨‍💼 Admin Access
**Admin Credentials:**  
- Username: `admin#12`  
- Username: `admin#145`  
- Password: `pass@1234`  

---

### 🛠️ Project Structure
```bash
library-management-system/
├── server.js # Main server
├── package.json # Dependencies & scripts
├── library.db # SQLite DB (auto-created)
├── views/ # EJS templates
│ ├── login.ejs
│ ├── admin-login.ejs
│ ├── register.ejs
│ ├── dashboard.ejs
│ ├── admin.ejs
│ ├── issued-books.ejs
│ └── reports.ejs
└── README.md
```

---

## 🐛 Troubleshooting

### Database Errors
```bash
rm library.db
npm start
```
---

## Contributing
- Fork the repository
- Create a branch: git checkout -b feature-name
- Commit: git commit -m "Add new feature"
- Push: git push origin feature-name
- Open a Pull Request

---

### License
 - This project is licensed under the MIT License – free to use, modify, and distribute with proper attribution.

