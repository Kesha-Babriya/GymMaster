import React, { useState, useEffect } from 'react';
import { useParams, Link } from "react-router-dom";
import { GiGymBag } from "react-icons/gi";
import { fetchData, exerciseOptions, youtubeExerciseOptions } from "../utils/fetchData";
import { fallbackExercises } from "../utils/fallbackExercises";
import { ExerciseCard, ExerciseVideos, Loader } from "../components";
import AOS from 'aos'; 
import 'aos/dist/aos.css'; 

const ExerciseDetail = () => {
  const { id } = useParams();
  const [exercises, setExercises] = useState(null);
  const [youtubeVideo, setYoutubeVideo] = useState([]);
  const [targetMuscle, setTargetMuscle] = useState([]);
  const [equipmentExercise, setEquipmentExercise] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize AOS on component mount
  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      offset: 120,
      once: true
    });
  }, []);

  useEffect(() => {
    const exerciseData = async () => {
      setLoading(true);
      let particularExerciseData = null;

      try {
        particularExerciseData = await fetchData(`https://exercisedb.p.rapidapi.com/exercises/exercise/${id}`, exerciseOptions);
      } catch (err) {
        particularExerciseData = null;
      }

      // If RapidAPI returned nothing or failed, use local fallback
      if (!particularExerciseData || !particularExerciseData.name) {
        particularExerciseData = fallbackExercises.find((ex) => ex.id === id) || fallbackExercises[0];
      }

      setExercises(particularExerciseData);

      // Related YouTube videos (optional)
      try {
        const youtubeExerciseVideoData = await fetchData(
          `https://youtube-search-and-download.p.rapidapi.com/search?query=${encodeURIComponent(particularExerciseData?.name || "gym workout")}`,
          youtubeExerciseOptions
        );
        if (youtubeExerciseVideoData && Array.isArray(youtubeExerciseVideoData.contents)) {
          setYoutubeVideo(youtubeExerciseVideoData.contents);
        } else {
          setYoutubeVideo([]);
        }
      } catch (err) {
        setYoutubeVideo([]);
      }

      // Related target muscle exercises
      try {
        const targetMuscleData = await fetchData(
          `https://exercisedb.p.rapidapi.com/exercises/target/${encodeURIComponent(particularExerciseData?.target || "abs")}`,
          exerciseOptions
        );
        if (Array.isArray(targetMuscleData) && targetMuscleData.length > 0) {
          setTargetMuscle(targetMuscleData);
        } else {
          setTargetMuscle(fallbackExercises.filter(ex => ex.id !== particularExerciseData?.id).slice(0, 3));
        }
      } catch (err) {
        setTargetMuscle(fallbackExercises.filter(ex => ex.id !== particularExerciseData?.id).slice(0, 3));
      }

      // Related equipment exercises
      try {
        const equipmentExerciseData = await fetchData(
          `https://exercisedb.p.rapidapi.com/exercises/equipment/${encodeURIComponent(particularExerciseData?.equipment || "barbell")}`,
          exerciseOptions
        );
        if (Array.isArray(equipmentExerciseData) && equipmentExerciseData.length > 0) {
          setEquipmentExercise(equipmentExerciseData);
        } else {
          setEquipmentExercise(fallbackExercises.filter(ex => ex.id !== particularExerciseData?.id).slice(3, 6));
        }
      } catch (err) {
        setEquipmentExercise(fallbackExercises.filter(ex => ex.id !== particularExerciseData?.id).slice(3, 6));
      }

      setLoading(false);
    };

    exerciseData();
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [id]);

  if (loading) {
    return <Loader />;
  }

  if (!exercises) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-900 text-white gap-4">
        <h2 className="text-3xl font-bold">Exercise Not Found</h2>
        <Link to="/exercise" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-2 rounded-lg">
          Back to Exercises
        </Link>
      </div>
    );
  }

  return (
    <section className='bg-gray-900 text-white py-12'>
      <div className="px-7 sm:px-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gray-800 rounded-2xl p-8 max-w-6xl mx-auto shadow-xl">
          <div className="bg-white rounded-xl p-4 flex justify-center items-center" data-aos="fade-up">
            <img src={exercises.gifUrl} className='w-full max-h-96 object-contain' alt={exercises.name} loading='lazy' />
          </div>
          <div className="flex flex-col gap-6 justify-center" data-aos="fade-up">
            <h1 className='font-bold text-3xl md:text-5xl capitalize text-white'>{exercises.name}</h1>
            <p className='capitalize text-lg text-gray-300 font-medium leading-relaxed'>
              Exercises keep you strong. {exercises.name} is one of the best movements to target your {exercises.target}. It will help you build muscle, improve mood, and boost everyday energy.
            </p>
            <div className='flex flex-wrap gap-4 pt-2'>
              <div className="flex items-center gap-3 bg-gray-700/60 px-4 py-2 rounded-xl">
                <GiGymBag className='rounded-full bg-orange-500 text-4xl p-2 text-white' />
                <span className='capitalize text-lg font-medium text-white'>{exercises.equipment}</span>
              </div>
              <div className="flex items-center gap-3 bg-gray-700/60 px-4 py-2 rounded-xl">
                <GiGymBag className='rounded-full bg-blue-500 text-4xl p-2 text-white' />
                <span className='capitalize text-lg font-medium text-white'>{exercises.target}</span>
              </div>
              <div className="flex items-center gap-3 bg-gray-700/60 px-4 py-2 rounded-xl">
                <GiGymBag className='rounded-full bg-green-500 text-4xl p-2 text-white' />
                <span className='capitalize text-lg font-medium text-white'>{exercises.bodyPart}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {youtubeVideo && youtubeVideo.length > 0 && (
        <ExerciseVideos youtubeVideo={youtubeVideo} name={exercises.name} data-aos="fade-up" />
      )}
      {targetMuscle && targetMuscle.length > 0 && (
        <ExerciseCard exercises={targetMuscle} heading="Target Muscle" data-aos="fade-up" />
      )}
      {equipmentExercise && equipmentExercise.length > 0 && (
        <ExerciseCard exercises={equipmentExercise} heading="Equipment" data-aos="fade-up" />
      )}
    </section>
  );
};

export default ExerciseDetail;
