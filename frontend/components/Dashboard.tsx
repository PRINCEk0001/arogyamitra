import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Flame, Utensils, PlayCircle, Clock, ChevronRight, Info, Plus, Minus, Droplets, Calendar as CalendarIcon, CheckCircle2, User } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile, MealPlan, Workout, Meal, HealthStats, DiscoverData } from '../types';
import { GoogleCalendarButton } from './GoogleCalendarButton';
import { WorkoutTimer } from './WorkoutTimer';
import { DigitalClock } from './DigitalClock';
import { MacroSearch } from './MacroSearch';

const waterDropIcon = '/nano_water.png';
const calendarDropIcon = '/nano_calendar.png';

interface DashboardProps {
  profile: UserProfile;
  healthStats: HealthStats | null;
  mealPlan: MealPlan | null;
  workout: Workout | null;
  discoverData: DiscoverData | null;
  onRefresh: () => void;
  onEditProfile: () => void;
  loading: boolean;
  activeTab: 'dashboard' | 'workout' | 'nutrition';
  token: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  healthStats,
  mealPlan,
  workout,
  discoverData,
  onRefresh,
  onEditProfile,
  loading,
  activeTab,
  token
}) => {
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();
  const [waterIntake, setWaterIntake] = useState(0);
  const dailyWaterGoal = 2500; // ml

  // Smart Workout Scheduler state
  const [selectedDay, setSelectedDay] = useState(0); // 0 = Today
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();

  // Helper to ensure YouTube links are embeddable in iframes
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
        return `https://www.youtube.com/embed/${urlObj.searchParams.get('v')}`;
      }
      if (urlObj.hostname.includes('youtu.be')) {
        return `https://www.youtube.com/embed${urlObj.pathname}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const renderHeader = () => (
    <header className="flex items-center justify-between px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">ArogyaMitra</h1>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.2em]">
          {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'workout' ? 'Training' : 'Nutrition'}
        </p>
      </div>
      <button
        onClick={onEditProfile}
        className="w-10 h-10 rounded-full bg-surface-dark border border-white/10 flex items-center justify-center hover:border-primary/50 transition-all active:scale-90 shadow-lg shadow-black/20"
      >
        <User className="w-5 h-5 text-primary" />
      </button>
    </header>
  );

  if (activeTab === 'workout') {
    if (!workout) {
      return (
        <div className="flex flex-col gap-2 pb-24 min-h-screen">
          {renderHeader()}
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Preparing Your Training</h3>
            <p className="text-slate-400 text-sm">We're crafting a personalized workout plan based on your profile. Please wait a moment...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2 pb-24">
        {/* Smart Workout Scheduler Header */}
        <header className="px-4 pt-6 pb-2 flex flex-col gap-5 sticky top-0 bg-background-dark/90 backdrop-blur-xl z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <CalendarIcon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-white tracking-tight">Smart Schedule</h1>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{days[today]}, {time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
            <button
              onClick={onEditProfile}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-primary/50 transition-all active:scale-90 overflow-hidden"
            >
              <User className="w-5 h-5 text-primary" />
            </button>
          </div>

          {/* 7-Day Calendar Scroll */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 mask-linear">
            {days.map((dayName, idx) => {
              const dateOffset = idx - today;
              const d = new Date(time);
              d.setDate(time.getDate() + dateOffset);

              const isSelected = selectedDay === dateOffset;
              const isToday = dateOffset === 0;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(dateOffset)}
                  className={`flex flex-col items-center justify-center w-14 h-20 shrink-0 rounded-[1.2rem] transition-all border ${isSelected
                    ? 'bg-primary text-background-dark border-primary shadow-[0_5px_15px_-5px_rgba(19,236,178,0.5)] scale-105'
                    : isToday
                      ? 'bg-primary/10 border-primary/30 text-white'
                      : 'bg-surface-dark border-white/5 text-slate-400 hover:bg-white/5 hover:border-white/20'
                    }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-background-dark/70' : isToday ? 'text-primary' : 'text-slate-500'}`}>{dayName}</span>
                  <span className={`text-xl font-bold mt-1 ${isSelected ? 'text-background-dark' : 'text-white'}`}>{d.getDate()}</span>
                  {(isSelected || isToday) && (
                    <span className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-background-dark' : 'bg-primary'}`}></span>
                  )}
                </button>
              );
            })}
          </div>
        </header>

        <div className="px-4 flex flex-col gap-6 mt-2">
          {selectedDay !== 0 ? (
            <div className="bg-surface-dark p-8 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-4 group hover:border-primary/30 transition-colors">
              <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <img src={calendarDropIcon} alt="Calendar" className="w-12 h-12 object-contain filter drop-shadow-[0_0_15px_rgba(19,236,178,0.3)]" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-white">Future Schedule</h3>
                <p className="text-xs text-slate-400">Your AI coach will generate specific regimens for this day.</p>
              </div>
              <button
                onClick={() => setSelectedDay(0)}
                className="mt-2 px-6 py-2.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                Return to Today
              </button>
            </div>
          ) : (
            <div className="bg-surface-dark rounded-[2.5rem] overflow-hidden border border-white/5 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)]">
              <div className="h-56 bg-cover bg-center relative group" style={{ backgroundImage: `url(${workout.imageUrl})` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/40 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-1 block">Recommended Plan</span>
                    <h3 className="text-2xl font-bold text-white">{workout.title}</h3>
                  </div>
                  <GoogleCalendarButton
                    token={token}
                    summary={`Workout: ${workout.title}`}
                    description={`Duration: ${workout.duration}\nIntensity: ${workout.intensity}\nExercises: ${workout.exercises?.map(e => e.name).join(', ')}`}
                  />
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[10px] bg-white/5 px-3 py-1.5 rounded-full text-slate-400 font-bold uppercase tracking-widest border border-white/5">{workout.duration}</span>
                  <span className="text-[10px] bg-primary/10 px-3 py-1.5 rounded-full text-primary font-bold uppercase tracking-widest border border-primary/10">{workout.intensity}</span>
                </div>

                <div className="mb-8">
                  <WorkoutTimer initialMinutes={parseInt(workout.duration) || 30} />
                </div>

                <p className="text-sm text-slate-400 mb-8 leading-relaxed">"{workout.reason}"</p>
                <div className="flex flex-col gap-4">
                  {workout.exercises?.map((ex, i) => (
                    <div key={i} className="flex flex-col gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Exercise {i + 1}</span>
                          <span className="font-bold text-white text-lg">{ex.name}</span>
                        </div>
                        <div className="bg-primary/20 px-4 py-2 rounded-2xl border border-primary/20">
                          <span className="text-primary font-mono font-bold">{ex.sets} x {ex.reps}</span>
                        </div>
                      </div>
                      {ex.videoUrl && (
                        <div
                          className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-inner cursor-pointer group/vid"
                          onClick={() => window.open(ex.videoUrl, '_blank')}
                        >
                          {/* YouTube thumbnail derived from the video ID */}
                          <img
                            src={`https://img.youtube.com/vi/${(() => {
                              try {
                                const u = new URL(ex.videoUrl);
                                return u.searchParams.get('v') || u.pathname.split('/').pop() || '';
                              } catch { return ''; }
                            })()}/hqdefault.jpg`}
                            alt={`${ex.name} tutorial`}
                            className="w-full h-full object-cover opacity-70 group-hover/vid:opacity-100 transition-all duration-500"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center group-hover/vid:scale-110 transition-transform shadow-lg">
                              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full">Watch on YouTube</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'nutrition') {
    if (!mealPlan) {
      return (
        <div className="flex flex-col gap-2 pb-24 min-h-screen">
          {renderHeader()}
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
              <Utensils className="w-8 h-8 text-orange-500 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Calculating Nutrition</h3>
            <p className="text-slate-400 text-sm">Our AI is generating a balanced meal plan tailored to your goals. Hang tight!</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2 pb-24">
        {renderHeader()}
        <div className="px-4 flex flex-col gap-6 mt-4">
          <MacroSearch token={token} />

          <div className="flex items-center justify-between mt-2">
            <h2 className="text-xl font-bold text-white">Daily Fuel</h2>
            <button onClick={onRefresh} disabled={loading} className="text-primary text-[10px] font-bold uppercase tracking-[0.2em] disabled:opacity-50 bg-primary/10 px-4 py-2 rounded-full border border-primary/10">
              {loading ? 'Syncing...' : 'Refresh Plan'}
            </button>
          </div>

          {mealPlan.imageUrl && (
            <div className="relative h-48 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl group">
              <img
                src={mealPlan.imageUrl}
                alt="Nutrition Theme"
                className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6">
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-1 block">Nutrition Plan</span>
                <h3 className="text-2xl font-bold text-white">Fuel Your Body</h3>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-dark p-6 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Target Energy</p>
              <p className="text-3xl font-bold text-white">{mealPlan.targetCalories} <span className="text-xs text-slate-500 font-medium">kcal</span></p>
            </div>
            <div className="bg-surface-dark p-6 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Protein Goal</p>
              <p className="text-3xl font-bold text-primary">{Math.round(mealPlan.targetProtein)} <span className="text-xs text-slate-500 font-medium">g</span></p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {mealPlan && Object.entries(mealPlan)
              .filter(([k]) => k !== 'targetCalories' && k !== 'targetProtein' && k !== 'imageUrl')
              .map(([key, meal]) => {
                const m = meal as Meal;
                return (
                  <div key={key} className="bg-surface-dark p-6 rounded-[2rem] border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <Utensils className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-0.5">{key}</p>
                        <p className="font-bold text-white text-lg">{m.name}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{m.calories || 0} <span className="text-[10px] text-slate-500 uppercase">kcal</span></p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">P:{m.macros?.p ?? 0}g</span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">C:{m.macros?.c ?? 0}g</span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">F:{m.macros?.f ?? 0}g</span>
                        </div>
                      </div>
                      <GoogleCalendarButton
                        token={token}
                        summary={`Meal: ${m.name} (${key})`}
                        description={`Calories: ${m.calories}\nMacros: P:${m.macros?.p}g, C:${m.macros?.c}g, F:${m.macros?.f}g`}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      {renderHeader()}

      {/* Thematic Hero Image */}
      {discoverData?.thematicImage && (
        <section className="px-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative h-48 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group"
          >
            <img
              src={discoverData.thematicImage}
              alt="Health Theme"
              className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background-dark/90 via-background-dark/40 to-transparent flex flex-col justify-center px-10">
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-2">Daily Insight</span>
              <h2 className="text-2xl font-bold text-white leading-tight">Elevate Your<br /><span className="text-primary">Health Pulse</span></h2>
              <p className="text-xs text-slate-300 mt-2 max-w-[180px] leading-relaxed opacity-80">Personalized precision for your fitness journey.</p>
            </div>
          </motion.div>
        </section>
      )}

      {/* BMI / Readiness Ring */}
      <section className="flex flex-col items-center justify-center py-6 relative">
        <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full w-64 h-64 mx-auto top-1/2 -translate-y-1/2"></div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative z-10 w-52 h-52 rounded-full border-[6px] border-primary/10 flex flex-col items-center justify-center bg-surface-dark/40 backdrop-blur-3xl shadow-[0_0_60px_rgba(19,236,178,0.1)]"
        >
          <div className="absolute inset-0 rounded-full border border-white/5"></div>
          <span className="text-5xl font-bold text-primary tracking-tighter">{healthStats?.bmi || '--'}</span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold mt-2">BMI Index</span>
          <div className="mt-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/10">
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest">{healthStats?.category}</span>
          </div>
        </motion.div>
      </section>

      {/* Time and Stats Grid */}
      <section className="grid grid-cols-2 gap-4 px-4">
        <DigitalClock />
        <div className="bg-surface-dark p-6 rounded-[2rem] border border-white/5 flex flex-col gap-2 shadow-xl hover:border-primary/20 transition-colors group">
          <div className="flex items-center gap-2 text-primary">
            <Flame className="w-4 h-4 group-hover:animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Daily Burn</span>
          </div>
          <div className="text-2xl font-bold text-white">{healthStats?.tdee || '--'} <span className="text-xs text-slate-500 font-medium">kcal</span></div>
        </div>
        <div className="bg-surface-dark p-6 rounded-[2rem] border border-white/5 flex flex-col gap-2 shadow-xl hover:border-blue-400/20 transition-colors group col-span-2">
          <div className="flex items-center gap-2 text-blue-400">
            <Activity className="w-4 h-4 group-hover:animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Base Metabolic Rate (BMR)</span>
          </div>
          <div className="text-2xl font-bold text-white">{healthStats?.bmr || '--'} <span className="text-xs text-slate-500 font-medium">kcal</span></div>
        </div>
      </section>

      {/* Video Suggestions System */}
      <section className="px-4 flex flex-col gap-5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Curated Discoveries</h3>
          <button onClick={() => navigate('/explore')} className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
            Explore <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
          {discoverData?.suggestions.map((video) => (
            <motion.div
              key={video.id}
              whileHover={{ y: -5 }}
              className="min-w-[280px] bg-surface-dark rounded-[2.5rem] overflow-hidden border border-white/5 group shadow-2xl cursor-pointer"
              onClick={() => window.open(video.videoUrl, '_blank')}
            >
              <div className="relative h-40">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center border border-primary/30 group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-bold text-white border border-white/10">
                  {video.duration}
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">{video.category}</span>
                </div>
                <p className="text-base font-bold text-white leading-tight group-hover:text-primary transition-colors">{video.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Water Tracking System */}
      <section className="px-4 flex flex-col gap-4">
        <div className="bg-surface-dark p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent"></div>

          <div className="relative flex justify-between items-start mb-6">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-[1.5rem] bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-lg p-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-cyan-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <img src={waterDropIcon} alt="Water Tracker" className="w-full h-full object-contain relative z-10 hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 mb-1">Hydration</span>
                <span className="text-2xl font-bold text-white tracking-tight">{waterIntake} <span className="text-sm text-slate-400 font-medium">/ {dailyWaterGoal} ml</span></span>
              </div>
            </div>
            <div className="bg-cyan-500 flex items-center gap-1 px-3 py-1.5 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Droplets className="w-3 h-3 text-background-dark" fill="currentColor" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-background-dark">{Math.round((waterIntake / dailyWaterGoal) * 100)}%</span>
            </div>
          </div>

          <div className="relative h-2 bg-background-dark rounded-full mb-6 overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((waterIntake / dailyWaterGoal) * 100, 100)}%` }}
              transition={{ type: 'spring', damping: 20 }}
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full"
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMDAnIGhlaWdodD0nMTAwJz48ZmlsdGVyIGlkPSdmJz48ZmVUdXJidWxlbmNlIHR5cGU9J2ZyYWN0YWxOb2lzZScgYmFzZUZyZXF1ZW5jeT0nMC4wNScgbnVtT2N0YXZlcz0nMScgcmVzdWx0PSdub2lzZScvPjxfeEFSZEMgaW49J25vaXNlJyBpbjI9J1NvdXJjZUdyYXBoaWMnIHNjYWxlPSc1JyB4Q2hhbm5lbFNlbGVjdG9yPSdSJyB5Q2hhbm5lbFNlbGVjdG9yPSdHJy8+PC9maWx0ZXI+PHBvcHkgZmlsdGVyPSd1cmwoI2YpJyB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyBmaWxsPSdyaWdodCcvPjwvc3ZnPg==')] opacity-30 animate-pulse"></div>
            </motion.div>
          </div>

          <div className="relative flex justify-between gap-3">
            <button
              onClick={() => setWaterIntake(Math.max(0, waterIntake - 250))}
              className="flex-1 h-12 rounded-2xl bg-surface-dark border border-white/10 flex items-center justify-center hover:bg-white/[0.03] active:scale-[0.98] transition-all text-slate-400 hover:text-white"
            >
              <Minus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setWaterIntake(waterIntake + 250)}
              className="flex-[2] h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center gap-2 hover:bg-cyan-500/20 active:scale-[0.98] transition-all group/btn"
            >
              <Plus className="w-4 h-4 text-cyan-400 group-hover/btn:rotate-90 transition-transform" />
              <span className="text-sm font-bold text-cyan-400 tracking-wider">250 ml</span>
            </button>
          </div>
        </div>
      </section>

      {/* Quick Summary Cards */}
      <section className="px-4 flex flex-col gap-4">
        <div
          onClick={() => navigate('/workout')}
          className="bg-surface-dark p-6 rounded-[2rem] border border-white/5 flex items-center justify-between hover:bg-white/[0.02] transition-all group cursor-pointer active:scale-[0.98]"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/10 group-hover:scale-105 transition-transform">
              <Activity className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-1">Active Training</p>
              <p className="font-bold text-white text-lg">{workout?.title || 'Syncing...'}</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary transition-colors" />
          </div>
        </div>

        <div
          onClick={() => navigate('/nutrition')}
          className="bg-surface-dark p-6 rounded-[2rem] border border-white/5 flex items-center justify-between hover:bg-white/[0.02] transition-all group cursor-pointer active:scale-[0.98]"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/10 group-hover:scale-105 transition-transform">
              <Utensils className="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-1">Nutrition Target</p>
              <p className="font-bold text-white text-lg">{mealPlan?.targetCalories || '--'} <span className="text-xs text-slate-500">kcal</span></p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-orange-500/20 group-hover:border-orange-500/30 transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-orange-500 transition-colors" />
          </div>
        </div>
      </section>

      {/* Developer Credit */}
      <footer className="px-4 py-12 flex flex-col items-center justify-center gap-3 opacity-30">
        <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-2"></div>
        <p className="text-[8px] uppercase tracking-[0.4em] font-bold text-slate-500">Developed & Crafted by</p>
        <p className="text-[10px] font-bold text-primary tracking-[0.3em]">PRINCE KORI</p>
      </footer>
    </div>
  );
};
