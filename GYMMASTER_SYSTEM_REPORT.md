# GymMaster — Complete System Architecture & Technical Report

---

## Executive Summary

**GymMaster** is a full-stack web application designed for gym members and gym administrators. It streamlines member onboarding, gym membership plan discovery, subscription selection, exercise exploration, member feedback, and administrative oversight.

The system is built on the industry-standard **MERN architecture** (MongoDB, Express.js, React, Node.js) with **Vite** as the frontend bundler and build tool, and **JSON Web Tokens (JWT)** for stateless, secure role-based access control (RBAC).

This report is structured as an authoritative, beginner-friendly technical guide. It breaks down every subsystem, database model, API endpoint, security mechanism, and end-to-end data flow with concrete examples taken directly from the GymMaster codebase.

---

## 1. Project Architecture & Technology Stack

### 1.1 High-Level Architecture Diagram

```
+------------------------------------------------------------------------+
|                              CLIENT (BROWSER)                          |
|  React 18 + Vite (Port 5173)                                           |
|  - UI Components & Tailwind CSS Styling                                |
|  - React Router DOM v6 (Client-side routing)                           |
|  - Auth Context & Cart Context (Global client state in LocalStorage)   |
|  - Axios HTTP Client (Authorization: Bearer <JWT Token>)               |
+-----------------------------------+------------------------------------+
                                    |
                          HTTP / REST API (JSON)
                                    |
+-----------------------------------v------------------------------------+
|                         BACKEND SERVER (Node.js)                       |
|  Express.js 4 (Port 5000, ES Modules)                                  |
|  - CORS & Body-Parser Middleware                                       |
|  - JWT Authentication Middleware (requireSignIn, isAdmin)              |
|  - REST API Routes: /api/v1/auth, /plan, /subscription, /contact, etc. |
|  - Controllers: Business Logic, Input Validation, Password Hashing     |
+-----------------------------------+------------------------------------+
                                    |
                           Mongoose ODM Driver
                                    |
+-----------------------------------v------------------------------------+
|                         DATABASE (CLOUD ATLAS)                         |
|  MongoDB Atlas Cluster (Database: "test")                              |
|  Collections:                                                          |
|  - users          (Member & Admin accounts)                            |
|  - plans          (Gym membership packages)                            |
|  - subscriptions  (Active user-to-plan subscriptions)                  |
|  - feedbacks      (Member ratings & reviews)                           |
|  - contacts       (Public inquiry submissions)                         |
+------------------------------------------------------------------------+
```

### 1.2 Technology Breakdown: What Each Tool Does

| Technology | Layer | Role in GymMaster |
| :--- | :--- | :--- |
| **React 18** | Frontend Library | Builds a reactive **Single Page Application (SPA)**. Instead of refreshing the entire page on every link click, React dynamically swaps components in the DOM. |
| **Vite 5** | Build Tool / Dev Server | Provides Lightning-fast Hot Module Replacement (HMR) during development and bundles frontend code into optimized static HTML, CSS, and JS for production. |
| **Node.js 20** | Backend Runtime | Executes JavaScript on the server. Handles asynchronous file, network, and operating system I/O via an event-driven, non-blocking architecture. |
| **Express.js 4** | Backend Web Framework | Organizes server logic into clean routing tables, middleware pipelines, and controllers that handle incoming HTTP requests and return JSON responses. |
| **MongoDB Atlas** | Cloud Database | A cloud-hosted NoSQL document database. Stores data as flexible, schema-free JSON-like BSON documents across globally distributed replica sets. |
| **Mongoose 8** | ODM (Object Data Modeling) | Sits on top of MongoDB in Node.js to enforce structured schemas, validate required fields, handle relationships between documents, and cast IDs. |
| **JSON Web Tokens (JWT)** | Authentication | Provides stateless authentication. Encrypts user identity (`_id`) in a digitally signed string so the backend can verify logged-in users without storing session tables in memory. |
| **Bcrypt.js** | Cryptography | One-way hashing algorithm with random salting. Guarantees that raw user passwords are never stored in plain text or leaked. |
| **Tailwind CSS & AOS** | UI & Animations | Utility-first CSS framework for modern, responsive dark/light styling combined with Animate On Scroll (AOS) for smooth visual transitions. |
| **RapidAPI ExerciseDB** | External API (Optional) | Third-party gym workout database providing 1,300+ exercises with animated demonstration GIFs. GymMaster integrates this with a self-contained offline fallback catalog. |

---

### 1.3 Repository Folder Structure & File Responsibilities

```
gym-master-deployed/
├── client/                               # Frontend React + Vite application
│   ├── .env                              # Frontend environment config (VITE_DEV_API, VITE_RAPID_API_KEY)
│   ├── index.html                        # Single Page HTML entry point
│   ├── package.json                      # Frontend dependencies (React, Axios, Tailwind, Lucide, AOS)
│   ├── vite.config.js                    # Vite bundler configuration
│   └── src/
│       ├── main.jsx                      # Application bootstrap (mounts React root into DOM)
│       ├── App.jsx                       # Master router table, route guards, toast notifications
│       ├── index.css                     # Global Tailwind CSS directives and custom scrollbars
│       ├── components/                   # Reusable UI widgets
│       │   ├── Header.jsx                # Navigation bar, auth buttons, admin links, mobile drawer
│       │   ├── Footer.jsx                # Footer links, branding, gym contact info
│       │   ├── Plans.jsx                 # Dynamic plan cards grid with subscribe action buttons
│       │   ├── SearchInput.jsx           # Exercise search bar and body part filter pills
│       │   ├── ExerciseCard.jsx          # Workout card showing GIF, target muscle, and favorites button
│       │   ├── Spinner.jsx               # Countdown loader for unauthorized redirect handling
│       │   ├── admin/
│       │   │   ├── AdminMenu.jsx         # Sidebar navigation for admin dashboard
│       │   │   └── AdminRoute.jsx        # Route guard checking backend /api/v1/auth/admin-auth
│       │   └── user/
│       │       ├── UserMenu.jsx          # Sidebar navigation for regular member dashboard
│       │       └── PrivateRoute.jsx      # Route guard verifying user login token
│       ├── context/                      # React Context Providers (Global State)
│       │   ├── auth.jsx                  # Stores current user profile and JWT token; syncs to LocalStorage
│       │   └── cart.jsx                  # Stores user's favorite exercises in LocalStorage
│       ├── pages/                        # Route page views
│       │   ├── Home.jsx                  # Hero banner, features, trending plans, trainers, testimonials
│       │   ├── Login.jsx                 # User email & password login form
│       │   ├── Register.jsx              # Member account registration form
│       │   ├── ForgotPassword.jsx        # Password reset flow
│       │   ├── Contact.jsx               # Public contact & inquiry form
│       │   ├── Feedback.jsx              # Member rating (1-5 stars) and review submission form
│       │   ├── Exercise.jsx              # Full exercise directory with live search and filter
│       │   ├── ExerciseDetail.jsx        # In-depth exercise details, target muscles, and video guides
│       │   ├── PlanSubscription.jsx      # Plan duration selection & checkout interface
│       │   ├── PlanDetails.jsx           # Feature-by-feature breakdown of a selected gym plan
│       │   ├── Admin/                    # Admin-only management views
│       │   │   ├── AdminDashBoard.jsx    # System metrics (total users, plans, subscriptions, inquiries)
│       │   │   ├── CreatePlan.jsx        # Form to create new gym membership plans
│       │   │   ├── Plans.jsx             # Admin table to view, edit, or delete existing gym plans
│       │   │   ├── UpdatePlan.jsx        # Form to modify pricing and perks of an existing plan
│       │   │   ├── UserList.jsx          # Table of all registered members with contact details
│       │   │   ├── SubscriberList.jsx    # Table of active subscriptions with user & plan details
│       │   │   ├── ContactUs.jsx         # Inquiry inbox displaying user queries
│       │   │   └── FeedbackList.jsx      # Table of member feedback with ratings and delete controls
│       │   └── User/                     # Regular member dashboard views
│       │       ├── UserDashBoard.jsx     # Member welcome overview
│       │       ├── Profile.jsx           # Update personal contact details, city, or password
│       │       ├── PlanDetail.jsx        # Current active gym plan and renewal information
│       │       ├── FavouriteExercises.jsx# Member's saved workout routines (from LocalStorage)
│       │       └── Feedbacks.jsx         # Member's submitted feedback with delete option
│       └── utils/
│           ├── fetchData.jsx             # Axios/fetch wrapper with RapidAPI headers & BASE_URL
│           └── fallbackExercises.js      # Offline catalog of 14 exercises & 11 body parts
│
└── server/                               # Backend Node.js + Express application
    ├── .env                              # Server environment secrets (PORT, MONGO_URI, JWT_SECRET)
    ├── package.json                      # Backend dependencies (Express, Mongoose, Bcrypt, JWT, Dotenv)
    ├── app.js                            # Express app initialization, CORS, route mounting, startup
    ├── controlllers/                     # Business logic and database operations (3 'l's in folder name)
    │   ├── authController.js             # Register, login, profile, user count, password reset
    │   ├── PlanCategoryController.js     # Create, read, update, and delete gym membership plans
    │   ├── subscriptionController.js     # Create, read, and cancel member plan subscriptions
    │   ├── contactController.js          # Create inquiries, list inquiries, inquiry counter
    │   └── feedbackController.js         # Submit feedback, list reviews, delete member feedback
    ├── helpers/
    │   └── authHelper.js                 # Bcrypt hashing and password comparison functions
    ├── Middlewares/
    │   └── authMiddleware.js             # requireSignIn (JWT check), isAdmin (role 1 check)
    ├── models/                           # Mongoose data schemas
    │   ├── User.js                       # User account schema (name, email, password, role)
    │   ├── Plan.js                       # Membership plan schema (pricing, amenities, features)
    │   ├── Subscription.js               # Plan subscription schema (references User and Plan)
    │   ├── ContactUs.js                  # Inquiry message schema (name, email, message, phone)
    │   └── Feedback.js                   # Feedback schema (references User, rating, message)
    ├── routes/                           # Express REST route endpoints
    │   ├── authRoute.js                  # /api/v1/auth
    │   ├── planCategoryRoute.js          # /api/v1/plan
    │   ├── subscriptionRoute.js          # /api/v1/subscription
    │   ├── contactRoute.js               # /api/v1/contact
    │   └── feedBackRoute.js              # /api/v1/feedback
    ├── scripts/                          # Maintenance & administrative CLI utilities
    │   ├── makeAdmin.js                  # Promotes any existing user account to admin role (role: 1)
    │   └── seedData.js                   # Optional safe seeder for initial gym membership plans
    └── utils/
        └── connectDB.js                  # Safe, credential-sanitized Mongoose connection handler
```

---

## 2. Complete Database Documentation

### 2.1 Core Concepts Explained: Database vs. Collection vs. Document vs. Model

In a relational database (like MySQL or PostgreSQL), data is stored in **tables** with fixed rows and columns. In **MongoDB**, the terminology and storage model are different:

1. **Database:** The top-level container in MongoDB (in GymMaster, this is named `test` on MongoDB Atlas). It holds multiple collections.
2. **Collection:** A group of MongoDB documents (analogous to a table in SQL). However, collections do not enforce a fixed tabular structure at the database level.
3. **Document:** An individual record stored in BSON format (Binary JSON). Each document has a unique identifier field named `_id` generated automatically by MongoDB.
4. **Mongoose Model:** A JavaScript programming construct that acts as a wrapper around a MongoDB collection. It provides methods like `.find()`, `.create()`, `.findByIdAndUpdate()`, and `.deleteOne()` while validating data against a defined **Schema**.

```
+-------------------------------------------------------------+
| DATABASE: "test"                                            |
|                                                             |
|   +-------------------+     +---------------------------+   |
|   | COLLECTION: users |     | COLLECTION: plans         |   |
|   |                   |     |                           |   |
|   | [Document 1: John]|     | [Document 1: Basic Plan]  |   |
|   | [Document 2: Jane]|     | [Document 2: Gold Plan]   |   |
|   +---------+---------+     +-------------+-------------+   |
|             |                             |                 |
|             +--------------+--------------+                 |
|                            | (Referenced via ObjectId)      |
|                            v                                |
|             +-------------------------------+               |
|             | COLLECTION: subscriptions     |               |
|             |                               |               |
|             | [Document 1: John -> Gold]    |               |
|             +-------------------------------+               |
+-------------------------------------------------------------+
```

---

### 2.2 In-Depth Schema Inspection for All Models

#### Model 1: `User` (`server/models/User.js`)
Represents every registered account in the system (both regular gym members and gym administrators).

- **Mongoose Collection Name:** `users`
- **Timestamps:** Enabled (`createdAt`, `updatedAt` added automatically)
- **Fields:**
  - `name` (String, required): Full name of the user. Trimming and alphabetic validations enforced in controller.
  - `email` (String, required, `unique: true`): User's primary login identifier. Indexed uniquely so no two accounts can share an email.
  - `password` (String, required): Bcrypt-hashed password string. Raw plain-text passwords are never saved.
  - `city` (String, required): Residential city of the member.
  - `contact` (String, required): 10-digit mobile phone number.
  - `role` (Number, `default: 0`): Access control level:
    - `0`: Regular member (default for all public registrations).
    - `1`: Gym Administrator (granted via `makeAdmin.js` CLI script).
- **CRUD Operations:**
  - *Create:* Public registration (`POST /api/v1/auth/register`).
  - *Read:* Login authentication (`POST /api/v1/auth/login`), profile retrieval, admin member list (`GET /api/v1/auth/get-all-users`), total count (`GET /api/v1/auth/total-user`).
  - *Update:* Member profile update (`PUT /api/v1/auth/user-profile`), password reset (`POST /api/v1/auth/forgot-password`).
  - *Delete:* Not exposed in UI (accounts remain intact for auditing).

---

#### Model 2: `Plan` (`server/models/Plan.js`)
Represents membership packages offered by the gym, detailing monthly and yearly costs along with included amenities.

- **Mongoose Collection Name:** `plans`
- **Timestamps:** Enabled (`createdAt`, `updatedAt`)
- **Fields:**
  - `userName` (String, `default: undefined`): Optional metadata tag.
  - `planName` (String, required, `unique: true`): Name of the plan (e.g., "Basic Fitness", "Standard Pro", "VIP Elite").
  - `monthlyPlanAmount` (String, required): Monthly membership fee in local currency (e.g., "1200").
  - `yearlyPlanAmount` (String, required): Discounted annual membership fee (e.g., "12000").
  - `waterStations` (String, required): "Available" or "Not Available".
  - `lockerRooms` (String, required): "Available" or "Not Available".
  - `wifiService` (String, required): "Available" or "Not Available".
  - `cardioClass` (String, required): "Available" or "Not Available".
  - `refreshment` (String, required): "Available" or "Not Available".
  - `groupFitnessClasses` (String, required): "Available" or "Not Available".
  - `personalTrainer` (String, required): "Available" or "Not Available".
  - `specialEvents` (String, required): "Available" or "Not Available".
  - `cafeOrLounge` (String, required): "Available" or "Not Available".
- **CRUD Operations:**
  - *Create:* Admin plan creator (`POST /api/v1/plan/create-plan`).
  - *Read:* Homepage plan cards (`GET /api/v1/plan/getall-plan`), plan details page (`GET /api/v1/plan/get-plan/:planid`), plan count (`GET /api/v1/plan/total-plan`).
  - *Update:* Admin edit plan (`PUT /api/v1/plan/update-plan/:planid`).
  - *Delete:* Admin delete plan (`DELETE /api/v1/plan/delete-plan/:planid`) — **Cascading Delete:** Also removes all associated subscriptions connected to this plan ID!

---

#### Model 3: `Subscription` (`server/models/Subscription.js`)
Represents an active membership agreement between a specific user and a specific gym plan.

- **Mongoose Collection Name:** `subscriptions`
- **Timestamps:** Enabled (`createdAt`, `updatedAt`)
- **Fields:**
  - `userName` (String, required): Name of the subscribing member.
  - `planType` (String, required): Duration selected (e.g., "1 Month", "3 Month", "6 Month", "1 Year").
  - `planAmount` (String, required): Total price paid/calculated for the chosen duration.
  - `user` (Mongoose `ObjectId`, `ref: "User"`): Foreign key link referencing the member's document in the `users` collection.
  - `plan` (Mongoose `ObjectId`, `ref: "Plan"`): Foreign key link referencing the package document in the `plans` collection.
- **Relationships:** Uses Mongoose **Population** (`.populate('user')` and `.populate('plan')`) to join documents across collections dynamically.
- **Constraint:** Business logic in `subscriptionController.js` enforces that a user can only have **one active subscription** at a time.
- **CRUD Operations:**
  - *Create:* Member checkout form (`POST /api/v1/subscription/create-subscription`).
  - *Read:* Member dashboard (`GET /api/v1/auth/get-user-plan` & `/get-all-user-plan`), admin subscriber list (`GET /api/v1/subscription/getall-subscription`).
  - *Update:* Subscription modifier (`PUT /api/v1/subscription/update-subscription/:id`).
  - *Delete:* Admin cancel subscription (`DELETE /api/v1/subscription/delete-subscription/:id`).

---

#### Model 4: `Feedback` (`server/models/Feedback.js`)
Represents member reviews and star ratings.

- **Mongoose Collection Name:** `feedbacks`
- **Fields:**
  - `user` (Mongoose `ObjectId`, `ref: "User"`, required): Foreign key linking the review to the authoring member.
  - `message` (String, required): Textual feedback review.
  - `rating` (Number, required, `min: 1`, `max: 5`): Rating from 1 (poor) to 5 (excellent).
  - `date` (Date, `default: Date.now`): Timestamp of review submission.
- **Constraint:** Each user is restricted to **one active review**; attempting to submit a second returns an error directing the user to edit or delete their existing review first.
- **CRUD Operations:**
  - *Create:* Member feedback page (`POST /api/v1/feedback/create-feedback`).
  - *Read:* Public testimonials & admin review list (`GET /api/v1/feedback/getall-feedback`), user reviews (`GET /api/v1/auth/get-all-user-feedback`).
  - *Update:* Member review editor (`PUT /api/v1/feedback/update-feedback/:id`).
  - *Delete:* Admin or user delete review (`DELETE /api/v1/feedback/delete-feedback/:id`).

---

#### Model 5: `ContactUs` (`server/models/ContactUs.js`)
Represents customer support inquiries, feedback, or prospective member inquiries submitted from the website.

- **Mongoose Collection Name:** `contacts`
- **Timestamps:** Enabled (`createdAt`, `updatedAt`)
- **Fields:**
  - `name` (String, required): Name of the inquiring visitor.
  - `email` (String, required): Contact email address.
  - `city` (String, required): City of residence.
  - `phone` (String, required): 10-digit mobile number.
  - `message` (String, required): Inquiry message text.
- **CRUD Operations:**
  - *Create:* Public contact form (`POST /api/v1/contact/create-contact`).
  - *Read:* Admin inbox (`GET /api/v1/contact/getall-contact`), total inquiries count (`GET /api/v1/contact/total-contact`).
  - *Update:* None (inquiries are read-only records).
  - *Delete:* Not implemented in UI.

---

### 2.3 Master Database Mapping Table

| Model Name | MongoDB Collection | Document Description | Primary Controllers | Active In Database? |
| :--- | :--- | :--- | :--- | :--- |
| **User** | `users` | Member credentials, contact info, and roles (`0`=Member, `1`=Admin) | `authController.js` | **Yes** (3 verified documents) |
| **Plan** | `plans` | Gym packages, monthly/yearly pricing, and 9 amenity flags | `PlanCategoryController.js` | **Yes** (5 verified documents) |
| **Subscription** | `subscriptions` | Active gym passes linking a User ID and Plan ID | `subscriptionController.js` | **Yes** (2 verified documents) |
| **Feedback** | `feedbacks` | Member reviews and 1-5 star ratings | `feedbackController.js` | **Yes** (2 verified documents) |
| **Contact** | `contacts` | Public inquiry messages and prospective member leads | `contactController.js` | **Yes** (2 verified documents) |

---

## 3. MongoDB Atlas Storage & Connection Mechanics

### 3.1 How the Backend Connects to Atlas

In `server/app.js` and `server/utils/connectDB.js`, the application connects using **Mongoose 8**:

```javascript
// server/utils/connectDB.js
import mongoose from "mongoose";

const connectDB = async (url) => {
  if (!url) {
    throw new Error("MONGO_URI is missing or undefined in environment variables.");
  }
  await mongoose.connect(url);
  console.log("✅ MongoDB Connected Successfully");
};

export default connectDB;
```

**Startup Sequencing:** `app.js` uses an `async startServer()` function. Express is intentionally **not started** until `await connectDB(...)` resolves successfully. If the database is unreachable or credentials are bad, startup aborts immediately with a safe, credential-sanitized error.

### 3.2 How the Database Name Is Selected

A standard MongoDB SRV connection URI follows this structure:

```
mongodb+srv://<username>:<password>@<cluster-address>.mongodb.net/<databaseName>?retryWrites=true&w=majority
```

- If a database name is explicitly specified between `.net/` and `?` (for example, `.net/gymmaster?`), Mongoose stores all collections in the `gymmaster` database.
- If the path between `.net/` and `?` is empty or left as `/`, MongoDB Atlas defaults to the standard database named **`test`**.
- In this project, the live database is **`test`**.

### 3.3 Why No Tables Needed to Be Created Manually: Lazy Creation

In SQL databases (like MySQL), you must run DDL queries (`CREATE TABLE users (...)`) before you can insert a single row.

MongoDB is **schema-less and dynamic**:
1. When you run `mongoose.model("User", userSchema)`, Mongoose does not immediately create a collection in Atlas.
2. The collection is only created in Atlas **when the very first document is saved** (e.g., `await new User({...}).save()`). This is known as **Lazy Collection Creation**.
3. If an application feature has never successfully saved a record (for example, if plan creation was previously failing due to duplicate key errors), that collection **does not exist yet** in the Atlas web interface.
4. As soon as a record is saved, Atlas creates the collection and builds the indexes automatically.

### 3.4 Live Database Inspection Status (Read-Only Audit)

A non-destructive, read-only inspection of the active MongoDB Atlas cluster confirmed:
- **Connected Database:** `test`
- **Total Collections:** 5
- **Verified Document Counts:**
  - `users`: **3** documents
  - `plans`: **5** documents
  - `subscriptions`: **2** documents
  - `feedbacks`: **2** documents
  - `contacts`: **2** documents

All 5 application models are actively persisting real data to MongoDB Atlas.

---

## 4. End-to-End Traces of 12 Real User Actions

The table below traces user actions from the user's browser click, through the network and Express pipeline, to the database and back:

```
[User Click] ──> [React Component] ──> [Axios Request] ──> [Express Route] ──> [Middleware] ──> [Controller] ──> [Mongoose Model] ──> [MongoDB Atlas]
```

### Detailed Flow Traces

#### Flow 1: Register a New Account
1. **Frontend Component:** `client/src/pages/Register.jsx`
2. **Trigger Function:** `onSubmit(e)`
3. **HTTP Call:** `POST /api/v1/auth/register` with `{ name, email, password, city, contact }`
4. **Backend Route:** `server/routes/authRoute.js` -> `router.post("/register", registerController)`
5. **Controller:** `registerController` in `server/controlllers/authController.js`
6. **Mongoose Model & Action:** `User.findOne({ email })` (checks for duplicates). If unique, calls `hashPassword(password)` then `new User({... role: 0 }).save()`.
7. **Database Operation:** **INSERT** (Create) a document in `users` collection.
8. **Auth/Admin Check:** Public (no authentication required). Default `role: 0` is strictly assigned.
9. **Response:** Status `201 Created` with sanitized `{ success: true, message: "User registered successfully", user: { ...no password } }`.

#### Flow 2: Log In & Receive Authentication Token
1. **Frontend Component:** `client/src/pages/Login.jsx`
2. **Trigger Function:** `onSubmit(e)`
3. **HTTP Call:** `POST /api/v1/auth/login` with `{ email, password }`
4. **Backend Route:** `server/routes/authRoute.js` -> `router.post("/login", loginController)`
5. **Controller:** `loginController` in `server/controlllers/authController.js`
6. **Mongoose Model & Action:** `User.findOne({ email })`. Uses `comparePassword(password, user.password)` via Bcrypt.
7. **Database Operation:** **READ** from `users` collection.
8. **Token Generation:** `JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })`.
9. **Response:** Status `200 OK` with `{ success: true, user: { name, email, city, contact, role, _id }, token }`.
10. **Client Action:** `setAuth({ user, token })` and `localStorage.setItem("auth", JSON.stringify(res.data))`.

#### Flow 3: Access an Admin-Only Page
1. **Frontend Component:** `client/src/components/admin/AdminRoute.jsx` wrapping `<Outlet />` for `/dashboard/admin/*`
2. **Trigger Function:** `useEffect()` on route transition.
3. **HTTP Call:** `GET /api/v1/auth/admin-auth` with `Authorization: Bearer <token>`
4. **Backend Route:** `server/routes/authRoute.js` -> `router.get("/admin-auth", requireSignIn, isAdmin, (req, res) => res.json({ ok: true }))`
5. **Middleware Pipeline:**
   - `requireSignIn`: Decodes JWT token and attaches payload to `req.user`.
   - `isAdmin`: Queries `User.findById(req.user._id)`. Checks if `user.role === 1`.
6. **Database Operation:** **READ** from `users` collection.
7. **Result:** If `user.role === 1`, returns `{ ok: true }` and React renders `<AdminDashBoard />`. If unauthorized, redirects to member dashboard or login via `<Spinner />`.

#### Flow 4: Create a Gym Plan in Admin Dashboard
1. **Frontend Component:** `client/src/pages/Admin/CreatePlan.jsx`
2. **Trigger Function:** `createPlan(e)`
3. **HTTP Call:** `POST /api/v1/plan/create-plan` with plan details and amenities.
4. **Backend Route:** `server/routes/planCategoryRoute.js` -> `router.post("/create-plan", requireSignIn, isAdmin, createplanController)`
5. **Controller:** `createplanController` in `server/controlllers/PlanCategoryController.js`
6. **Mongoose Model & Action:** `Plan.findOne({ planName })`. If unique, `new Plan({ ... }).save()`.
7. **Database Operation:** **INSERT** (Create) a document in `plans` collection.
8. **Auth/Admin Check:** Requires valid JWT AND `role === 1`.
9. **Response:** Status `201 Created` with `{ success: true, message: "plan created successfully", userPlan }`.

#### Flow 5: Display Plans on the Homepage
1. **Frontend Component:** `client/src/components/Plans.jsx` (mounted in `Home.jsx`)
2. **Trigger Function:** `getAllPlans()` called in `useEffect()` on mount.
3. **HTTP Call:** `GET /api/v1/plan/getall-plan`
4. **Backend Route:** `server/routes/planCategoryRoute.js` -> `router.get("/getall-plan", getAllPlanController)`
5. **Controller:** `getAllPlanController` in `server/controlllers/PlanCategoryController.js`
6. **Mongoose Model & Action:** `Plan.find({})`
7. **Database Operation:** **READ** all documents from `plans` collection.
8. **Auth/Admin Check:** Public (no token needed).
9. **Response:** Status `200 OK` with `{ success: true, plans: [...] }`.

#### Flow 6: View Plan Details
1. **Frontend Component:** `client/src/pages/PlanDetails.jsx`
2. **Trigger Function:** `getSinglePlan()` called with URL parameter `planid`.
3. **HTTP Call:** `GET /api/v1/plan/get-plan/:planid`
4. **Backend Route:** `server/routes/planCategoryRoute.js` -> `router.get("/get-plan/:planid", getPlanController)`
5. **Controller:** `getPlanController` in `server/controlllers/PlanCategoryController.js`
6. **Mongoose Model & Action:** `Plan.findById(planid)`
7. **Database Operation:** **READ** single document from `plans` collection.
8. **Response:** Status `200 OK` with `{ success: true, plan: { ...amenities } }`.

#### Flow 7: Subscribe to a Gym Plan
1. **Frontend Component:** `client/src/pages/PlanSubscription.jsx`
2. **Trigger Function:** `onSubmit(e)`
3. **HTTP Call:** `POST /api/v1/subscription/create-subscription` with `{ userName, planType, planAmount, planId }`
4. **Backend Route:** `server/routes/subscriptionRoute.js` -> `router.post("/create-subscription", requireSignIn, createSubscriptionPlanController)`
5. **Controller:** `createSubscriptionPlanController` in `server/controlllers/subscriptionController.js`
6. **Mongoose Model & Action:** Checks `Subscription.findOne({ user: req.user._id })`. If existing, blocks duplicate. Otherwise creates `new Subscription({ userName, planType, planAmount, plan: planId, user: req.user._id }).save()`.
7. **Database Operation:** **INSERT** (Create) a document in `subscriptions` collection.
8. **Auth/Admin Check:** Requires user authentication (`requireSignIn`).
9. **Payment Gateway Note:** Simulated checkout (no live Stripe/Razorpay processing; membership record is created immediately).

#### Flow 8: Submit Member Feedback & Rating
1. **Frontend Component:** `client/src/pages/Feedback.jsx`
2. **Trigger Function:** `handleSubmit(e)`
3. **HTTP Call:** `POST /api/v1/feedback/create-feedback` with `{ message, rating }`
4. **Backend Route:** `server/routes/feedBackRoute.js` -> `router.post("/create-feedback", requireSignIn, createFeedback)`
5. **Controller:** `createFeedback` in `server/controlllers/feedbackController.js`
6. **Mongoose Model & Action:** Verifies `Feedback.findOne({ user: req.user._id })` to prevent duplicates. Saves `new Feedback({ user: req.user._id, message, rating }).save()`.
7. **Database Operation:** **INSERT** (Create) a document in `feedbacks` collection.
8. **Auth/Admin Check:** Requires user authentication (`requireSignIn`).
9. **Response:** Status `201 Created` with `{ success: true, message: "Feedback submitted successfully" }`.

#### Flow 9: Submit a Public Contact Form Query
1. **Frontend Component:** `client/src/pages/Contact.jsx`
2. **Trigger Function:** `createQuery(e)`
3. **HTTP Call:** `POST /api/v1/contact/create-contact` with `{ name, email, city, phone, message }`
4. **Backend Route:** `server/routes/contactRoute.js` -> `router.post("/create-contact", createContactController)`
5. **Controller:** `createContactController` in `server/controlllers/contactController.js`
6. **Mongoose Model & Action:** Validates inputs and runs `new Contact({ name, email, city, phone, message }).save()`.
7. **Database Operation:** **INSERT** (Create) a document in `contacts` collection.
8. **Auth/Admin Check:** Public (no authentication required).
9. **Response:** Status `201 Created` with `{ success: true, message: "new Query Submitted Sucessfully", newContact }`.

#### Flow 10: Update User Profile
1. **Frontend Component:** `client/src/pages/User/Profile.jsx`
2. **Trigger Function:** `updateUserProfile(e)`
3. **HTTP Call:** `PUT /api/v1/auth/user-profile` with `{ name, email, city, contact, password? }`
4. **Backend Route:** `server/routes/authRoute.js` -> `router.put("/user-profile", requireSignIn, updateProfileController)`
5. **Controller:** `updateProfileController` in `server/controlllers/authController.js`
6. **Mongoose Model & Action:** If new password provided, hashes via `hashPassword()`. Calls `User.findByIdAndUpdate(req.user._id, { ... }, { new: true })`.
7. **Database Operation:** **UPDATE** document in `users` collection.
8. **Auth/Admin Check:** Requires user authentication (`requireSignIn`).
9. **Response:** Status `200 OK` with `{ success: true, message: "Profile Updated SUccessfully", updatedUser }`.

#### Flow 11: Browse and Search Exercises
1. **Frontend Component:** `client/src/pages/Exercise.jsx` -> `SearchInput.jsx` & `ExerciseCard.jsx`
2. **Trigger Function:** `fetchBodypartsData()` on load, `handleSearch()` on query submit.
3. **Data Source:**
   - *Primary:* RapidAPI ExerciseDB (`https://exercisedb.p.rapidapi.com/exercises`).
   - *Offline/Local Fallback:* If `VITE_RAPID_API_KEY` is not present, loads `client/src/utils/fallbackExercises.js` (14 curated exercises with local images).
4. **Database Operation:** **None** (Exercise data is either fetched from the external API or served from the built-in catalog).
5. **Favorites ("Add to Cart"):** Clicking the favorite button on an exercise card stores the item directly in **browser LocalStorage** under the key `"cart"`, accessed via `useCart()` in `client/src/context/cart.jsx`.

#### Flow 12: User Logout
1. **Frontend Component:** `client/src/components/Header.jsx`
2. **Trigger Function:** `handleLogout()`
3. **Data Flow:**
   - Clears React state: `setAuth({ ...auth, user: null, token: "" })`.
   - Clears browser storage: `localStorage.removeItem("auth")`.
   - Shows feedback: `toast.success("Logout successfully")`.
4. **Network Call:** **None** (JWT is stateless; clearing the token on the client immediately invalidates subsequent authorized requests).

---

## 5. Authentication and Authorization Deep Dive

### 5.1 Password Security: Bcrypt Hashing

GymMaster implements industry-standard password protection using **Bcrypt** in `server/helpers/authHelper.js`:

1. **Salting & Hashing (`hashPassword`):**
   ```javascript
   const saltRounds = 10;
   const hashedPassword = await bcrypt.hash(password, saltRounds);
   ```
   A cryptographic "salt" (random data) is generated with a cost factor of 10 (1024 hashing rounds). This ensures that even identical passwords produce completely different hash strings, defending against Rainbow Table attacks.
2. **Verification (`comparePassword`):**
   ```javascript
   return bcrypt.compare(password, hashedPassword);
   ```
   When logging in, Bcrypt extracts the salt from the stored hash, hashes the incoming candidate password with the same salt, and compares the resulting hashes. The original plain text password is never known to the database.

### 5.2 JSON Web Token (JWT) Lifecycle

```
[Client Login] ───────── (credentials) ─────────> [Backend Server]
                                                         │
                                                  Validates password
                                                  Signs token:
                                                  JWT.sign({ _id }, SECRET, { 7d })
                                                         │
[Client Storage] <─────── { token, user } ───────────────┘
  (localStorage)
        │
        ▼
[Subsequent API Calls] ── (Header: Authorization: <token>) ──> [requireSignIn Middleware]
                                                                        │
                                                                   JWT.verify()
                                                                        │
                                                                 req.user = decode
```

- **Signing:** When a user logs in, `JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })` generates a tamper-proof signed string containing the user's MongoDB ID.
- **Client Storage:** The token is stored in the browser's `localStorage` under `"auth"`.
- **Transmission:** `client/src/context/auth.jsx` automatically configures Axios to send this token on every outgoing request:
  ```javascript
  axios.defaults.headers.common['Authorization'] = auth?.token;
  ```
- **Server Verification (`requireSignIn`):**
  ```javascript
  const decode = JWT.verify(token, process.env.JWT_SECRET);
  req.user = decode;
  ```

### 5.3 Role-Based Access Control: Regular User vs. Admin

GymMaster uses numeric role values:
- `role: 0` = Regular Member
- `role: 1` = Gym Administrator

**Public Registration Guarantee:** In `server/controlllers/authController.js`, registration hardcodes `role: 0`. A public user can never register themselves as an admin by injecting `{ role: 1 }` into the request body.

### 5.4 Two-Layer Protection: Frontend Route vs. Backend API

| Protection Layer | Implementation File | Mechanism | What Happens on Failure? |
| :--- | :--- | :--- | :--- |
| **Frontend Route Guard** | `client/src/components/admin/AdminRoute.jsx` | Checks backend `/api/v1/auth/admin-auth`. | Shows `<Spinner />` and redirects unauthorized users away from admin dashboard pages. |
| **Backend API Guard** | `server/Middlewares/authMiddleware.js` (`isAdmin`) | Verifies `User.findById(req.user._id).role === 1`. | Returns HTTP `401 Unauthorized` with `{ success: false, message: "unAuthorized Access" }`. |

> **Important Presentation Point:** Frontend guards alone are not enough because an attacker can use tools like Postman or cURL to bypass the browser UI. The backend middleware (`requireSignIn` and `isAdmin`) is the true security boundary protecting all sensitive data endpoints.

### 5.5 How to Promote an Account to Administrator

To elevate a user to admin status, run the dedicated CLI utility script located in `server/scripts/makeAdmin.js`:

```powershell
# Navigate to the server directory
cd C:\Users\01\OneDrive\Desktop\GymProject\gym-master-deployed\server

# Run the promotion script with the target user's email
node scripts/makeAdmin.js user@example.com
```

The script connects to MongoDB Atlas, verifies that the user exists, sets `user.role = 1`, and logs a safe confirmation message.

---

## 6. Complete API Endpoint Documentation

The GymMaster backend exposes **22 REST endpoints** grouped into 5 feature domains:

### 6.1 Authentication & User Routes (`/api/v1/auth`)

| Method | Endpoint Path | Purpose | Auth Required? | Admin Required? | Request Body / Params | Expected Response |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new member | No | No | `{ name, email, password, city, contact }` | `201 Created` with sanitized user object |
| `POST` | `/api/v1/auth/login` | Authenticate member | No | No | `{ email, password }` | `200 OK` with user details & JWT token |
| `POST` | `/api/v1/auth/forgot-password` | Reset password | No | No | `{ email, newPassword }` | `200 OK` on password change |
| `GET` | `/api/v1/auth/user-auth` | Verify member login | Yes | No | None (Token in Header) | `200 OK` `{ ok: true }` |
| `GET` | `/api/v1/auth/admin-auth` | Verify admin status | Yes | Yes | None (Token in Header) | `200 OK` `{ ok: true }` |
| `PUT` | `/api/v1/auth/user-profile` | Update profile info | Yes | No | `{ name, email, city, contact, password? }` | `200 OK` with updated user record |
| `GET` | `/api/v1/auth/total-user` | Count total members | No | No | None | `200 OK` `{ success: true, total: N }` |
| `GET` | `/api/v1/auth/get-all-users` | List all members | Yes | Yes | None | `200 OK` with array of all user documents |
| `GET` | `/api/v1/auth/get-user-plan` | Get single user plan | Yes | No | None | `200 OK` with populated plan details |
| `GET` | `/api/v1/auth/get-all-user-plan` | Get all user plans | Yes | No | None | `200 OK` with array of user subscriptions |
| `GET` | `/api/v1/auth/get-all-user-feedback`| Get user's reviews | Yes | No | None | `200 OK` with user's feedback array |
| `GET` | `/api/v1/auth/test` | Test token & admin check | Yes | Yes | None | `200 OK` `{ success: true }` |

### 6.2 Plan Management Routes (`/api/v1/plan`)

| Method | Endpoint Path | Purpose | Auth Required? | Admin Required? | Request Body / Params | Expected Response |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `POST` | `/api/v1/plan/create-plan` | Create new gym plan | Yes | Yes | `{ planName, monthlyPlanAmount, yearlyPlanAmount, waterStations, lockerRooms, wifiService, cardioClass, refreshment, groupFitnessClasses, personalTrainer, specialEvents, cafeOrLounge }` | `201 Created` with new plan document |
| `GET` | `/api/v1/plan/getall-plan` | List all gym plans | No | No | None | `200 OK` `{ success: true, plans: [...] }` |
| `GET` | `/api/v1/plan/get-plan/:planid` | Get single plan by ID | No | No | URL param `:planid` | `200 OK` `{ success: true, plan: {...} }` |
| `PUT` | `/api/v1/plan/update-plan/:planid` | Modify an existing plan | Yes | Yes | URL param `:planid` + updated fields | `200 OK` `{ success: true, updateUserPlan }` |
| `DELETE` | `/api/v1/plan/delete-plan/:planid` | Delete plan & subscriptions | Yes | Yes | URL param `:planid` | `200 OK` (cascades deletion to subscriptions) |
| `GET` | `/api/v1/plan/total-plan` | Count published plans | No | No | None | `200 OK` `{ success: true, total: N }` |

### 6.3 Subscription Routes (`/api/v1/subscription`)

| Method | Endpoint Path | Purpose | Auth Required? | Admin Required? | Request Body / Params | Expected Response |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `POST` | `/api/v1/subscription/create-subscription` | Subscribe to gym plan | Yes | No | `{ userName, planType, planAmount, planId }` | `200 OK` with created subscription record |
| `GET` | `/api/v1/subscription/getall-subscription` | List all subscribers | Yes | Yes | None | `200 OK` with populated user & plan records |
| `GET` | `/api/v1/subscription/get-subscription/:id` | Get subscription by ID | Yes | No | URL param `:id` | `200 OK` with populated subscription details |
| `PUT` | `/api/v1/subscription/update-subscription/:id` | Update subscription | Yes | No | URL param `:id` + updated body | `200 OK` with updated subscription |
| `DELETE` | `/api/v1/subscription/delete-subscription/:id` | Cancel/delete subscription | Yes | Yes | URL param `:id` | `200 OK` `{ success: true }` |
| `GET` | `/api/v1/subscription/total-subscription` | Count all subscriptions | No | No | None | `200 OK` `{ success: true, total: N }` |

### 6.4 Feedback & Review Routes (`/api/v1/feedback`)

| Method | Endpoint Path | Purpose | Auth Required? | Admin Required? | Request Body / Params | Expected Response |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `POST` | `/api/v1/feedback/create-feedback` | Submit member review | Yes | No | `{ message, rating }` | `201 Created` on success |
| `GET` | `/api/v1/feedback/getall-feedback` | List public reviews | No | No | None | `200 OK` with populated user details |
| `GET` | `/api/v1/feedback/getsingle-feedback/:id` | Get review by ID | Yes | No | URL param `:id` | `200 OK` with review record |
| `PUT` | `/api/v1/feedback/update-feedback/:id` | Edit submitted review | Yes | No | URL param `:id` + `{ message, rating }` | `200 OK` with updated review |
| `DELETE` | `/api/v1/feedback/delete-feedback/:id` | Delete member review | Yes | Yes | URL param `:id` | `200 OK` `{ success: true }` |
| `GET` | `/api/v1/feedback/total-feedback` | Count total reviews | No | No | None | `200 OK` `{ success: true, total: N }` |

### 6.5 Contact Inquiry Routes (`/api/v1/contact`)

| Method | Endpoint Path | Purpose | Auth Required? | Admin Required? | Request Body / Params | Expected Response |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `POST` | `/api/v1/contact/create-contact` | Submit contact inquiry | No | No | `{ name, email, city, phone, message }` | `201 Created` with inquiry record |
| `GET` | `/api/v1/contact/getall-contact` | List inquiry inbox | Yes | Yes | None | `200 OK` with array of inquiry messages |
| `GET` | `/api/v1/contact/total-contact` | Count total inquiries | No | No | None | `200 OK` `{ success: true, total: N }` |

---

## 7. Configuration & External Services

### 7.1 Environment Variables Breakdown

The application maintains strict separation between client-side and server-side configurations:

#### Client Configuration (`client/.env`)
- `VITE_DEV_API`: Base URL for backend API requests (e.g., `http://localhost:5000`). Used by Axios to route requests to the correct Express server.
- `VITE_RAPID_API_KEY`: *(Optional)* API key for RapidAPI's ExerciseDB and YouTube Search services.
  - If provided: The application queries live third-party databases for animated workout GIFs and YouTube tutorials.
  - If omitted: The application seamlessly activates the built-in offline library (`fallbackExercises.js`), guaranteeing 0 crashes or blank screens.

#### Server Configuration (`server/.env`)
- `PORT`: Network port for the Express HTTP server (defaults to `5000`).
- `MONGO_URI`: The MongoDB Atlas SRV connection string containing cluster hostname, authentication credentials, and database options.
- `JWT_SECRET`: Secret cryptographic key used by `jsonwebtoken` to digitally sign and verify authentication tokens.

> **Security Rule:** Sensitive credentials like `MONGO_URI` and `JWT_SECRET` must **never** be copied into client `.env` files or committed to public Git repositories. The client `.gitignore` and server `.gitignore` ensure these remain local.

### 7.2 Port Mapping & Local Development Networking

- **Frontend Development Server:** Vite runs on `http://localhost:5173`
- **Backend API Server:** Express runs on `http://localhost:5000`
- **CORS Configuration:** `server/app.js` initializes `app.use(cors())`, allowing the React frontend at port 5173 to execute asynchronous cross-origin requests against the backend at port 5000 without browser CORS policy blocks.

---

## 8. Limitations & Engineering Findings

During the codebase audit, several architectural observations and design constraints were documented:

1. **Simulated Payment Gateway (No Stripe/Razorpay):**
   - *Observation:* The plan checkout flow (`/plan-subscribe/:planid`) calculates total duration costs (e.g., 3 months = monthly fee x 3) and sends a direct `POST` to `/api/v1/subscription/create-subscription`.
   - *Impact:* Subscriptions are created immediately without processing a real credit card or UPI payment. In a production environment, this should be integrated with Stripe, PayPal, or Razorpay webhooks to verify payment before inserting the subscription document.
2. **Subscription Expiration Handling:**
   - *Observation:* Subscriptions store a `planType` string ("1 Month", "1 Year") and a `createdAt` timestamp, but there is no automated background cron job (such as `node-cron` or BullMQ) to mark subscriptions as expired when the duration lapses.
3. **Favorites Stored in LocalStorage:**
   - *Observation:* When a member marks an exercise as a favorite ("Add to Cart"), it is persisted exclusively in browser `localStorage` under the `"cart"` key via `client/src/context/cart.jsx`.
   - *Impact:* Favorites do not sync across different browsers or devices for the same user account because they are not stored in the MongoDB `users` collection.
4. **Trainer Profiles Are Static:**
   - *Observation:* The trainers section on the homepage and the `TrainerDetails.jsx` page use hardcoded profile data and images rather than a database-driven `Trainer` Mongoose model.
5. **Folder Name Typo in Backend:**
   - *Observation:* The backend controller folder is named `controlllers` with three 'l's (`server/controlllers/`). This is preserved throughout the codebase to avoid breaking ES module imports.

---

## 9. Comprehensive Testing & Verification Guide

Follow these manual testing steps to verify all major features during a presentation or technical demonstration:

### Test Case 1: Member Registration
1. Navigate to `http://localhost:5173/register`.
2. Fill in the form: Name (letters and spaces only, e.g. "Alex Morgan"), a unique email address, password (minimum 8 characters with upper, lower, and digit), City, and 10-digit phone number.
3. Submit the form.
4. **Verification:** A green toast displays "User registered successfully", and the page redirects to `/login`. In MongoDB Atlas, inspect the `users` collection in database `test` to confirm the new document with `role: 0`.

### Test Case 2: Member Login & Role Verification
1. Navigate to `http://localhost:5173/login`.
2. Enter the registered email and password.
3. Submit the form.
4. **Verification:** The header updates to show the member's name and a "Logout" button. Clicking the member's name opens `/dashboard/user`. The header does **not** display "Create Plan" (confirming `role: 0`).

### Test Case 3: Admin Authorization & Dashboard Access
1. Promote an account to administrator using the terminal:
   ```powershell
   node server/scripts/makeAdmin.js <user-email>
   ```
2. Log in with the promoted account.
3. **Verification:** The header now displays a **"Create Plan"** link and the member's name links to `/dashboard/admin`. Navigating to `/dashboard/admin` displays the administrative metrics (total users, plans, subscriptions, and inquiries) loaded from the database.

### Test Case 4: Plan Creation & Homepage Display
1. In the admin dashboard, click **"Create Plan"** (`/dashboard/admin/create-plane`).
2. Enter a unique plan name (e.g., "Student Express"), monthly fee, yearly fee, and toggle amenities.
3. Submit the plan.
4. **Verification:** A green toast confirms plan creation. Navigate to the homepage (`/`) and scroll to "Trending Plans" — the new plan is rendered dynamically in the grid.

### Test Case 5: Plan Subscription
1. While logged in as a regular member, click **"Choose Plan"** on any plan card.
2. Select a duration (e.g., "3 Month"). Notice the dynamic price calculation.
3. Click submit.
4. **Verification:** The subscription is saved to the database. Navigate to `/dashboard/user/plan-detail` to view the active membership card showing plan name, price, duration, and subscription date.

### Test Case 6: Member Feedback & Review
1. Click **"Feedback"** in the top navigation (`/feedback`).
2. Select a star rating (1 to 5) and enter a review message.
3. Submit the feedback.
4. **Verification:** A confirmation screen appears. In the admin dashboard (`/dashboard/admin/feedbacks`), the review is visible with author details and rating.

### Test Case 7: Contact Form Inquiry
1. Scroll to the "Contact Us" section on the homepage or open the contact form.
2. Enter name, email, city, 10-digit phone number, and a query message.
3. Submit the inquiry.
4. **Verification:** A success toast appears. Log in as an admin and open `/dashboard/admin/contact-us` to verify that the inquiry message has arrived in the administrative inbox.

### Test Case 8: Exercise Browsing & Offline Fallback
1. Click **"Exercises"** in the navigation bar (`/exercise`).
2. Type "bench" in the search box or click a body part filter (e.g., "chest" or "back").
3. **Verification:** The exercise cards render with animated exercise GIFs, target muscle tags, and a yellow banner confirming that the curated library is active. Clicking an exercise card opens the detailed view (`/exercise/:id`).

---

## 10. Glossary of Technical Terms (Viva / Interview Prep)

- **MERN Stack:** An architectural software stack comprising MongoDB (database), Express.js (backend framework), React (frontend library), and Node.js (runtime environment).
- **Single Page Application (SPA):** A web application that loads a single HTML page and dynamically updates the view as the user interacts with the app, eliminating full-page browser reloads.
- **REST API (Representational State Transfer):** A stateless architectural style for network communication where standard HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) operate on resource endpoints.
- **Endpoint:** A specific URI (e.g., `/api/v1/auth/login`) where an API receives requests and returns data.
- **Middleware:** A software function in Express that intercepts an incoming HTTP request before it reaches the final controller function. Used in GymMaster for logging, parsing request bodies, verifying JWT tokens, and enforcing admin privileges.
- **JSON Web Token (JWT):** A compact, URL-safe standard (RFC 7519) for securely transmitting information between parties as a digitally signed JSON object.
- **Bcrypt & Salt Rounds:** A password hashing algorithm designed to be computationally intensive. The "salt" is a random sequence added to the password before hashing to prevent dictionary and rainbow table attacks.
- **ODM (Object Data Modeling):** A library (like Mongoose) that maps JavaScript objects in application code to document structures in a document database like MongoDB.
- **Schema:** The defined blueprint or structure that specifies the fields, data types, required constraints, and default values of database documents.
- **Population:** A Mongoose feature that replaces a specified path in a document with document(s) from other collections (analogous to a `JOIN` in relational SQL databases).
- **CORS (Cross-Origin Resource Sharing):** A browser security protocol that restricts HTTP requests initiated from scripts outside the domain from which the resource originated.
- **Role-Based Access Control (RBAC):** A security mechanism that restricts system access to authorized users based on designated role levels (e.g., Member = 0, Administrator = 1).
- **Client-Side Routing:** Routing managed in the browser by a library like `react-router-dom` using the HTML5 History API, allowing instantaneous navigation without contacting the web server for new HTML pages.
- **Environment Variables (`.env`):** Key-value pairs stored outside of application source code to configure secrets, API keys, and database connections across development and production environments.
- **Lazy Creation:** MongoDB's behavioral characteristic where a database or collection is not physically created on the server until the first document is inserted into it.
