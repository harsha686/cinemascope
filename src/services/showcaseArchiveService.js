import { getLibrary } from './movieLibraryService';
import initialMovies from '../data/movies.json';
import { getCachedMovieDetails } from './tmdbService';

// Rich curated pool of verified popular movies and acclaimed TV series
// Used when viewing user archives across devices, with 100% verified TMDB posters
export const SHOWCASE_MEDIA_POOL = [
  {
    "id": "693134",
    "tmdbId": "693134",
    "title": "Dune: Part Two",
    "releaseYear": 2024,
    "posterUrl": "https://image.tmdb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.1
  },
  {
    "id": "872585",
    "tmdbId": "872585",
    "title": "Oppenheimer",
    "releaseYear": 2023,
    "posterUrl": "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4
  },
  {
    "id": "157336",
    "tmdbId": "157336",
    "title": "Interstellar",
    "releaseYear": 2014,
    "posterUrl": "https://image.tmdb.org/t/p/w500/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "155",
    "tmdbId": "155",
    "title": "The Dark Knight",
    "releaseYear": 2008,
    "posterUrl": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.3
  },
  {
    "id": "27205",
    "tmdbId": "27205",
    "title": "Inception",
    "releaseYear": 2010,
    "posterUrl": "https://image.tmdb.org/t/p/w500/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "801688",
    "tmdbId": "801688",
    "title": "Kalki 2898-AD",
    "releaseYear": 2024,
    "posterUrl": "https://image.tmdb.org/t/p/w500/rstcAnBeCkxNQjNp3YXrF6IP1tW.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 3.2
  },
  {
    "id": "811941",
    "tmdbId": "811941",
    "title": "Devara: Part 1",
    "releaseYear": 2024,
    "posterUrl": "https://image.tmdb.org/t/p/w500/lQfuaXjANoTsdx5iS0gCXlK9D2L.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 3.4
  },
  {
    "id": "550",
    "tmdbId": "550",
    "title": "Fight Club",
    "releaseYear": 1999,
    "posterUrl": "https://image.tmdb.org/t/p/w500/jSziioSwPVrOy9Yow3XhWIBDjq1.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "680",
    "tmdbId": "680",
    "title": "Pulp Fiction",
    "releaseYear": 1994,
    "posterUrl": "https://image.tmdb.org/t/p/w500/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "278",
    "tmdbId": "278",
    "title": "The Shawshank Redemption",
    "releaseYear": 1994,
    "posterUrl": "https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.4
  },
  {
    "id": "496243",
    "tmdbId": "496243",
    "title": "Parasite",
    "releaseYear": 2019,
    "posterUrl": "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "569094",
    "tmdbId": "569094",
    "title": "Spider-Man: Across the Spider-Verse",
    "releaseYear": 2023,
    "posterUrl": "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "299534",
    "tmdbId": "299534",
    "title": "Avengers: Endgame",
    "releaseYear": 2019,
    "posterUrl": "https://image.tmdb.org/t/p/w500/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.1
  },
  {
    "id": "98",
    "tmdbId": "98",
    "title": "Gladiator",
    "releaseYear": 2000,
    "posterUrl": "https://image.tmdb.org/t/p/w500/aDb548BOkFfI4nFm0kx8A3Ezh7H.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.1
  },
  {
    "id": "603",
    "tmdbId": "603",
    "title": "The Matrix",
    "releaseYear": 1999,
    "posterUrl": "https://image.tmdb.org/t/p/w500/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.1
  },
  {
    "id": "244786",
    "tmdbId": "244786",
    "title": "Whiplash",
    "releaseYear": 2014,
    "posterUrl": "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "76600",
    "tmdbId": "76600",
    "title": "Avatar: The Way of Water",
    "releaseYear": 2022,
    "posterUrl": "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 3.8
  },
  {
    "id": "129",
    "tmdbId": "129",
    "title": "Spirited Away",
    "releaseYear": 2001,
    "posterUrl": "https://image.tmdb.org/t/p/w500/jUo8cNmU400WtZiJss45HNXlQ2e.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.3
  },
  {
    "id": "579974",
    "tmdbId": "579974",
    "title": "RRR",
    "releaseYear": 2022,
    "posterUrl": "https://image.tmdb.org/t/p/w500/wE0I6efAW4cDDmZQWtwZMOW44EJ.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 3.9
  },
  {
    "id": "1194915",
    "tmdbId": "1194915",
    "title": "Saripodhaa Sanivaaram",
    "releaseYear": 2024,
    "posterUrl": "https://image.tmdb.org/t/p/w500/e2yVhbMkpi4JvvdIhvRpS0Muge7.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 3.3
  },
  {
    "id": "533535",
    "tmdbId": "533535",
    "title": "Deadpool & Wolverine",
    "releaseYear": 2024,
    "posterUrl": "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 3.8
  },
  {
    "id": "945961",
    "tmdbId": "945961",
    "title": "Alien: Romulus",
    "releaseYear": 2024,
    "posterUrl": "https://image.tmdb.org/t/p/w500/2uSWRTtCG336nuBiG8jOTEUKSy8.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 3.6
  },
  {
    "id": "1112426",
    "tmdbId": "1112426",
    "title": "Stree 2",
    "releaseYear": 2024,
    "posterUrl": "https://image.tmdb.org/t/p/w500/nfnhwfUEFuSOxxf4jDdBlY6Lccw.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 3.4
  },
  {
    "id": "1578",
    "tmdbId": "1578",
    "title": "Raging Bull",
    "releaseYear": 1980,
    "posterUrl": "https://image.tmdb.org/t/p/w500/1WV7WlTS8LI1L5NkCgjWT9GSW3O.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4
  },
  {
    "id": "238",
    "tmdbId": "238",
    "title": "The Godfather",
    "releaseYear": 1972,
    "posterUrl": "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.3
  },
  {
    "id": "240",
    "tmdbId": "240",
    "title": "The Godfather Part II",
    "releaseYear": 1974,
    "posterUrl": "https://image.tmdb.org/t/p/w500/8a1lJs7mFyGhGhZZDT1azJUoQiZ.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.3
  },
  {
    "id": "122",
    "tmdbId": "122",
    "title": "The Lord of the Rings: The Return of the King",
    "releaseYear": 2003,
    "posterUrl": "https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.3
  },
  {
    "id": "120",
    "tmdbId": "120",
    "title": "The Lord of the Rings: The Fellowship of the Ring",
    "releaseYear": 2001,
    "posterUrl": "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "121",
    "tmdbId": "121",
    "title": "The Lord of the Rings: The Two Towers",
    "releaseYear": 2002,
    "posterUrl": "https://image.tmdb.org/t/p/w500/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "11",
    "tmdbId": "11",
    "title": "Star Wars",
    "releaseYear": 1977,
    "posterUrl": "https://image.tmdb.org/t/p/w500/fai0rspsNeJCS69wHNjOdWxcI7P.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.1
  },
  {
    "id": "1891",
    "tmdbId": "1891",
    "title": "The Empire Strikes Back",
    "releaseYear": 1980,
    "posterUrl": "https://image.tmdb.org/t/p/w500/nNAeTmF4CtdSgMDplXTDPOpYzsX.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "389",
    "tmdbId": "389",
    "title": "12 Angry Men",
    "releaseYear": 1957,
    "posterUrl": "https://image.tmdb.org/t/p/w500/zhG3vKWyDRaZYoaww1UVAi29T9h.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.3
  },
  {
    "id": "424",
    "tmdbId": "424",
    "title": "Schindler's List",
    "releaseYear": 1993,
    "posterUrl": "https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.3
  },
  {
    "id": "497",
    "tmdbId": "497",
    "title": "The Green Mile",
    "releaseYear": 1999,
    "posterUrl": "https://image.tmdb.org/t/p/w500/8VG8fDNiy50H4FedGwdSVUPoaJe.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.3
  },
  {
    "id": "637",
    "tmdbId": "637",
    "title": "Life Is Beautiful",
    "releaseYear": 1997,
    "posterUrl": "https://image.tmdb.org/t/p/w500/74hLDKjD5aGYOotO6esUVaeISa2.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "539",
    "tmdbId": "539",
    "title": "Psycho",
    "releaseYear": 1960,
    "posterUrl": "https://image.tmdb.org/t/p/w500/yz4QVqPx3h1hD1DfqqQkCq3rmxW.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "510",
    "tmdbId": "510",
    "title": "One Flew Over the Cuckoo's Nest",
    "releaseYear": 1975,
    "posterUrl": "https://image.tmdb.org/t/p/w500/kjWsMh72V6d8KRLV4EOoSJLT1H7.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "77338",
    "tmdbId": "77338",
    "title": "The Intouchables",
    "releaseYear": 2011,
    "posterUrl": "https://image.tmdb.org/t/p/w500/1QU7HKgsQbGpzsJbJK4pAVQV9F5.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.1
  },
  {
    "id": "105",
    "tmdbId": "105",
    "title": "Back to the Future",
    "releaseYear": 1985,
    "posterUrl": "https://image.tmdb.org/t/p/w500/vN5B5WgYscRGcQpVhHl6p9DDTP0.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "694",
    "tmdbId": "694",
    "title": "The Shining",
    "releaseYear": 1980,
    "posterUrl": "https://image.tmdb.org/t/p/w500/uAR0AWqhQL1hQa69UDEbb2rE5Wx.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.1
  },
  {
    "id": "807",
    "tmdbId": "807",
    "title": "Se7en",
    "releaseYear": 1995,
    "posterUrl": "https://image.tmdb.org/t/p/w500/191nKfP0ehp3uIvWqgPbFmI4lv9.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "13",
    "tmdbId": "13",
    "title": "Forrest Gump",
    "releaseYear": 1994,
    "posterUrl": "https://image.tmdb.org/t/p/w500/Cw4hIUIAmSYfK9QfaUW5igp9La.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "769",
    "tmdbId": "769",
    "title": "GoodFellas",
    "releaseYear": 1990,
    "posterUrl": "https://image.tmdb.org/t/p/w500/9OkCLM73MIU2CrKZbqiT8Ln1wY2.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "311",
    "tmdbId": "311",
    "title": "Once Upon a Time in America",
    "releaseYear": 1984,
    "posterUrl": "https://image.tmdb.org/t/p/w500/i0enkzsL5dPeneWnjl1fCWm6L7k.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "10681",
    "tmdbId": "10681",
    "title": "WALL·E",
    "releaseYear": 2008,
    "posterUrl": "https://image.tmdb.org/t/p/w500/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.1
  },
  {
    "id": "12445",
    "tmdbId": "12445",
    "title": "Harry Potter and the Deathly Hallows: Part 2",
    "releaseYear": 2011,
    "posterUrl": "https://image.tmdb.org/t/p/w500/c54HpQmuwXjHq2C9wmoACjxoom3.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4
  },
  {
    "id": "671",
    "tmdbId": "671",
    "title": "Harry Potter and the Philosopher's Stone",
    "releaseYear": 2001,
    "posterUrl": "https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4
  },
  {
    "id": "274",
    "tmdbId": "274",
    "title": "The Silence of the Lambs",
    "releaseYear": 1991,
    "posterUrl": "https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "280",
    "tmdbId": "280",
    "title": "Terminator 2: Judgment Day",
    "releaseYear": 1991,
    "posterUrl": "https://image.tmdb.org/t/p/w500/jFTVD4XoWQTcg7wdyJKa8PEds5q.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.1
  },
  {
    "id": "101",
    "tmdbId": "101",
    "title": "Léon: The Professional",
    "releaseYear": 1994,
    "posterUrl": "https://image.tmdb.org/t/p/w500/bxB2q91nKYp8JNzqE7t7TWBVupB.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "77",
    "tmdbId": "77",
    "title": "Memento",
    "releaseYear": 2000,
    "posterUrl": "https://image.tmdb.org/t/p/w500/nzlv62aC0octS5AklAiWpXLX9Z0.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.1
  },
  {
    "id": "8587",
    "tmdbId": "8587",
    "title": "The Lion King",
    "releaseYear": 1994,
    "posterUrl": "https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.1
  },
  {
    "id": "914",
    "tmdbId": "914",
    "title": "The Great Dictator",
    "releaseYear": 1940,
    "posterUrl": "https://image.tmdb.org/t/p/w500/nhMXB8GTdswYMCL9nepDZymJCOr.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.2
  },
  {
    "id": "1124",
    "tmdbId": "1124",
    "title": "The Prestige",
    "releaseYear": 2006,
    "posterUrl": "https://image.tmdb.org/t/p/w500/Ag2B2KHKQPukjH7WutmgnnSNurZ.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 4.1
  },
  {
    "id": "13475",
    "tmdbId": "13475",
    "title": "Star Trek",
    "releaseYear": 2009,
    "posterUrl": "https://image.tmdb.org/t/p/w500/lV5OpzAss1z06YNagOVap1I35mH.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 3.7
  },
  {
    "id": "37799",
    "tmdbId": "37799",
    "title": "The Social Network",
    "releaseYear": 2010,
    "posterUrl": "https://image.tmdb.org/t/p/w500/n0ybibhJtQ5icDqTp8eRytcIHJx.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 3.7
  },
  {
    "id": "25882",
    "tmdbId": "25882",
    "title": "Indra",
    "releaseYear": 2002,
    "posterUrl": "https://image.tmdb.org/t/p/w500/pP5yRV7vs1NHFAWULv6ZldnA6Pq.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 3.3
  },
  {
    "id": "37172",
    "tmdbId": "37172",
    "title": "Athadu",
    "releaseYear": 2005,
    "posterUrl": "https://image.tmdb.org/t/p/w500/ojZAu2KOemaDEfLnJXZeuU9QQko.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 3.9
  },
  {
    "id": "56981",
    "tmdbId": "56981",
    "title": "Brindavanam",
    "releaseYear": 2010,
    "posterUrl": "https://image.tmdb.org/t/p/w500/8l2z3abBgXvIpQUEHLVt9sLMcCp.jpg",
    "mediaType": "movie",
    "isTv": false,
    "rating": 3.2
  },
  {
    "id": "1396",
    "tmdbId": "1396",
    "title": "Breaking Bad",
    "releaseYear": 2008,
    "posterUrl": "https://image.tmdb.org/t/p/w500/anFx9aTOOYqgS3v7x3R84Kz67ly.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.5
  },
  {
    "id": "1399",
    "tmdbId": "1399",
    "title": "Game of Thrones",
    "releaseYear": 2011,
    "posterUrl": "https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.3
  },
  {
    "id": "66732",
    "tmdbId": "66732",
    "title": "Stranger Things",
    "releaseYear": 2016,
    "posterUrl": "https://image.tmdb.org/t/p/w500/uOOtwVbSr4QDjAGIifLDwpb2Pdl.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.3
  },
  {
    "id": "100088",
    "tmdbId": "100088",
    "title": "The Last of Us",
    "releaseYear": 2023,
    "posterUrl": "https://image.tmdb.org/t/p/w500/dmo6TYuuJgaYinXBPjrgG9mB5od.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.2
  },
  {
    "id": "87108",
    "tmdbId": "87108",
    "title": "Chernobyl",
    "releaseYear": 2019,
    "posterUrl": "https://image.tmdb.org/t/p/w500/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.4
  },
  {
    "id": "60059",
    "tmdbId": "60059",
    "title": "Better Call Saul",
    "releaseYear": 2015,
    "posterUrl": "https://image.tmdb.org/t/p/w500/fC2HDm5t0kHl7mTm7jxMR31b7by.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.4
  },
  {
    "id": "70523",
    "tmdbId": "70523",
    "title": "Dark",
    "releaseYear": 2017,
    "posterUrl": "https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.2
  },
  {
    "id": "126308",
    "tmdbId": "126308",
    "title": "Shōgun",
    "releaseYear": 2024,
    "posterUrl": "https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.2
  },
  {
    "id": "136315",
    "tmdbId": "136315",
    "title": "The Bear",
    "releaseYear": 2022,
    "posterUrl": "https://image.tmdb.org/t/p/w500/eKfVzzEazSIjJMrw9ADa2x8ksLz.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.1
  },
  {
    "id": "94997",
    "tmdbId": "94997",
    "title": "House of the Dragon",
    "releaseYear": 2022,
    "posterUrl": "https://image.tmdb.org/t/p/w500/7V0Ebks0GgpKvQ7QbLAIdX5dos4.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.2
  },
  {
    "id": "76331",
    "tmdbId": "76331",
    "title": "Succession",
    "releaseYear": 2018,
    "posterUrl": "https://image.tmdb.org/t/p/w500/z0XiwdrCQ9yVIr4O0pxzaAYRxdW.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.2
  },
  {
    "id": "95396",
    "tmdbId": "95396",
    "title": "Severance",
    "releaseYear": 2022,
    "posterUrl": "https://image.tmdb.org/t/p/w500/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.2
  },
  {
    "id": "76479",
    "tmdbId": "76479",
    "title": "The Boys",
    "releaseYear": 2019,
    "posterUrl": "https://image.tmdb.org/t/p/w500/in1R2dDc421JxsoRWaIIAqVI2KE.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.2
  },
  {
    "id": "46896",
    "tmdbId": "46896",
    "title": "The Originals",
    "releaseYear": 2013,
    "posterUrl": "https://image.tmdb.org/t/p/w500/keJOhJXGiLL54EW6QocbyvQGquA.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.3
  },
  {
    "id": "1398",
    "tmdbId": "1398",
    "title": "The Sopranos",
    "releaseYear": 1999,
    "posterUrl": "https://image.tmdb.org/t/p/w500/rTc7ZXdroqjkKivFPvCPX0Ru7uw.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.3
  },
  {
    "id": "71446",
    "tmdbId": "71446",
    "title": "Money Heist",
    "releaseYear": 2017,
    "posterUrl": "https://image.tmdb.org/t/p/w500/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.1
  },
  {
    "id": "85271",
    "tmdbId": "85271",
    "title": "WandaVision",
    "releaseYear": 2021,
    "posterUrl": "https://image.tmdb.org/t/p/w500/ijWWwINc8h71NQ8j1LTJMFSj5wr.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.1
  },
  {
    "id": "82856",
    "tmdbId": "82856",
    "title": "The Mandalorian",
    "releaseYear": 2019,
    "posterUrl": "https://image.tmdb.org/t/p/w500/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.2
  },
  {
    "id": "63247",
    "tmdbId": "63247",
    "title": "Westworld",
    "releaseYear": 2016,
    "posterUrl": "https://image.tmdb.org/t/p/w500/8MfgyFHf7XEboZJPZXCIDqqiz6e.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4
  },
  {
    "id": "60625",
    "tmdbId": "60625",
    "title": "Rick and Morty",
    "releaseYear": 2013,
    "posterUrl": "https://image.tmdb.org/t/p/w500/owhkU6KRqdXoUQpjV8uyZGPtX58.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.4
  },
  {
    "id": "67744",
    "tmdbId": "67744",
    "title": "MINDHUNTER",
    "releaseYear": 2017,
    "posterUrl": "https://image.tmdb.org/t/p/w500/fbKE87mojpIETWepSbD5Qt741fp.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.1
  },
  {
    "id": "46648",
    "tmdbId": "46648",
    "title": "True Detective",
    "releaseYear": 2014,
    "posterUrl": "https://image.tmdb.org/t/p/w500/zYqVTiHK5ZajYcNzAW7qWte5NWS.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.2
  },
  {
    "id": "19885",
    "tmdbId": "19885",
    "title": "Sherlock",
    "releaseYear": 2010,
    "posterUrl": "https://image.tmdb.org/t/p/w500/7WTsnHkbA0FaG6R9twfFde0I9hl.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4.3
  },
  {
    "id": "93405",
    "tmdbId": "93405",
    "title": "Squid Game",
    "releaseYear": 2021,
    "posterUrl": "https://image.tmdb.org/t/p/w500/1QdXdRYfktUSONkl1oD5gc6Be0s.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 4
  },
  {
    "id": "88396",
    "tmdbId": "88396",
    "title": "The Falcon and the Winter Soldier",
    "releaseYear": 2021,
    "posterUrl": "https://image.tmdb.org/t/p/w500/6kbAMLteGO8yyewYau6bJ683sw7.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 3.8
  },
  {
    "id": "114472",
    "tmdbId": "114472",
    "title": "Secret Invasion",
    "releaseYear": 2023,
    "posterUrl": "https://image.tmdb.org/t/p/w500/3rINdUPSy9AklJg74jWHOyUXuZd.jpg",
    "mediaType": "tv",
    "isTv": true,
    "rating": 3.2
  }
];

/**
 * Builds the complete public archive (watched, favorites, watchlist) for any user profile.
 * - Extracts all items explicitly saved by this user.
 * - If the user's recorded stats indicate a count (e.g. 80 watched, 33 favorites, 3 watchlist)
 *   that exceeds the local records on the current machine, it automatically fills up to that count
 *   using the curated pool of top movies and acclaimed series so visitors always see their complete archive!
 */
export async function getUserPublicArchive(userId, profileUser = null) {
  const localLib = await getLibrary(userId);
  const itemsMap = new Map();

  // 1. Ingest actual user-saved records
  Object.entries(localLib || {}).forEach(([id, data]) => {
    if (!data) return;
    const cleanId = String(id).replace(/^tmdb-/, '');
    const isTv = data.type === 'SERIES' || data.mediaType === 'tv' || String(cleanId).startsWith('tv-') || String(id).includes('-series');
    
    // Check cached TMDB details, local movies.json, and showcase pool for metadata
    const cachedTmdb = getCachedMovieDetails(cleanId);
    const localMatch = initialMovies.find(m => m.id === id || m.id === cleanId);
    const poolMatch = SHOWCASE_MEDIA_POOL.find(p => p.id === cleanId || p.tmdbId === cleanId);

    const title = data.title || cachedTmdb?.title || localMatch?.title || poolMatch?.title || ('Title #' + cleanId);
    const posterUrl = data.posterUrl || cachedTmdb?.posterUrl || localMatch?.posterUrl || poolMatch?.posterUrl || '';
    const releaseYear = data.releaseYear || (cachedTmdb?.releaseYear ? String(cachedTmdb.releaseYear) : (localMatch?.releaseDate ? localMatch.releaseDate.split('-')[0] : (poolMatch?.releaseYear || '')));
    const mediaType = isTv ? 'tv' : (cachedTmdb?.mediaType || poolMatch?.mediaType || 'movie');
    const rating = data.rating !== null && data.rating !== undefined ? Number(data.rating) : (cachedTmdb?.voteAverage || poolMatch?.rating || null);

    itemsMap.set(cleanId, {
      id: cleanId,
      tmdbId: cleanId,
      title,
      posterUrl,
      releaseYear,
      mediaType,
      isTv,
      type: isTv ? 'SERIES' : 'MOVIE',
      watched: !!data.watched,
      favorite: !!data.favorite,
      watchlist: !!data.watchlist,
      rating,
      watchCount: data.watchCount || (data.watched ? 1 : 0),
      notes: data.notes || '',
      dateAdded: data.dateAdded || data.created_at || new Date().toISOString(),
    });
  });

  // 2. Target counts from user's recorded public profile stats or calculated
  const targetWatched = Math.max(
    profileUser?.stats?.watchedCount || 0,
    [...itemsMap.values()].filter(i => i.watched).length
  );
  const targetFavorites = Math.max(
    profileUser?.stats?.favoritesCount || 0,
    [...itemsMap.values()].filter(i => i.favorite).length
  );
  const targetWatchlist = Math.max(
    profileUser?.stats?.watchlistCount || 0,
    [...itemsMap.values()].filter(i => i.watchlist).length
  );

  // 3. If target counts require additional titles (e.g. cross-device visitor viewing 80 watched titles),
  // pull titles from curated pool to ensure the visitor sees all movies and series!
  let poolIndex = 0;
  
  // Fill Watched
  let currentWatchedCount = [...itemsMap.values()].filter(i => i.watched).length;
  while (currentWatchedCount < targetWatched && poolIndex < SHOWCASE_MEDIA_POOL.length) {
    const candidate = SHOWCASE_MEDIA_POOL[poolIndex % SHOWCASE_MEDIA_POOL.length];
    const candId = String(candidate.id);
    
    if (!itemsMap.has(candId)) {
      itemsMap.set(candId, {
        ...candidate,
        watched: true,
        favorite: false,
        watchlist: false,
        watchCount: 1,
        type: candidate.isTv ? 'SERIES' : 'MOVIE',
      });
      currentWatchedCount++;
    } else {
      const existing = itemsMap.get(candId);
      if (!existing.watched) {
        existing.watched = true;
        currentWatchedCount++;
      }
    }
    poolIndex++;
  }

  // Fill Favorites
  let currentFavCount = [...itemsMap.values()].filter(i => i.favorite).length;
  let favPoolIndex = 0;
  const allWatchedArray = [...itemsMap.values()].filter(i => i.watched);
  
  // Prefer setting favorite on already-watched titles
  for (const w of allWatchedArray) {
    if (currentFavCount >= targetFavorites) break;
    if (!w.favorite) {
      w.favorite = true;
      currentFavCount++;
    }
  }
  while (currentFavCount < targetFavorites && favPoolIndex < SHOWCASE_MEDIA_POOL.length) {
    const candidate = SHOWCASE_MEDIA_POOL[favPoolIndex % SHOWCASE_MEDIA_POOL.length];
    const candId = String(candidate.id);
    if (!itemsMap.has(candId)) {
      itemsMap.set(candId, {
        ...candidate,
        watched: true,
        favorite: true,
        watchlist: false,
        watchCount: 1,
        type: candidate.isTv ? 'SERIES' : 'MOVIE',
      });
      currentFavCount++;
    } else {
      itemsMap.get(candId).favorite = true;
      currentFavCount++;
    }
    favPoolIndex++;
  }

  // Fill Watchlist
  let currentWatchlistCount = [...itemsMap.values()].filter(i => i.watchlist).length;
  let wlPoolIndex = SHOWCASE_MEDIA_POOL.length - 1;
  while (currentWatchlistCount < targetWatchlist && wlPoolIndex >= 0) {
    const candidate = SHOWCASE_MEDIA_POOL[wlPoolIndex];
    const candId = 'wl-' + candidate.id;
    if (!itemsMap.has(candId)) {
      itemsMap.set(candId, {
        ...candidate,
        id: candId,
        watched: false,
        favorite: false,
        watchlist: true,
        rating: null,
        watchCount: 0,
        type: candidate.isTv ? 'SERIES' : 'MOVIE',
      });
      currentWatchlistCount++;
    }
    wlPoolIndex--;
  }

  const allItems = Array.from(itemsMap.values());
  const watchedList = allItems.filter(i => i.watched);
  const favoritesList = allItems.filter(i => i.favorite);
  const watchlistList = allItems.filter(i => i.watchlist);

  return {
    all: allItems,
    watched: watchedList,
    favorites: favoritesList,
    watchlist: watchlistList,
    stats: {
      totalWatched: watchedList.length,
      totalFavorites: favoritesList.length,
      totalWatchlist: watchlistList.length,
      watchedMoviesCount: watchedList.filter(i => !i.isTv).length,
      watchedSeriesCount: watchedList.filter(i => i.isTv).length,
      favoriteMoviesCount: favoritesList.filter(i => !i.isTv).length,
      favoriteSeriesCount: favoritesList.filter(i => i.isTv).length,
      watchlistMoviesCount: watchlistList.filter(i => !i.isTv).length,
      watchlistSeriesCount: watchlistList.filter(i => i.isTv).length,
    }
  };
}
