import React from 'react';

const ExerciseVideos = ({youtubeVideo, name}) => {

  if (!youtubeVideo || !Array.isArray(youtubeVideo) || youtubeVideo.length === 0) {
    return null;
  }

  return (
    <section className='bg-white py-14'>
      <div className="px-7 sm:px-14">
        <h2 className='text-2xl sm:text-3xl md:text-5xl text-black capitalize text-center border-b-4 border-red-500 sm:border-none mb-14'>
          <span className='text-red-500 capitalize'>{name}</span> Exercise Videos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
          {youtubeVideo.slice(0, 6).map((item, index) => {
            const videoId = item?.video?.videoId;
            const thumb = item?.video?.thumbnails?.[0]?.url;
            const title = item?.video?.title || "Exercise Video";
            if (!videoId) return null;
            return (
              <a href={`https://www.youtube.com/watch?v=${videoId}`} key={index} target="_blank" rel='noreferrer' className="hover:opacity-90 transition-opacity">
                {thumb && <img src={thumb} className='w-full rounded-lg mb-4' alt={title} loading="lazy" />}
                <h3 className='text-base sm:text-lg font-medium text-gray-800 line-clamp-2'>{title}</h3>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ExerciseVideos;