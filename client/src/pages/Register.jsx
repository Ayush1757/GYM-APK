import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight, ShieldCheck } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', role: 'member' });
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-neon-green/10 blur-[150px] rounded-full"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white italic underline decoration-neon-green decoration-4 underline-offset-8">JOIN THE TRIBE 💪🏻</h1>
          <p className="text-gray-400 mt-6">Start your fitness journey today with Tara Fitness Centre</p>
        </div>

        <div className="glass-card overflow-hidden shadow-2xl flex flex-col md:flex-row">
          {/* Left Side Info (Hidden on Mobile) */}
          <div className="hidden md:flex md:w-5/12 bg-neon-green p-10 flex-col justify-between relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck size={120} />
            </div>
            <div>
              <h2 className="text-black text-3xl font-black italic tracking-tighter leading-none mb-4">MEMBER<br/>BENEFITS</h2>
              <ul className="space-y-4">
                {['24/7 Gym Access', 'Personalized Workout Plans', 'Progress Tracking', 'Expert Coaching'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-black font-bold text-sm">
                    <ShieldCheck size={16} /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-black text-neon-green p-4 rounded-xl">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1">Current Offer</p>
              <p className="text-xl font-black">20% OFF YEARLY</p>
            </div>
          </div>

          {/* Right Side Form */}
          <div className="flex-1 p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-600" size={18} />
                    <input 
                      type="text" 
                      placeholder="John Doe"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-neon-green text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-gray-600" size={18} />
                    <input 
                      type="tel" 
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-neon-green text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-600" size={18} />
                  <input 
                    type="email" 
                    placeholder="john@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-neon-green text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-600" size={18} />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-neon-green text-sm"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full btn-neon py-3.5 flex items-center justify-center gap-2 group text-sm">
                  Create Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>

            <p className="text-center mt-6 text-xs text-gray-500 font-bold uppercase tracking-widest">
              Already a member? {' '}
              <Link to="/login" className="text-neon-green hover:underline">Login here</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
