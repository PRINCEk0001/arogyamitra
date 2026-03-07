import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { UserProfile, MealPlan, Workout, HealthStats, DiscoverData } from './types';
import { generateThematicImage, generateNutritionPlanAI } from './services/aiService';
import { Dashboard } from './components/Dashboard';
import { ProfileForm } from './components/ProfileForm';
import { AICoach } from './components/AICoach';
import { Progress } from './components/Progress';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Explore } from './pages/Explore';
import { Home, BarChart2, MessageSquare, Utensils, Activity, LogOut } from 'lucide-react';

// Protected Route Component
const ProtectedRoute = ({ children, token }: { children: React.ReactNode, token: string | null }) => {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [healthStats, setHealthStats] = useState<HealthStats | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [discoverData, setDiscoverData] = useState<DiscoverData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Fetch user profile on mount if token exists
  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.age) { // Check if profile is complete
          setProfile(data);
          fetchAllData(data);
        }
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchAllData = async (userProfile: UserProfile) => {
    if (!token) return;
    setLoading(true);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 1. Get basic health stats first as they are needed for others
    let healthData: HealthStats | null = null;
    try {
      const healthRes = await fetch('/api/health/calc', { method: 'POST', headers, body: JSON.stringify({ profile: userProfile }) });
      if (healthRes.ok) {
        const text = await healthRes.text();
        try {
          healthData = JSON.parse(text);
          setHealthStats(healthData);
        } catch (parseError) {
          console.error("JSON Parse Error in Health Stats:", parseError, "Response Text Length:", text.length);
        }
      }
    } catch (e) {
      console.error("Error fetching health stats:", e);
    }

    // Run other fetches in parallel and handle them independently
    await Promise.all([
      // Nutrition Plan
      (async () => {
        try {
          const tdee = healthData?.tdee || 2000;
          let targetCalories = tdee;
          if (userProfile.goals === 'fat_loss') targetCalories -= 300;
          else if (userProfile.goals === 'muscle_gain') targetCalories += 300;
          const targetProtein = userProfile.weight * 1.8;

          const nutritionPlan = await generateNutritionPlanAI({
            targetCalories,
            targetProtein,
            dietaryRestrictions: userProfile.dietaryRestrictions
          }, token);

          const nutritionImageUrl = await generateThematicImage(`healthy ${userProfile.goals} meal plan with fresh ingredients`);
          setMealPlan({ ...nutritionPlan, targetCalories, targetProtein, imageUrl: nutritionImageUrl });
        } catch (e) {
          console.error("Error generating nutrition plan:", e);
        }
      })(),

      // Workout Plan
      (async () => {
        try {
          const workoutRes = await fetch('/api/workout/plan', { method: 'POST', headers, body: JSON.stringify({ profile: userProfile }) });
          if (workoutRes.ok) {
            const text = await workoutRes.text();
            try {
              const workoutData = JSON.parse(text);
              const workoutImageUrl = await generateThematicImage(`${workoutData.title} fitness workout in a modern gym`);
              setWorkout({ ...workoutData, imageUrl: workoutImageUrl || workoutData.imageUrl });
            } catch (parseError) {
              console.error("JSON Parse Error in Workout Plan:", parseError, "Response Text Length:", text.length);
            }
          }
        } catch (e) {
          console.error("Error fetching workout plan:", e);
        }
      })(),

      // Discover Data
      (async () => {
        try {
          const discoverRes = await fetch('/api/discover/discover', { headers });
          if (discoverRes.ok) {
            const text = await discoverRes.text();
            try {
              const discoverData = JSON.parse(text);
              if (!discoverData.thematicImage) {
                discoverData.thematicImage = await generateThematicImage("modern high-end fitness lifestyle photography");
              }
              setDiscoverData(discoverData);
            } catch (parseError) {
              console.error("JSON Parse Error in Discover Data:", parseError, "Response Text Length:", text.length);
            }
          }
        } catch (e) {
          console.error("Error fetching discover data:", e);
        }
      })()
    ]);

    setLoading(false);
  };

  const handleAuthSuccess = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      setToken(null);
      setUser(null);
      setProfile(null);
      localStorage.removeItem('token');
    }
  };

  const handleProfileSubmit = async (newProfile: UserProfile) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProfile)
      });
      if (res.ok) {
        setProfile(newProfile);
        setIsEditingProfile(false);
        await fetchAllData(newProfile);
      } else {
        const err = await res.json();
        if (res.status === 403 || res.status === 401) {
          handleLogout();
          alert("Your session has expired. Please log in again.");
        } else {
          alert(err.error || "Failed to update profile. Please check your connection.");
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen max-w-[430px] mx-auto bg-background-dark relative overflow-x-hidden no-scrollbar">
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-slate-800 rounded-full mix-blend-screen filter blur-[100px]"></div>
          <div className="absolute top-1/3 -right-20 w-80 h-80 bg-primary/20 rounded-full mix-blend-screen filter blur-[80px]"></div>
        </div>

        <main className="relative z-10 min-h-screen">
          {loading && (
            <div className="fixed inset-0 z-[200] bg-background-dark/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-primary font-bold animate-pulse">Analyzing your health data...</p>
            </div>
          )}
          <Routes>
            <Route path="/login" element={
              token ? <Navigate to="/dashboard" replace /> : <Login onAuthSuccess={handleAuthSuccess} />
            } />
            <Route path="/register" element={
              token ? <Navigate to="/dashboard" replace /> : <Register onAuthSuccess={handleAuthSuccess} />
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute token={token}>
                {!profile || isEditingProfile ? (
                  <div className="px-4 py-12">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h1 className="text-3xl font-bold text-primary">{isEditingProfile ? 'Update Profile' : 'Welcome'}</h1>
                        <p className="text-slate-400">{isEditingProfile ? 'Refine your health details' : "Let's set up your profile"}</p>
                      </div>
                      <div className="flex gap-2">
                        {isEditingProfile && (
                          <button onClick={() => setIsEditingProfile(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                            Cancel
                          </button>
                        )}
                        <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                          <LogOut className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <ProfileForm profile={profile} onSubmit={handleProfileSubmit} />
                  </div>
                ) : (
                  <Dashboard
                    profile={profile}
                    healthStats={healthStats}
                    mealPlan={mealPlan}
                    workout={workout}
                    discoverData={discoverData}
                    onRefresh={() => fetchAllData(profile)}
                    onEditProfile={() => setIsEditingProfile(true)}
                    loading={loading}
                    activeTab="dashboard"
                    token={token!}
                  />
                )}
              </ProtectedRoute>
            } />

            <Route path="/workout" element={
              <ProtectedRoute token={token}>
                <Dashboard
                  profile={profile!}
                  healthStats={healthStats}
                  mealPlan={mealPlan}
                  workout={workout}
                  discoverData={discoverData}
                  onRefresh={() => fetchAllData(profile!)}
                  onEditProfile={() => setIsEditingProfile(true)}
                  loading={loading}
                  activeTab="workout"
                  token={token!}
                />
              </ProtectedRoute>
            } />

            <Route path="/nutrition" element={
              <ProtectedRoute token={token}>
                <Dashboard
                  profile={profile!}
                  healthStats={healthStats}
                  mealPlan={mealPlan}
                  workout={workout}
                  discoverData={discoverData}
                  onRefresh={() => fetchAllData(profile!)}
                  onEditProfile={() => setIsEditingProfile(true)}
                  loading={loading}
                  activeTab="nutrition"
                  token={token!}
                />
              </ProtectedRoute>
            } />

            <Route path="/coach" element={
              <ProtectedRoute token={token}>
                <div className="pt-6">
                  <h2 className="text-2xl font-bold px-4 mb-4">AI Health Coach</h2>
                  <AICoach profile={profile!} stats={healthStats} token={token!} />
                </div>
              </ProtectedRoute>
            } />

            <Route path="/progress" element={
              <ProtectedRoute token={token}>
                <div className="pt-6">
                  <h2 className="text-2xl font-bold px-4 mb-4">Your Progress</h2>
                  <Progress profile={profile!} token={token!} />
                </div>
              </ProtectedRoute>
            } />

            <Route path="/explore" element={
              <ProtectedRoute token={token}>
                <Explore token={token!} />
              </ProtectedRoute>
            } />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        <Navigation profile={profile} token={token} onLogout={handleLogout} />
      </div>
    </BrowserRouter>
  );
}

const Navigation = ({ profile, token, onLogout }: any) => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = location.pathname.substring(1) || 'dashboard';

  if (!token || !profile || location.pathname === '/login' || location.pathname === '/register') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-50 px-6 pb-8 pt-4 bg-gradient-to-t from-background-dark via-background-dark/95 to-transparent">
      <div className="bg-surface-dark/80 backdrop-blur-2xl border border-white/10 rounded-full p-2 flex items-center justify-between shadow-2xl">
        <button onClick={() => navigate('/dashboard')} className={`p-3 ${activeTab === 'dashboard' ? 'text-primary' : 'text-slate-500'}`}><Home className="w-6 h-6" /></button>
        <button onClick={() => navigate('/workout')} className={`p-3 ${activeTab === 'workout' ? 'text-primary' : 'text-slate-500'}`}><Activity className="w-6 h-6" /></button>
        <div className="relative -top-6">
          <button onClick={() => navigate('/coach')} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(19,236,178,0.4)] transform active:scale-95 transition-transform ${activeTab === 'coach' ? 'bg-white text-background-dark' : 'bg-primary text-background-dark'}`}>
            <MessageSquare className="w-8 h-8" />
          </button>
        </div>
        <button onClick={() => navigate('/nutrition')} className={`p-3 ${activeTab === 'nutrition' ? 'text-primary' : 'text-slate-500'}`}><Utensils className="w-6 h-6" /></button>
        <button onClick={() => navigate('/progress')} className={`p-3 ${activeTab === 'progress' ? 'text-primary' : 'text-slate-500'}`}><BarChart2 className="w-6 h-6" /></button>
      </div>
    </nav>
  );
};
