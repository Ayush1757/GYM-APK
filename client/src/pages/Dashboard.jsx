import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Activity, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  ArrowUpRight
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, trend, color }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass-card p-4 lg:p-6 flex flex-col gap-4 relative overflow-hidden group"
  >
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-20`} style={{ backgroundColor: color }}></div>
    
    <div className="flex items-center justify-between">
      <div className="p-3 rounded-xl bg-white/5 border border-white/5">
        <Icon size={24} style={{ color }} />
      </div>
      {trend && (
        <span className="flex items-center text-xs font-bold text-neon-green bg-neon-green/10 px-2 py-1 rounded-lg">
          <TrendingUp size={12} className="mr-1" /> {trend}
        </span>
      )}
    </div>
    
    <div>
      <p className="text-gray-400 text-sm font-medium">{label}</p>
      <h3 className="text-2xl lg:text-3xl font-black mt-1 tracking-tight">{value}</h3>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const stats = [
    { icon: Activity, label: 'Workouts Done', value: '24', trend: '+12%', color: '#ccff00' },
    { icon: Clock, label: 'Active Minutes', value: '1,420', trend: '+8%', color: '#3b82f6' },
    { icon: Calendar, label: 'Days Streak', value: '12', color: '#f97316' },
    { icon: Users, label: 'Gym Occupancy', value: '65%', color: '#a855f7' },
  ];

  const recentActivities = [
    { title: 'Chest Day', date: 'Today, 08:30 AM', duration: '45 mins', intensity: 'High' },
    { title: 'Cardio Session', date: 'Yesterday, 06:15 PM', duration: '30 mins', intensity: 'Medium' },
    { title: 'Leg Day', date: '2 days ago, 07:00 AM', duration: '60 mins', intensity: 'High' },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 lg:pb-0">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-4xl font-black tracking-tight">Welcome Back, Ayush! 👋🏻</h2>
          <p className="text-gray-400 mt-1">Here's what's happening with your fitness journey today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-neon text-sm py-2">Start Workout</button>
          <button className="p-2 glass-card rounded-lg hover:bg-white/5"><Calendar size={20}/></button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Progress Chart Placeholder */}
        <div className="lg:col-span-2 glass-card p-6 min-h-[300px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Weekly Progress</h3>
            <select className="bg-white/5 border border-white/10 rounded-lg text-xs px-2 py-1 outline-none">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="flex-1 flex items-end justify-between gap-2 lg:gap-4 mt-4">
            {[40, 70, 45, 90, 65, 85, 60].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div 
                  className="w-full bg-white/5 rounded-t-lg relative overflow-hidden transition-all duration-500 group-hover:bg-neon-green/20"
                  style={{ height: `${h}%` }}
                >
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: '100%' }}
                    className="absolute bottom-0 left-0 right-0 bg-neon-green opacity-80"
                  />
                </div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  {['M','T','W','T','F','S','S'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Recent Workouts</h3>
            <button className="text-neon-green text-xs font-bold flex items-center hover:underline">
              View All <ArrowUpRight size={14} className="ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((act, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                <div className="w-12 h-12 rounded-xl bg-neon-green/10 flex items-center justify-center text-neon-green border border-neon-green/20 group-hover:bg-neon-green group-hover:text-black transition-all">
                  <CheckCircle2 size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{act.title}</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">{act.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold">{act.duration}</p>
                  <p className={`text-[10px] font-black uppercase tracking-tighter mt-1 ${
                    act.intensity === 'High' ? 'text-red-500' : 'text-neon-green'
                  }`}>{act.intensity}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 rounded-xl border border-dashed border-white/20 text-gray-400 text-sm font-bold hover:border-neon-green hover:text-neon-green transition-all">
            + Log Manual Activity
          </button>
        </div>
      </div>

      {/* Announcements / Tasks */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold mb-4">Today's Challenge</h3>
        <div className="relative p-6 rounded-2xl bg-gradient-to-r from-neon-green/20 to-transparent border border-neon-green/30 overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-neon-green/10 blur-3xl rounded-full"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h4 className="text-2xl font-black italic tracking-tighter text-white">50 PUSHUPS CHALLENGE ⚡</h4>
              <p className="text-gray-400 mt-1 max-w-md">Complete 50 pushups today to earn the "Iron Chest" badge and 50 XP points.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-dark-bg bg-gray-800 flex items-center justify-center text-xs font-bold">
                    {i}
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-dark-bg bg-neon-green text-black flex items-center justify-center text-[10px] font-black">
                  +12
                </div>
              </div>
              <button className="btn-neon whitespace-nowrap">Join Now</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
