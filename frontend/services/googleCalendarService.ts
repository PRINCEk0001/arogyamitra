import axios from 'axios';

const API_URL = '/api/google';

export const getGoogleAuthUrl = async (token: string) => {
  const response = await axios.get(`${API_URL}/auth/url`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.url;
};

export const createCalendarEvent = async (token: string, googleTokens: any, event: {
  summary: string;
  description: string;
  start: string;
  end: string;
}) => {
  const response = await axios.post(`${API_URL}/calendar/schedule`, {
    tokens: googleTokens,
    event
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
