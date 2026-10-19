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

const BASE_URL = import.meta.env.VITE_DEV_API || "http://localhost:5000";

export { fetchData, exerciseOptions, youtubeExerciseOptions, BASE_URL, hasRapidApiKey };
