import React from 'react';
import { motion } from 'framer-motion';
import { Receipt, CheckCircle2, AlertCircle, Clock, Download, Filter, Search } from 'lucide-react';

const PaymentRow = ({ id, plan, amount, date, status }) => (
  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group">
    <td className="py-4 px-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green">
          <Receipt size={16} />
        </div>
        <div>
          <p className="text-sm font-bold">{plan}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-tighter">#{id}</p>
        </div>
      </div>
    </td>
    <td className="py-4 px-4 text-sm font-bold">₹{amount}</td>
    <td className="py-4 px-4 text-sm text-gray-400">{date}</td>
    <td className="py-4 px-4">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
        status === 'Paid' ? 'bg-neon-green/10 text-neon-green' : 'bg-red-500/10 text-red-500'
      }`}>
        {status === 'Paid' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
        {status}
      </span>
    </td>
    <td className="py-4 px-4 text-right">
      <button className="p-2 hover:bg-neon-green hover:text-black rounded-lg transition-all text-gray-500">
        <Download size={18} />
      </button>
    </td>
  </tr>
);

const MobilePaymentCard = ({ id, plan, amount, date, status }) => (
  <div className="glass-card p-4 flex flex-col gap-4 border-l-4 border-l-neon-green">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Plan</p>
        <h4 className="font-bold text-lg">{plan}</h4>
      </div>
      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
        status === 'Paid' ? 'bg-neon-green/10 text-neon-green' : 'bg-red-500/10 text-red-500'
      }`}>
        {status}
      </span>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Amount</p>
        <p className="font-bold">₹{amount}</p>
      </div>
      <div>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Date</p>
        <p className="text-sm">{date}</p>
      </div>
    </div>
    <div className="pt-2 border-t border-white/5 flex justify-between items-center">
      <p className="text-[10px] text-gray-600 font-mono">#{id}</p>
      <button className="text-neon-green flex items-center gap-1 text-xs font-bold">
        <Download size={14} /> Invoice
      </button>
    </div>
  </div>
);

const Payments = () => {
  const payments = [
    { id: 'TXN89234', plan: 'Monthly Platinum', amount: '2,500', date: '01 May, 2024', status: 'Paid' },
    { id: 'TXN89112', plan: 'Quarterly Cardio', amount: '6,000', date: '01 Feb, 2024', status: 'Paid' },
    { id: 'TXN88991', plan: 'Monthly Platinum', amount: '2,500', date: '01 Jan, 2024', status: 'Paid' },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 lg:pb-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black tracking-tight">Payments & Billing</h2>
          <p className="text-gray-400 mt-1">Manage your membership plans and download invoices.</p>
        </div>
        <button className="btn-neon flex items-center gap-2 justify-center">
          <Filter size={18} /> Upgrade Plan
        </button>
      </div>

      {/* Current Plan Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-t-4 border-t-neon-green flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Current Plan</p>
            <h3 className="text-2xl font-black mt-1 tracking-tight">Monthly Platinum</h3>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm font-bold text-neon-green italic underline">Manage Subscription</p>
            <div className="w-10 h-10 rounded-full bg-neon-green/10 flex items-center justify-center text-neon-green">
              <Clock size={20} />
            </div>
          </div>
        </div>
        
        <div className="glass-card p-6 border-t-4 border-t-blue-500 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Next Billing Date</p>
            <h3 className="text-2xl font-black mt-1 tracking-tight">01 June, 2024</h3>
          </div>
          <div className="mt-6">
            <p className="text-sm text-gray-400">Automatic renewal enabled</p>
          </div>
        </div>

        <div className="glass-card p-6 border-t-4 border-t-purple-500 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Payment Method</p>
            <h3 className="text-2xl font-black mt-1 tracking-tight">Visa •••• 4242</h3>
          </div>
          <div className="mt-6">
            <p className="text-sm text-gray-400 font-bold hover:text-white transition-colors cursor-pointer">Update Method</p>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-xl font-bold">Transaction History</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search transactions..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:border-neon-green transition-all"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/2">
                <th className="py-4 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Transaction / Plan</th>
                <th className="py-4 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Amount</th>
                <th className="py-4 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Date</th>
                <th className="py-4 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                <th className="py-4 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <PaymentRow key={i} {...p} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden p-4 space-y-4">
          {payments.map((p, i) => (
            <MobilePaymentCard key={i} {...p} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Payments;
