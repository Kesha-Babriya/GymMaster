const hasRapidApiKey = !!(
  import.meta.env.VITE_RAPID_API_KEY &&
  import.meta.env.VITE_RAPID_API_KEY !== "undefined"
);

const exerciseOptions = {
  method: "GET",
  headers: {
    "X-RapidAPI-Key": import.meta.env.VITE_RAPID_API_KEY || "",
    "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
  },
};

const youtubeExerciseOptions = {
  method: "GET",
  headers: {
    "X-RapidAPI-Key": import.meta.env.VITE_RAPID_API_KEY || "",
    "X-RapidAPI-Host": "youtube-search-and-download.p.rapidapi.com",
  },
};

const fetchData = async (url, options) => {
  try {
    const apiKey = options?.headers?.["X-RapidAPI-Key"];
    if (!apiKey) {
      return null;
    }
    const response = await fetch(url, options);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
};

// Determine API base URL dynamically based on environment mode and configuration
const getBaseUrl = () => {
  // In production builds (Vite build / Vercel), VITE_API_URL takes highest priority
  if (import.meta.env.PROD) {
    return (
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_BACKEND_URL ||
      import.meta.env.VITE_DEV_API ||
      "http://localhost:5000"
    );
  }

  // In development (npm run dev / localhost), prefer local development API
  return (
    import.meta.env.VITE_DEV_API ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
  );
};

const rawBaseUrl = getBaseUrl();
const BASE_URL = (rawBaseUrl || "http://localhost:5000").trim().replace(/\/+$/, "");

export { fetchData, exerciseOptions, youtubeExerciseOptions, BASE_URL, hasRapidApiKey };
