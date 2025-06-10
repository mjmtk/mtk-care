# MTK Care - Django & Next.js Application

This project is a full-stack application featuring a Django backend and a Next.js frontend, with Azure AD authentication.

## Project Structure

-   `/backend`: Contains the Django backend application.
-   `/frontend`: Contains the Next.js frontend application.

## Prerequisites

-   Python 3.10+
-   Poetry (for backend Python dependencies)
-   Node.js 18+
-   npm or yarn (for frontend JavaScript dependencies)
-   Azure AD tenant and application registrations for both backend and frontend.

## Setup

* code server password :

```bash
    docker exec -it mtk_code_server env | grep -i password
```

### Backend

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Create a Python virtual environment and install dependencies:**
    ```bash
    poetry install
    ```
3.  **Set up environment variables:**
    Copy `.env.example` (if it exists) to `.env` and fill in the required values, especially:
    -   `SECRET_KEY`
    -   `AZURE_CLIENT_ID` (Backend App Registration Client ID)
    -   `AZURE_TENANT_ID`
    -   `DATABASE_URL` (if not using SQLite default)
4.  **Apply database migrations:**
    ```bash
    poetry run python manage.py migrate
    ```
5.  **Load initial data fixtures:**
    ```bash
    cd .. # Go back to project root
    ./scripts/load_fixtures.sh
    ```
    This will load all necessary option lists, reference data (countries, languages), and other initial data required for the application to function properly.

### Frontend

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```
3.  **Set up environment variables:**
    Create a `.env.local` file in the `frontend` directory and add the following, replacing placeholder values:
    ```env
    # For NextAuth Azure AD Provider (Frontend App Registration)
    AZURE_AD_CLIENT_ID="YOUR_FRONTEND_APP_REG_CLIENT_ID"
    AZURE_AD_CLIENT_SECRET="YOUR_FRONTEND_APP_REG_CLIENT_SECRET"
    AZURE_AD_TENANT_ID="YOUR_TENANT_ID"

    # For NextAuth
    NEXTAUTH_URL="http://localhost:3000" # Or your frontend dev port if different
    NEXTAUTH_SECRET="generate_a_strong_random_secret" # e.g., openssl rand -hex 32

    # Custom scope for backend API
    NEXT_PUBLIC_AZURE_AD_BACKEND_API_SCOPE="api://YOUR_BACKEND_APP_REG_CLIENT_ID/your_scope_name"
    # e.g., api://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/access_as_user

    # Backend API URL
    NEXT_PUBLIC_DJANGO_API_URL="http://localhost:8000/api"
    ```

## Running the Application

### Backend

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Start the Django development server:**
    ```bash
    poetry run python manage.py runserver
    ```
    The backend will typically run on `http://127.0.0.1:8000`.

### Frontend

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Start the Next.js development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    The frontend will typically run on `http://localhost:3000`.

## Key Features Implemented

-   Django backend with Ninja API.
-   Next.js frontend with App Router.
-   Azure AD authentication integrated between frontend (NextAuth.js) and backend (custom JWT validation).
    -   Frontend requests access token for custom backend API scope.
    -   Backend validates v1.0 Azure AD JWTs (audience, issuer, signature).
    -   User provisioning and profile updates based on token claims.
-   Basic API endpoint `/api/profile` protected by Azure AD authentication.
