import React from 'react';
import { Github } from 'lucide-react';

interface GithubLoginButtonProps {
  onSuccess: (token: string, user: any) => void;
  onError: (error: string) => void;
}

export const GithubLoginButton: React.FC<GithubLoginButtonProps> = ({ onSuccess, onError }) => {
  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/github/url');
      const data = await res.json();

      if (!res.ok || !data.url) {
        onError(data.error || 'GitHub login is not configured on this server');
        return;
      }

      window.open(data.url, 'github_login', 'width=500,height=600');

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'OAUTH_AUTH_SUCCESS') {
          onSuccess(event.data.token, event.data.user);
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (err) {
      onError('Failed to initiate GitHub login');
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white font-medium py-3 px-4 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
    >
      <Github className="w-5 h-5" />
      Continue with GitHub
    </button>
  );
};
