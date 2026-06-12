# UniRide

UniRide is a university ride-sharing platform built with .NET 8 and React.
It supports ride discovery, reservations, approvals, chat, notifications,
reviews, reports, and an admin console.

## Stack

- Backend: ASP.NET Core Web API, Entity Framework Core, FluentValidation, JWT auth
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand
- Realtime: SignalR for chat updates and unread-count sync
- Dev database: SQLite
- Production database: SQL Server

## Repository layout

```text
UniRide/
  UniRide.sln
  README.md
  src/
    UniRide.API/
    UniRide.Application/
    UniRide.Domain/
    UniRide.Infrastructure/
  frontend/
  tests/
```

## What the app does

- Students can register, update their profile, request verification, find rides,
  reserve seats, chat with drivers, leave reviews, and report users or rides.
- Drivers can create rides, mark them as recurring, approve or reject passengers,
  start and complete rides, and message confirmed passengers.
- Admins can manage users, rides, and reports, plus verify or unverify users.
- Notifications are available in-app and are tied to reservations, chat, reviews,
  verification, and admin actions.

## Run locally

Open two terminals from `C:\Users\Lenovo\source\repos\UniRide`.

### Backend

```powershell
cd src\UniRide.API
dotnet restore
dotnet run
```

The API should start on:

- `https://localhost:49249`
- `http://localhost:49250`

Swagger is available at `https://localhost:49249/swagger`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173/`.

The Vite dev server proxies:

- `/api` to the backend
- `/hubs/chat` to the SignalR hub

## Default development credentials

Admin seed:

- Email: `admin@uniride.local`
- Password: `ChangeMe!2026`

Students are created through the register page.

## Main routes

- `/login`
- `/register`
- `/rides`
- `/rides/new`
- `/rides/:rideId`
- `/drivers/:driverId`
- `/my-rides`
- `/reservations`
- `/chat`
- `/notifications`
- `/profile`
- `/admin`
- `/admin/users`
- `/admin/rides`
- `/admin/reports`

## API overview

### Auth

- `POST /api/Auth/register`
- `POST /api/Auth/login`
- `POST /api/Auth/refresh`
- `POST /api/Auth/revoke`

### Rides

- `GET /api/Rides`
- `POST /api/Rides`
- `GET /api/Rides/mine`
- `GET /api/Rides/{id}`
- `PUT /api/Rides/{id}`
- `DELETE /api/Rides/{id}`
- `GET /api/Rides/{id}/passengers`
- `PATCH /api/Rides/{id}/start`
- `PATCH /api/Rides/{id}/complete`

### Reservations

- `POST /api/Reservations`
- `DELETE /api/Reservations/{id}`
- `GET /api/Reservations/mine`
- `PATCH /api/Reservations/{id}/approve`
- `PATCH /api/Reservations/{id}/reject`

### Chat

- `POST /api/Chat`
- `GET /api/Chat/conversation?rideId=&otherUserId=`
- `GET /api/Chat/threads`
- `GET /api/Chat/unread-count`

### Users

- `GET /api/Users/me`
- `PUT /api/Users/me`
- `PATCH /api/Users/me/request-verification`

### Reviews

- `POST /api/Reviews`
- `GET /api/Reviews/user/{userId}`
- `GET /api/Reviews/mine`
- `GET /api/Reviews/exists?rideId=&targetUserId=`

### Notifications

- `GET /api/Notifications`
- `GET /api/Notifications/unread-count`
- `PATCH /api/Notifications/{id}/read`
- `PATCH /api/Notifications/read-all`
- `DELETE /api/Notifications/{id}`
- `DELETE /api/Notifications/read`
- `DELETE /api/Notifications`

### Reports

- `POST /api/Reports`
- `GET /api/Reports`
- `PATCH /api/Reports/{id}/status`

### Admin

- `GET /api/Admin/users`
- `PUT /api/Admin/users/{id}`
- `DELETE /api/Admin/users/{id}`
- `PATCH /api/Admin/users/{id}/suspend`
- `PATCH /api/Admin/users/{id}/restore`
- `PATCH /api/Admin/users/{id}/verify`
- `PATCH /api/Admin/users/{id}/unverify`
- `DELETE /api/Admin/rides/{id}`
- `GET /api/Admin/statistics`

## Key frontend flows

- Ride search is filterable and shareable.
- Ride creation supports recurring rides.
- My rides supports passenger approval, ride start, and ride completion.
- Chat uses SignalR for live updates.
- Notifications show unread counts and support mark-read and delete actions.
- Profile includes verification requests.
- Admin has overview, user management, ride management, and report management.

## Configuration

Development settings live in `src/UniRide.API/appsettings.Development.json`.

Important settings:

- `ConnectionStrings:Provider`
- `ConnectionStrings:DefaultConnection`
- `Jwt:Key`
- `Jwt:Issuer`
- `Jwt:Audience`
- `Jwt:AccessTokenMinutes`
- `Jwt:RefreshTokenDays`
- `AdminSeed:Email`
- `AdminSeed:Password`

Use user secrets or environment variables for production.

## Build and test

```powershell
dotnet test
dotnet publish src\UniRide.API\UniRide.API.csproj -c Release -o publish
cd frontend
npm run lint
npm run typecheck
npm run build
```

## Troubleshooting

- If the backend refuses to start, check that `Jwt:Key` is at least 32 characters.
- If `http://localhost:5173` does not load, make sure `npm run dev` is still running.
- If HTTPS in the browser warns about a dev certificate, use the frontend URL or trust the cert once with `dotnet dev-certs https --trust`.
- If the database gets into a bad local state, stop the backend and delete `src/UniRide.API/uniride-dev.db` plus the `-wal` and `-shm` files.

