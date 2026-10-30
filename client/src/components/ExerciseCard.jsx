import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from "../context/cart";
import { toast } from "react-hot-toast";

const ExerciseCard = ({ exercises, heading }) => {
  const { cart, setCart } = useCart();

  if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
    return (
      <section className='pt-20 pb-32 bg-gray-900 text-white text-center' id='exercises'>
        <div className="px-7 sm:px-14">
          <h2 className='text-2xl sm:text-3xl font-bold mb-4 text-white'>No Exercises Found</h2>
          <p className="text-gray-400">Try searching for a different body part, equipment, or exercise name.</p>
        </div>
      </section>
    );
  }

  const handleAddToCart = (exercise) => {
    const isExerciseInCart = cart.some(item => item.id === exercise.id);

    if (!isExerciseInCart) {
      setCart([...cart, exercise]);
      localStorage.setItem("cart", JSON.stringify([...cart, exercise]));
      toast.success("Exercise added to Favourites");
    } else {
      toast.error("Exercise is already in Favourites");
    }
  };

  return (
    <section className='pt-20 pb-28 bg-white' id='exercises'>
      <div className="px-7 sm:px-14">
        <h2 className='text-2xl sm:text-3xl md:text-5xl text-black capitalize text-center border-b-4 border-red-500 sm:border-none mb-14'>
          {heading ? `Similar ${heading} Exercises` : 'Showing Exercises'}
        </h2>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {exercises.slice(0, 21).map((exercise, id) => (
            <div className='flex justify-between items-center flex-col gap-4 border-2 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all bg-white' key={exercise.id || id}>
              <Link to={exercise.id ? `/exercise/${exercise.id}` : "#"} className='no-underline w-full'>
                <div className="overflow-hidden bg-white text-center">
                  <img
                    src={exercise.gifUrl}
                    className='w-48 h-48 object-contain mx-auto hover:scale-105 transition-transform duration-300'
                    alt={exercise.name || 'Exercise'}
                    loading="lazy"
                  />
                  <div className="flex gap-2 flex-row items-center my-4 justify-center flex-wrap">
                    <span className='rounded-full px-3 py-1 text-xs font-semibold text-white bg-[#240b36] capitalize'>
                      {(exercise?.bodyPart || "General").slice(0, 15)}
                    </span>
                    <span className='rounded-full px-3 py-1 text-xs font-semibold text-white bg-[#c31432] capitalize'>
                      {(exercise?.target || "Fitness").slice(0, 15)}
                    </span>
                  </div>
                  <h3 className='text-lg capitalize text-center font-bold text-gray-900'>
                    {(exercise?.name || "Exercise").slice(0, 30)}
                  </h3>
                </div>
              </Link>
              <button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 text-sm w-full transition-colors"
                onClick={() => handleAddToCart(exercise)}
              >
                Add To Favourites
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExerciseCard;
