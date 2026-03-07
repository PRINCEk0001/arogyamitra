import React from 'react';

interface GoogleLoginButtonProps {
  onSuccess: (token: string, user: any) => void;
  onError: (error: string) => void;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError }) => {
  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();

      if (!res.ok || !data.url) {
        onError(data.error || 'Google login is not configured on this server');
        return;
      }

      window.open(data.url, 'google_login', 'width=500,height=600');

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'OAUTH_AUTH_SUCCESS') {
          onSuccess(event.data.token, event.data.user);
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (err) {
      onError('Failed to initiate Google login');
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-medium py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
    >
      <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-5 h-5 bg-white rounded-full" />
      Continue with Google
    </button>
  );
};
