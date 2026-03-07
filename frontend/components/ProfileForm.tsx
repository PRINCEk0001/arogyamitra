import React, { useState } from 'react';
import { UserProfile } from '../types';
import { motion } from 'motion/react';

interface ProfileFormProps {
  profile?: UserProfile | null;
  onSubmit: (profile: UserProfile) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ profile: initialProfile, onSubmit }) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile || {
    age: 25,
    gender: 'Male',
    height: 175,
    weight: 70,
    activityLevel: 'Moderate',
    goals: 'general_health',
    sleepHours: 7,
    dietaryRestrictions: 'None'
  });

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="p-8 bg-surface-dark rounded-[2.5rem] border border-white/10 shadow-2xl max-w-md mx-auto"
    >
      <h2 className="text-2xl font-bold mb-2 text-center text-white">Setup Your Profile</h2>
      <p className="text-slate-400 text-center text-sm mb-8">Help us personalize your health journey</p>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Age</label>
            <input
              type="number"
              value={profile.age}
              onChange={e => setProfile({ ...profile, age: parseInt(e.target.value) })}
              className="bg-background-dark border border-white/5 rounded-2xl p-4 text-white focus:border-primary/50 outline-none transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Gender</label>
            <select
              value={profile.gender}
              onChange={e => setProfile({ ...profile, gender: e.target.value })}
              className="bg-background-dark border border-white/5 rounded-2xl p-4 text-white focus:border-primary/50 outline-none transition-colors appearance-none"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Height (cm)</label>
            <input
              type="number"
              value={profile.height}
              onChange={e => setProfile({ ...profile, height: parseInt(e.target.value) })}
              className="bg-background-dark border border-white/5 rounded-2xl p-4 text-white focus:border-primary/50 outline-none transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Weight (kg)</label>
            <input
              type="number"
              value={profile.weight}
              onChange={e => setProfile({ ...profile, weight: parseInt(e.target.value) })}
              className="bg-background-dark border border-white/5 rounded-2xl p-4 text-white focus:border-primary/50 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Activity Level</label>
          <select
            value={profile.activityLevel}
            onChange={e => setProfile({ ...profile, activityLevel: e.target.value })}
            className="bg-background-dark border border-white/5 rounded-2xl p-4 text-white focus:border-primary/50 outline-none transition-colors appearance-none"
          >
            <option value="Sedentary">Sedentary</option>
            <option value="Light">Lightly Active</option>
            <option value="Moderate">Moderately Active</option>
            <option value="Very">Very Active</option>
            <option value="Extra">Extra Active</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Goals</label>
          <select
            value={profile.goals}
            onChange={e => setProfile({ ...profile, goals: e.target.value })}
            className="bg-background-dark border border-white/5 rounded-2xl p-4 text-white focus:border-primary/50 outline-none transition-colors appearance-none"
          >
            <option value="fat_loss">Weight Loss</option>
            <option value="muscle_gain">Muscle Gain</option>
            <option value="endurance">Endurance</option>
            <option value="general_health">General Health</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Dietary Restrictions</label>
          <input
            type="text"
            placeholder="e.g. Vegan, No Nuts"
            value={profile.dietaryRestrictions}
            onChange={e => setProfile({ ...profile, dietaryRestrictions: e.target.value })}
            className="bg-background-dark border border-white/5 rounded-2xl p-4 text-white focus:border-primary/50 outline-none transition-colors"
          />
        </div>

        <button
          onClick={() => onSubmit(profile)}
          className="mt-4 bg-primary text-background-dark font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
        >
          Start My Journey
        </button>
      </div>
    </motion.div>
  );
};
