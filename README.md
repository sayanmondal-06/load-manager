# Lead Manager – Mini CRM

A full-stack Lead Management application developed as part of the Full Stack Developer Internship Assignment for **Meru Technosoft Pvt. Ltd.**

The application allows users to manage business leads through a simple dashboard, with features for creating, viewing, updating, searching, filtering, and deleting leads.

## Features

- Add new leads with contact and company information.
- View all leads in a structured table.
- Edit existing lead information.
- Delete leads with confirmation.
- Search leads by name.
- Filter leads by status.
- Dashboard statistics showing total leads and status-wise counts.
- Frontend and backend form validation.
- International phone number validation with country codes.

## Technology Stack

**Frontend**
- React.js
- Vite
- CSS

**Backend**
- Node.js
- Express.js

**Database**
- PostgreSQL

**Other Tools**
- Git and GitHub
- npm
- Postman / PowerShell for API testing

## Project Structure

```text
lead-manager/
│
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── ...
│
├── db.js
├── server.js
├── package.json
├── .env
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd lead-manager
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Install frontend dependencies

```bash
cd client
npm install
```

### 4. Configure PostgreSQL

Create a PostgreSQL database named:

```sql
CREATE DATABASE lead_manager;
```

Connect to the `lead_manager` database and create the leads table:

```sql
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(100),
    source VARCHAR(50),
    status VARCHAR(20) DEFAULT 'New',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Configure environment variables

Create a `.env` file in the project root:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=lead_manager
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
DB_PORT=5432
PORT=5000
```

Replace `YOUR_POSTGRES_PASSWORD` with your local PostgreSQL password.

**Important:** Never upload your `.env` file or database credentials to GitHub.

### 6. Start the backend

From the project root:

```bash
node server.js
```

The backend runs at:

```text
http://localhost:5000
```

### 7. Start the frontend

Open another terminal:

```bash
cd client
npm run dev
```

Open the Vite URL displayed in your terminal, usually:

```text
http://localhost:5173
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/leads` | Retrieve all leads |
| GET | `/api/leads?search=name` | Search leads by name |
| GET | `/api/leads?status=New` | Filter leads by status |
| GET | `/api/leads/stats` | Retrieve dashboard statistics |
| POST | `/api/leads` | Create a new lead |
| PUT | `/api/leads/:id` | Update an existing lead |
| DELETE | `/api/leads/:id` | Delete a lead |

## Validation Rules

- Name is mandatory.
- Email is mandatory and must have a valid format.
- Phone number is mandatory and supports international country codes.
- Phone numbers must contain between 7 and 15 digits.
- Company name is optional.
- Source must be selected from the available options.
- Status must be one of: New, Contacted, Qualified, or Lost.

Validation is implemented on both the frontend and backend.

## Future Improvements

- User authentication and role-based access.
- Pagination and sorting.
- More advanced search options.
- Lead activity history.
- Cloud deployment.

## Author

Developed as a Full Stack Developer Internship Assignment for Meru Technosoft Pvt. Ltd.