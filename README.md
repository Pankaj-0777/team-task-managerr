Team Task Manager (Full Stack Project)

This is a full-stack web application where teams can manage projects and tasks. The main idea is to allow admins to create projects, assign tasks to members, and track overall progress.

Tech Stack Used:
Frontend: React.js
Backend: Node.js, Express.js
Database: MongoDB
Authentication: JWT (JSON Web Tokens)
Deployment: Railway (backend) + Vercel (frontend)

---

Features:

1. Authentication

* User signup and login system
* Passwords are hashed using bcrypt
* JWT-based authentication for secure routes

2. Role-Based Access

* Admin and Member roles
* Admin can create projects and assign tasks
* Members can view and update their assigned tasks

3. Project Management

* Admin can create projects
* Add or remove members from projects
* Members can see projects they are part of

4. Task Management

* Tasks can be assigned to users
* Each task has status (To Do, In Progress, Done)
* Members can update their task progress

5. Dashboard

* Shows total tasks
* Shows tasks by status
* Shows overdue tasks
* Displays overall progress

---

Folder Structure:

backend/

* models/ (User, Project, Task)
* routes/ (auth, projects, tasks)
* middleware/ (auth + role based)
* server.js

frontend/

* pages/ (Login, Signup, Dashboard, Projects)
* components/ (Navbar, Cards)
* api/ (axios setup)
* context/ (AuthContext)

---

How to Run Locally:

1. Clone the repo

2. Install backend dependencies:
   cd backend
   npm install

3. Install frontend dependencies:
   cd frontend
   npm install

4. Create .env file in backend:
   MONGO_URI=your_mongodb_url
   JWT_SECRET=your_secret

5. Run backend:
   npm run dev

6. Run frontend:
   npm start

---

Live Links:

Frontend (Vercel):
https://team-task-managerr-s3zoxo6ur-pankaj-0777s-projects.vercel.app

Backend (Railway):
https://team-task-managerr-production.up.railway.app



Conclusion:

This project helped me understand full-stack development, authentication, API design, and deployment. I also learned how to handle real-world issues like CORS, environment variables, and debugging production errors.

---
