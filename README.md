TaskFlow: A Collaborative Project Management Platform
TaskFlow is a full-stack MERN application designed to streamline project management and team collaboration. It features an interactive Kanban board, real-time chat, and AI-powered task summarization, all built on a modern, scalable architecture.

Live Demo:

Frontend (Vercel): https://task-flow-eta-virid.vercel.app/

Backend (Render): https://taskflow-backend-hgcz.onrender.com/

Core Features
Secure User Authentication: Full signup, login, and logout functionality using JSON Web Tokens (JWT) for secure, stateless sessions.

Project Management (CRUD): Users can create, view, edit, and delete their projects from a central dashboard.

Collaborative Workspace: Project admins can invite new members by email, manage member roles (admin/member), and remove users from a project.

Interactive Kanban Board: A drag-and-drop interface (@hello-pangea/dnd) for managing tasks across "To Do," "In Progress," and "Done" columns.

Real-Time Task & Chat Updates: Integrated Socket.io for instant updates across all connected clients. When one user moves a task or sends a chat message, everyone in the project sees the change immediately without needing to refresh.

AI-Powered Summarization: An integrated AI feature that can automatically summarize long task descriptions, helping teams quickly grasp the core objective.

Technology Stack
This project was built using the MERN stack and deployed on modern hosting platforms.

Frontend:

Framework: React with Next.js

Styling: Tailwind CSS

State Management: React Context API

Real-Time: Socket.io Client

Drag & Drop: @hello-pangea/dnd

Backend:

Runtime: Node.js

Framework: Express.js

Database: MongoDB with Mongoose

Authentication: JSON Web Token (JWT)

Real-Time: Socket.io

Email: Nodemailer (for password resets)

Deployment:

Frontend: Vercel

Backend: Render

Database: MongoDB Atlas

Deployment Journey & Key Learnings
Deploying a full-stack application from a local machine to a live production environment is a critical skill. This project's journey involved solving several real-world deployment challenges:

CORS (Cross-Origin Resource Sharing): The most significant hurdle was the net::ERR_FAILED (preflight) error. This occurred because our Vercel frontend and Render backend were on different domains.

Solution: We implemented a unified CORS strategy on the backend, creating a whitelist of allowed origins (localhost for development and the Vercel URL for production) that was applied to both the Express API and the Socket.io server.

Hardcoded localhost URLs: After fixing CORS, we encountered net::ERR_CONNECTION_REFUSED errors.

Solution: We systematically replaced every hardcoded http://localhost:5001 URL in the frontend with process.env.NEXT_PUBLIC_API_URL. This crucial step ensured the deployed frontend called the live Render API, not the local one.

Backend Crashes (500 Internal Server Error): The signup feature was crashing the server.

Solution: We diagnosed a mismatch between the frontend sending a username field and the backend expecting a name field. We synchronized both the frontend form and the backend controller/model to use username, and we implemented robust error handling on the backend to prevent future crashes.

Data Inconsistency ("Unknown User"): The frontend was displaying placeholders like "?" and "Unknown User."

Solution: This was traced back to the backend API not sending complete data. We updated every relevant controller (projects.js, tasks.js, chat.js) to use Mongoose's .populate() method, ensuring that related user details (like name and email) were always included in the API response.

Local Setup & Installation
To run this project on your local machine:

1. Clone the repository:

git clone [https://github.com/IsaHaameem/TaskFlow.git](https://github.com/IsaHaameem/TaskFlow.git)
cd TaskFlow

2. Backend Setup:

cd backend
npm install

Create a .env file in the backend directory and add the following variables:

PORT=5001
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
JWT_EXPIRE=30d
# Add email credentials for Nodemailer if testing password reset

Start the backend server:

npm start

3. Frontend Setup:

cd ../frontend
npm install

Create a .env.local file in the frontend directory and add the following:

NEXT_PUBLIC_API_URL=http://localhost:5001

Start the frontend development server:

npm run dev

Your application will be available at http://localhost:3000.
