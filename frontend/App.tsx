import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, UserButton } from '@clerk/clerk-react';
import { UserProfile, MealPlan, Workout, HealthStats, DiscoverData } from './types';
import { generateThematicImage, generateNutritionPlanAI } from './services/aiService';
import { Dashboard } from './components/Dashboard';
import { ProfileForm } from './components/ProfileForm';
import { AICoach } from './components/AICoach';
import { Progress } from './components/Progress';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Explore } from './pages/Explore';
import { Home, BarChart2, MessageSquare, Utensils, Activity } from 'lucide-react';

// Protected Route Component via Clerk
const ProtectedRoute = ({ children, token }: { children: React.ReactNode, token: string | null }) => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded || (isSignedIn && !token)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [healthStats, setHealthStats] = useState<HealthStats | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [discoverData, setDiscoverData] = useState<DiscoverData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Sync Clerk token to local state so standard fetch hooks work seamlessly
  useEffect(() => {
    const initAuth = async () => {
      if (isLoaded && isSignedIn) {
        try {
          const t = await getToken();
          setToken(t);
        } catch (e) {
          console.error("Failed to get Clerk token", e);
        }
      } else if (isLoaded && !isSignedIn) {
        setToken(null);
        setProfile(null);
      }
    };
    initAuth();
  }, [isLoaded, isSignedIn, getToken]);

  // Fetch user profile only after token is safely fetched from Clerk
  useEffect(() => {
    if (token && isSignedIn) {
      fetchProfile();
    }
  }, [token, isSignedIn]);

  const fetchProfile = async () => {
    if (!token) return;
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
        // DO NOT log out instantly. The token might just be stale.
        // Let Clerk handle session invalidation.
        console.warn("Backend rejected token on profile fetch");
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

    let healthData: HealthStats | null = null;
    try {
      const healthRes = await fetch('/api/health/calc', { method: 'POST', headers, body: JSON.stringify({ profile: userProfile }) });
      if (healthRes.ok) {
        const text = await healthRes.text();
        try {
          healthData = JSON.parse(text);
          setHealthStats(healthData);
        } catch (parseError) {
          console.error("JSON Parse Error in Health Stats:", parseError);
        }
      }
    } catch (e) {
      console.error("Error fetching health stats:", e);
    }

    await Promise.all([
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
              console.error("JSON Parse Error in Workout Plan:", parseError);
            }
          }
        } catch (e) {
          console.error("Error fetching workout plan:", e);
        }
      })(),

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
              console.error("JSON Parse Error in Discover Data:", parseError);
            }
          }
        } catch (e) {
          console.error("Error fetching discover data:", e);
        }
      })()
    ]);

    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(); // This fully signs out of Clerk everywhere
      setToken(null);
      setProfile(null);
    } catch (e) {
      console.error("Logout error", e);
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
        let errStr = "Failed to update profile. Please check your connection.";
        try {
          const err = await res.json();
          errStr = err.error || errStr;
        } catch (e) { }

        if (res.status === 403 || res.status === 401) {
          console.warn("Backend rejected token on profile submission");
          alert("Your session token was rejected by the server. " + errStr);
        } else {
          alert(errStr);
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Ensure Clerk handles full app loading states gracefully
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
              isSignedIn ? <Navigate to="/dashboard" replace /> : <Login />
            } />
            <Route path="/register" element={
              isSignedIn ? <Navigate to="/dashboard" replace /> : <Register />
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute token={token}>
                {!profile || isEditingProfile ? (
                  <div className="px-4 pt-12 pb-32">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h1 className="text-3xl font-bold text-primary">{isEditingProfile ? 'Update Profile' : 'Welcome'}</h1>
                        <p className="text-slate-400">{isEditingProfile ? 'Refine your health details' : "Let's set up your profile"}</p>
                      </div>
                      <div className="flex gap-4 items-center">
                        {isEditingProfile && (
                          <button onClick={() => setIsEditingProfile(false)} className="px-3 py-1.5 text-xs text-slate-300 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors">
                            Cancel
                          </button>
                        )}
                        <UserButton appearance={{ elements: { userButtonAvatarBox: "w-10 h-10 border-2 border-primary/50" } }} />
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
                {!profile ? (
                  <div className="pt-6 flex justify-center items-center h-64">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="pt-6">
                    <h2 className="text-2xl font-bold px-4 mb-4">Your Progress</h2>
                    <Progress profile={profile} token={token!} />
                  </div>
                )}
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

        <Navigation profile={profile} isSignedIn={isSignedIn} />
      </div>
    </BrowserRouter>
  );
}

const Navigation = ({ profile, isSignedIn }: { profile: any; isSignedIn: boolean | undefined }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = location.pathname.substring(1) || 'dashboard';

  if (!isSignedIn || !profile || location.pathname === '/login' || location.pathname === '/register') return null;

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
