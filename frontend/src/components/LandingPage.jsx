import React from 'react';
import { SignInButton } from "@clerk/clerk-react";

export default function LandingPage() {
    return (
        <div className="relative min-h-screen w-full h-full overflow-y-auto bg-[#fafafa] flex flex-col font-sans">

            {/* Header / Navbar equivalent for Landing Page */}
            <header className="absolute top-0 w-full h-20 flex justify-between items-center px-10 z-20">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#023c28] rounded-md flex items-center justify-center">
                        <span className="text-[#c5f015] font-bold text-xl leading-none">D</span>
                    </div>
                    <span className="text-xl font-bold text-[#023c28]">Debate AI</span>
                </div>

                <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
                    <a href="#" className="hover:text-gray-900 transition">Solutions</a>
                    <a href="#" className="hover:text-gray-900 transition">Customers</a>
                    <a href="#" className="hover:text-gray-900 transition">Pricing</a>
                </div>

                <div className="flex items-center gap-4">
                    <SignInButton mode="modal">
                        <button className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hidden sm:block">
                            Log In
                        </button>
                    </SignInButton>
                    <SignInButton mode="modal">
                        <button className="text-sm font-semibold text-white bg-[#023c28] hover:bg-[#035439] transition px-6 py-2.5 rounded-lg shadow-md">
                            Start Now
                        </button>
                    </SignInButton>
                </div>
            </header>

            {/* Grid Background */}
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-40">
                <div className="w-full h-full bg-grid-pattern mask-[radial-gradient(ellipse_at_center,black_40%,transparent_70%)]"></div>
            </div>

            {/* Main Hero Section */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-20 text-center">

                {/* Badge */}
                <div className="mb-8 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-bold text-[#023c28] uppercase tracking-wider">
                    <span className="text-lg leading-none">⚡</span> Create debates fast
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-7xl font-extrabold text-[#023c28] tracking-tight max-w-4xl leading-[1.1]">
                    One tool to <span className="relative whitespace-nowrap">
                        <span className="relative z-10">manage</span>
                        <span className="absolute bottom-1.5 md:bottom-2 left-0 w-full h-3 md:h-4 bg-[#c5f015] -z-10"></span>
                    </span> debates
                </h1>

                {/* Subheadline */}
                <p className="mt-8 text-lg text-gray-600 max-w-2xl leading-relaxed">
                    Debate AI helps teams research faster, smarter and more efficiently, delivering visibility
                    and data-driven insights to mitigate bias and ensure comprehensive analysis.
                </p>

                {/* CTA Buttons */}
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                    <SignInButton mode="modal">
                        <button className="px-8 py-3.5 bg-[#023c28] hover:bg-[#035439] text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5">
                            Start for Free
                        </button>
                    </SignInButton>
                    <button className="px-8 py-3.5 bg-white text-[#023c28] font-semibold border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition transform hover:-translate-y-0.5">
                        Get a Demo
                    </button>
                </div>

                {/* Floating Avatars (Absolute Positioning) */}
                <div className="hidden lg:block absolute top-[25%] left-[10%] xl:left-[15%] w-24 h-24 animate-float-slow">
                    <img src="https://api.dicebear.com/9.x/toon-head/svg?eyebrows=happy,neutral&hair=sideComed,spiky,undercut&mouth=laugh,smile&skinColor=c68e7a,f1c3a5&seed=Eliza" alt="User" className="w-20 h-20 rounded-full border-4 border-white shadow-xl object-cover bg-white" />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#023c28] rounded-full flex items-center justify-center text-white border-2 border-white transform rotate-[-30deg]">
                        <span className="text-xs">▶</span>
                    </div>
                </div>

                <div className="hidden lg:block absolute top-[20%] right-[10%] xl:right-[15%] w-24 h-24 animate-float-delayed">
                    <img src="https://api.dicebear.com/9.x/toon-head/svg?eyebrows=happy,neutral&hair=sideComed,spiky,undercut&mouth=laugh,smile&skinColor=c68e7a,f1c3a5&seed=Jade" alt="User" className="w-20 h-20 rounded-full border-4 border-white shadow-xl object-cover bg-white" />
                    <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-[#023c28] rounded-full flex items-center justify-center text-white border-2 border-white transform rotate-210">
                        <span className="text-xs">▶</span>
                    </div>
                </div>

                <div className="hidden lg:block absolute bottom-[25%] right-[15%] xl:right-[20%] w-28 h-28 animate-float">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jude&backgroundColor=ffdfbf" alt="User" className="w-24 h-24 rounded-full border-4 border-[#eae5dd] shadow-xl object-cover bg-white" />
                    <div className="absolute top-0 -left-4 w-8 h-8 bg-[#023c28] rounded-full flex items-center justify-center text-white border-2 border-white transform rotate-135">
                        <span className="text-xs">▶</span>
                    </div>
                </div>


            </main>

            {/* Partners Section */}
            <div className="relative z-10 w-full bg-[#fafafa] py-12 border-t border-gray-100 flex flex-col md:flex-row items-center justify-center gap-10 px-6">

            </div>


            {/* Dark CTA Banner Section */}
            <div className="relative z-30 w-full bg-[#1b2522] text-white py-20 px-8 lg:px-24 flex flex-col md:flex-row items-center justify-between border-b border-white/10">
                <div className="max-w-2xl mb-8 md:mb-0">
                    <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                        Discover the full scale of <br />
                        <span className="relative inline-block mt-2">
                            Debate AI
                            <span className="absolute -bottom-2 left-0 w-full h-0.75 bg-[#c5f015]"></span>
                        </span> capabilities
                    </h2>
                </div>
                <div className="flex gap-4">
                    <SignInButton mode="modal">
                        <button className="px-6 py-3 bg-[#c5f015] text-[#1b2522] font-bold rounded-lg hover:bg-[#a6d10c] transition shadow-md">
                            Start for Free
                        </button>
                    </SignInButton>
                </div>
            </div>

            {/* Footer Section */}
            <footer className="w-full bg-[#111816] py-16 px-8 lg:px-24 text-gray-300 relative z-30">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between gap-12 lg:gap-8">
                    {/* Brand Col */}
                    <div className="flex flex-col gap-6 lg:w-1/4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-[#c5f015] rounded flex items-center justify-center">
                                <span className="text-[#111816] font-black text-xs">D</span>
                            </div>
                            <span className="text-xl font-bold text-white">Debate AI</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <span>✉</span> hello@debateai.com
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <span>📞</span> +91 8975124896
                        </div>
                    </div>

                    {/* Link Cols */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
                        <div className="flex flex-col gap-4">
                            <h4 className="font-bold text-white mb-2">Solution</h4>
                            <a href="#" className="hover:text-white transition">Why Debate AI</a>
                            <a href="#" className="hover:text-white transition">Features</a>
                            <a href="#" className="hover:text-white transition">Technology</a>
                            <a href="#" className="hover:text-white transition">Security</a>
                        </div>
                        <div className="flex flex-col gap-4">
                            <h4 className="font-bold text-white mb-2">Customers</h4>
                            <a href="#" className="hover:text-white transition">Procurement</a>
                            <a href="#" className="hover:text-white transition">Sales</a>
                            <a href="#" className="hover:text-white transition">Legal</a>
                            <a href="#" className="hover:text-white transition">Enterprise</a>
                        </div>
                        <div className="flex flex-col gap-4">
                            <h4 className="font-bold text-white mb-2">Resources</h4>
                            <a href="#" className="hover:text-white transition">Pricing</a>
                            <a href="#" className="hover:text-white transition">Contact Sales</a>
                            <a href="#" className="hover:text-white transition">Blog</a>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto mt-20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                    <p>© Copyright 2026 Debate AI. All rights reserved.</p>
                    <div className="flex gap-6 text-gray-400">
                        <a href="#" className="hover:text-white font-bold text-lg">𝕏</a>
                        <a href="#" className="hover:text-white font-bold text-lg">in</a>
                        <a href="#" className="hover:text-white font-bold text-lg">📷</a>
                        <a href="#" className="hover:text-white font-bold text-lg">▶</a>
                    </div>
                </div>
            </footer>

        </div>
    );
}
