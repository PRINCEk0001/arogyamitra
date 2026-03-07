import axios from 'axios';

export const getExerciseVideo = async (exerciseName: string) => {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    console.warn('YOUTUBE_API_KEY not found in environment variables');
    return null;
  }

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        maxResults: 1,
        q: `${exerciseName} exercise tutorial`,
        type: 'video',
        key: YOUTUBE_API_KEY
      }
    });

    if (response.data.items && response.data.items.length > 0) {
      const videoId = response.data.items[0].id.videoId;
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching YouTube video for ${exerciseName}:`, error);
    return null;
  }
};
