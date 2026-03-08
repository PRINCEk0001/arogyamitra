import express from 'express';
import { google } from 'googleapis';

const router = express.Router();

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// Helper for formatting duration
function parseDuration(duration: string) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';
  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);
  let res = '';
  if (hours > 0) res += `${hours}:`;
  res += `${hours > 0 ? minutes.toString().padStart(2, '0') : minutes}:${seconds.toString().padStart(2, '0')}`;
  return res;
}

// Helper: build a safe YouTube embed URL (Step 4)
function buildYoutubeEmbedUrl(videoId: string | null | undefined): string {
  if (!videoId) return '';
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
}

router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string || 'home workout';

    // Step 1: Search for videos – video IDs come from item.id.videoId
    const searchResponse = await youtube.search.list({
      part: ['snippet'],
      q: query,
      maxResults: 8,
      type: ['video']
    });

    // Step 3: Extract the correct videoId using item.id.videoId
    const searchItems = searchResponse.data.items || [];
    const videoIdMap: Record<string, string> = {};
    searchItems.forEach(item => {
      const vid = item.id?.videoId;
      if (vid) videoIdMap[vid] = vid;
    });

    const videoIds = Object.keys(videoIdMap);
    if (videoIds.length === 0) {
      return res.json({ suggestions: [] });
    }

    // Get video details (duration etc.) from videos.list – here item.id is the plain ID string
    const statsResponse = await youtube.videos.list({
      part: ['contentDetails', 'snippet', 'status'],
      id: videoIds
    });

    const suggestions = (statsResponse.data.items || [])
      // Step 6: Only include embeddable videos
      .filter(item => item.status?.embeddable !== false)
      .map(item => {
        const videoId = item.id as string;   // item.id is the plain string in videos.list
        return {
          id: videoId,
          videoId,                            // explicit field
          title: item.snippet?.title || '',
          thumbnail: item.snippet?.thumbnails?.medium?.url
            || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,   // for external links
          embedUrl: buildYoutubeEmbedUrl(videoId),                   // for iframes
          category: query,
          duration: item.contentDetails?.duration
            ? parseDuration(item.contentDetails.duration)
            : 'Unknown'
        };
      });

    res.json({ suggestions });
  } catch (error) {
    console.error('YouTube API error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});


router.get('/discover', async (req, res) => {
  try {
    // In a real app, these might come from a DB or YouTube API
    // For now, we'll provide some curated ones and generate a thematic image
    const suggestions = [
      {
        id: '1',
        videoId: 'v7AYKMP6rOE',
        title: 'Morning Yoga for Energy',
        thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
        videoUrl: 'https://www.youtube.com/watch?v=v7AYKMP6rOE',
        embedUrl: buildYoutubeEmbedUrl('v7AYKMP6rOE'),
        category: 'Yoga',
        duration: '15 min'
      },
      {
        id: '2',
        videoId: 'ml6cT4AZdqI',
        title: '10 Min HIIT Workout',
        thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
        videoUrl: 'https://www.youtube.com/watch?v=ml6cT4AZdqI',
        embedUrl: buildYoutubeEmbedUrl('ml6cT4AZdqI'),
        category: 'HIIT',
        duration: '10 min'
      },
      {
        id: '3',
        videoId: '98v_07V8qCc',
        title: 'Healthy Meal Prep Ideas',
        thumbnail: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
        videoUrl: 'https://www.youtube.com/watch?v=98v_07V8qCc',
        embedUrl: buildYoutubeEmbedUrl('98v_07V8qCc'),
        category: 'Nutrition',
        duration: '12 min'
      }
    ];

    // Generate a thematic image for the "Discover" header
    const thematicImage = null;

    res.json({ suggestions, thematicImage });
  } catch (error) {
    console.error("Discover error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
