'use client';

import React, { useState } from 'react';
import { Heart, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function DonatePage() {
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const amounts = [25, 50, 100, 250, 500];

  return (
    <div className="bg-black text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-semibold uppercase tracking-wider">
            <Heart className="h-3.5 w-3.5" />
            <span>Conservation & Community Fund</span>
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-[#B68D40] to-white">
            Support the Himalayan Cause
          </h1>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            Your generous contributions go directly toward high-altitude trail maintenance, waste management initiatives, emergency beacon networks, and supporting Sherpa porter education programs.
          </p>
        </div>

        {submitted ? (
          <div className="bg-neutral-900 border border-green-500/40 p-8 rounded-2xl text-center space-y-4 animate-in fade-in duration-300">
            <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Thank You for Your Support!</h2>
            <p className="text-gray-300 text-sm">
              Your contribution of <span className="text-green-400 font-bold">${customAmount || selectedAmount}</span> directly protects the mountain trails and empowers local communities.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
            >
              Make Another Donation
            </button>
          </div>
        ) : (
          <div className="bg-neutral-900/80 p-8 rounded-2xl border border-neutral-800 space-y-6">
            <h3 className="text-xl font-bold text-white text-center">Select Donation Amount (USD)</h3>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {amounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount('');
                  }}
                  className={`py-3 rounded-xl text-base font-bold transition-all border ${
                    selectedAmount === amt && !customAmount
                      ? 'bg-green-600 text-white border-green-500 shadow-lg shadow-green-600/30'
                      : 'bg-neutral-800 border-neutral-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Custom Amount ($)</label>
              <input
                type="number"
                placeholder="Or enter custom amount..."
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(0);
                }}
                className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-green-500"
              />
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={() => setSubmitted(true)}
                className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-base transition shadow-lg shadow-green-600/30 flex items-center justify-center gap-2"
              >
                <Heart className="h-5 w-5 fill-white" />
                <span>Complete Donation (${customAmount || selectedAmount})</span>
              </button>
              
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="h-4 w-4 text-green-400" />
                <span>Encrypted & Tax-Deductible Non-Profit Donation</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
