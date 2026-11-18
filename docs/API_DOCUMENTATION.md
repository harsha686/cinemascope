# API_DOCUMENTATION.md — PostgREST & External API Specifications

## 1. PostgREST API Contracts (Supabase Endpoints)

All database operations communicate with PostgREST over HTTPS using standard JSON payloads.

### 1.1 Movies Resource
- **Endpoint**: `GET /rest/v1/movies?select=*&order=created_at.desc`
  - **Headers**: `apikey: <anon_key>`, `Authorization: Bearer <token_or_anon>`
  - **Response**: Array of Movie objects.
- **Endpoint**: `POST /rest/v1/movies`
  - **Headers**: `Prefer: resolution=merge-duplicates`
  - **Authorization**: Admin JWT only (enforced by RLS).

### 1.2 Reviews Resource
- **Endpoint**: `GET /rest/v1/reviews?select=*&order=created_at.desc`
  - **Response**: Array of Review records with `parameter_ratings`.
- **Endpoint**: `POST /rest/v1/reviews`
  - **Payload**:
    ```json
    {
      "id": "rev-1731920000000",
      "movie_id": "tmdb-912649",
      "user_id": "uuid-v4",
      "user_display_name": "Ravi Teja",
      "rating": 4.5,
      "parameter_ratings": {
        "visualClarity": 4.5,
        "soundClarity": 5.0,
        "seatingComfort": 4.0
      },
      "review_text": "Incredible sound mix on Dolby Atmos screen 1!",
      "status": "PUBLISHED"
    }
    ```
  - **Authorization**: Authenticated user matching `user_id`.

### 1.3 Personal Library (`user_movies`)
- **Endpoint**: `GET /rest/v1/user_movies?user_id=eq.{userId}`
- **Endpoint**: `POST /rest/v1/user_movies`
  - **Headers**: `Prefer: resolution=merge-duplicates`
  - **Authorization**: Owner only (`auth.uid() = user_id`).

---

## 2. External TMDB API Integration Contracts

Base URL: `https://api.themoviedb.org/3`

### 2.1 Movie Search
- **Endpoint**: `GET /3/search/movie`
- **Query Parameters**:
  - `query`: Search string (e.g., "Kalki")
  - `page`: Page index (default: `1`)
  - `include_adult`: `false`
  - `region`: `IN` (India)

### 2.2 Watch Providers (OTT Discovery)
- **Endpoint**: `GET /3/movie/{movie_id}/watch/providers`
- **Response Structure**:
  - `results.IN.flatrate`: Array of active streaming providers in India (Netflix, Prime Video, Hotstar, Zee5, Aha).
  - `results.IN.link`: Direct playback landing page URL.
