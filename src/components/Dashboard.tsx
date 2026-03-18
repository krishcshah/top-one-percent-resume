import React from 'react';
import { motion } from 'motion/react';
import { ResumeAnalysis } from '../services/gemini';
import { AlertOctagon, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  analysis: ResumeAnalysis;
}

export function Dashboard({ analysis }: DashboardProps) {
  const scoreColor =
    analysis.atsScore >= 80
      ? 'text-emerald-500'
      : analysis.atsScore >= 60
      ? 'text-amber-500'
      : 'text-rose-500';

  const scoreBg =
    analysis.atsScore >= 80
      ? 'bg-emerald-50 border-emerald-200'
      : analysis.atsScore >= 60
      ? 'bg-amber-50 border-amber-200'
      : 'bg-rose-50 border-rose-200';

  return (
    <div className="space-y-8">
      {/* Top Section: Score & Conclusion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ATS Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`col-span-1 rounded-3xl border p-8 flex flex-col items-center justify-center text-center ${scoreBg}`}
        >
          <div className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">
            ATS Match Score
          </div>
          <div className={`text-7xl font-black tracking-tighter ${scoreColor}`}>
            {analysis.atsScore}
          </div>
          <div className="text-sm font-medium text-slate-600 mt-4">
            Out of 100
          </div>
        </motion.div>

        {/* Executive Conclusion Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-1 lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Executive Conclusion
            </h3>
          </div>
          <p className="text-slate-700 leading-relaxed text-lg">
            {analysis.executiveConclusion}
          </p>
        </motion.div>
      </div>

      {/* Must-Fix Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Top 3 Must-Fix Priorities
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analysis.mustFixItems.map((item, index) => (
            <div
              key={index}
              className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative overflow-hidden group hover:border-rose-200 transition-colors"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <p className="text-slate-700 font-medium leading-relaxed">
                  {item}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
