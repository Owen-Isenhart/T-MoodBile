"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  DownloadCloud,
  ChevronDown,
  PhoneCall,
  Pencil,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Backend base URL (Swagger server)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://cytotoxic-peptonelike-dannie.ngrok-free.dev';

function normalizePhoneNumber(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('+')) {
    return '+' + trimmed.slice(1).replace(/\D/g, '');
  }
  return trimmed.replace(/\D/g, '');
}


// --- SENTIMENT/GAUGE DUMMY DATA ---
const sentimentStats = [
  {
    title: "Direct Sentiment",
    positive: 65,
    neutral: 18,
    negative: 17,
    colors: ["#70FF99", "#FDD657", "#CC0000"], // green, yellow, dark red
  },
  {
    title: "Indirect Sentiment",
    positive: 47,
    neutral: 31,
    negative: 22,
    colors: ["#70FF99", "#FDD657", "#CC0000"],
  },
  {
    title: "Total Customer Sentiment",
    positive: 55,
    neutral: 25,
    negative: 20,
    colors: ["#70FF99", "#FDD657", "#CC0000"],
  },
];

// (moved below)

const sentimentLegend = [
  { label: "Positive", color: "#70FF99" },
  { label: "Neutral", color: "#FDD657" },
  { label: "Negative", color: "#CC0000" },
];

// ------------- SENTIMENT OVER TIME DUMMY DATA SYSTEM 2025 -------------
// Utility to generate dummy sentiment trend data for 2025 by month
function makeTrend(month: number, year = 2025): { date: string, value: number }[] {
  const now = new Date();
  const isCurrentMonth = (year === now.getFullYear() && month === now.getMonth());
  const numDaysInMonth = new Date(year, month + 1, 0).getDate();
  const lastDay = isCurrentMonth ? now.getDate() : numDaysInMonth;
  // For current month: daily points up to today. Others: every ~4 days (1,5,9,...), capped to month length.
  const baseDays = isCurrentMonth
    ? Array.from({ length: lastDay }, (_, i) => i + 1)
    : [1, 5, 9, 13, 17, 21, 25, 30].filter(d => d <= lastDay);
  return baseDays.map(d => ({
    date: `${new Date(year, month, d).toLocaleString('default', { month: 'short' })} ${d}`,
    value: 70 + Math.floor(Math.random() * 21) // 70-90%
  }));
}
const MONTH_LIST_2025 = [
  'Jan 2025','Feb 2025','Mar 2025','Apr 2025','May 2025','Jun 2025','Jul 2025','Aug 2025','Sep 2025','Oct 2025','Nov 2025','Dec 2025',
];
const chartMonthlyData: Record<string, { date: string, value: number }[]> = {};
MONTH_LIST_2025.forEach((label, i) => {
  chartMonthlyData[label] = makeTrend(i);
});
const chartMonths = MONTH_LIST_2025;

// (moved below originalCustomers)

// Device time
const getTodayMonthLabel = () => {
  const now = new Date();
  // Use en-US locale to ensure consistent month abbreviation format
  const monthAbbr = now.toLocaleString('en-US', { month: 'short' });
  const year = now.getFullYear();
  const monthLabel = `${monthAbbr} ${year}`;
  // If the current month is in chartMonths, use it; otherwise default to first month (Jan 2025)
  return chartMonths.includes(monthLabel) ? monthLabel : chartMonths[0];
};
const getTodayLabel = () => {
  const now = new Date();
  return `${now.toLocaleString('default',{month:'short'})} ${now.getDate()}`;
};

// --- CALL CUSTOMERS DUMMY DATA ---
const originalCustomers = [
  {
    order: "#10000",
    name: "Alex Murphy",
    email: "alexmurphy@email.com",
    date: "Jan 5, 2025",
    level: "Amplified",
    country: "Germany",
    phone: "+49 1512 1234567",
  },
  {
    order: "#10001",
    name: "Priya Patel",
    email: "priya.patel@email.com",
    date: "Feb 9, 2025",
    level: "All In",
    country: "India",
    phone: "+91 90457 00001",
  },
  {
    order: "#10002",
    name: "Veronica Lee",
    email: "veronical@email.com",
    date: "Mar 17, 2025",
    level: "Rely",
    country: "USA",
    phone: "+1 208 404 4040",
  },
  {
    order: "#10003",
    name: "Ben Singh",
    email: "bens@email.com",
    date: "Apr 1, 2025",
    level: "Amplified",
    country: "UK",
    phone: "+44 7911 777888",
  },
  {
    order: "#10004",
    name: "Maria Garcia",
    email: "mariag@email.com",
    date: "May 9, 2025",
    level: "All In",
    country: "Spain",
    phone: "+34 600 123456",
  },
  {
    order: "#10005",
    name: "Anders Olsen",
    email: "anders.olsen@email.com",
    date: "Jun 13, 2025",
    level: "Amplified",
    country: "Denmark",
    phone: "+45 2012 3456",
  },
  {
    order: "#1520",
    name: "John Carter",
    email: "hello@johncarter.com",
    date: "Jan 30, 2025",
    level: "All In",
    country: "United States",
    phone: "+1 (823) 750-2356",
  },
  {
    order: "#1531",
    name: "Sophie Moore",
    email: "contact@sophiemoore.com",
    date: "Feb 27, 2025",
    level: "Amplified",
    country: "United Kingdom",
    phone: "+44 (823)-950-2330",
  },
  {
    order: "#1530",
    name: "Matt Cannon",
    email: "info@mattcannon.com",
    date: "Mar 24, 2025",
    level: "All In",
    country: "Australia",
    phone: "+61 (213)-540-2492",
  },
  {
    order: "#1539",
    name: "Graham Hilda",
    email: "hilda@vharris.co",
    date: "Apr 21, 2025",
    level: "Rely",
    country: "India",
    phone: "+91 (823) 750-2356",
  },
  {
    order: "#1538",
    name: "Sandy Houston",
    email: "contact@sandyhouston.com",
    date: "May 18, 2025",
    level: "All In",
    country: "Canada",
    phone: "+1 (832)-554-3432",
  },
  {
    order: "#1537",
    name: "Andy Smith",
    email: "hello@andysmith.com",
    date: "Jun 16, 2025",
    level: "Rely",
    country: "United States",
    phone: "+1 (823)-240-2330",
  },
  {
    order: "#1555",
    name: "Mani Verma",
    email: "maniverma@tmobile.com",
    date: "May 17, 2025",
    level: "Amplified",
    country: "India",
    phone: "+91 88547 23011",
  },
  {
    order: "#1566",
    name: "Poppy Wright",
    email: "pwright@metro.com",
    date: "May 11, 2025",
    level: "All In",
    country: "USA",
    phone: "+1 672-212-8723",
  },
];

// Generate additional dummy customers for all months except the month AFTER the current month
type Customer = (typeof originalCustomers)[number];
const nextMonthLabel = (() => {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthAbbr = next.toLocaleString('en-US', { month: 'short' });
  return `${monthAbbr} ${next.getFullYear()}`;
})();
const generatedCustomers: Customer[] = [];
MONTH_LIST_2025.forEach((label, idx) => {
  if (label === nextMonthLabel) return; // skip next month
  const [monAbbr, yearStr] = label.split(' ');
  const year = parseInt(yearStr, 10);
  const monthIndex = idx; // aligned with MONTH_LIST_2025
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const dayA = Math.min(12, daysInMonth);
  const dayB = Math.min(24, daysInMonth);
  const baseOrder = 20000 + idx * 10;
  generatedCustomers.push(
    {
      order: `#${baseOrder}`,
      name: `Dummy User ${idx + 1}A`,
      email: `dummy${idx + 1}a@example.com`,
      date: `${monAbbr} ${dayA}, ${year}`,
      level: ["Rely","Amplified","All In"][idx % 3],
      country: ["USA","India","Germany","UK","Canada"][idx % 5],
      phone: "+1 555-000-0000",
    },
    {
      order: `#${baseOrder + 1}`,
      name: `Dummy User ${idx + 1}B`,
      email: `dummy${idx + 1}b@example.com`,
      date: `${monAbbr} ${dayB}, ${year}`,
      level: ["Rely","Amplified","All In"][ (idx + 1) % 3],
      country: ["USA","India","Germany","UK","Canada"][ (idx + 2) % 5],
      phone: "+1 555-000-0001",
    }
  );
});
// Set first dummy user for November 2025 to specific phone number
(() => {
  const novIdx = MONTH_LIST_2025.indexOf('Nov 2025');
  if (novIdx >= 0) {
    const arrIdx = novIdx * 2; // A entry
    if (generatedCustomers[arrIdx]) {
      generatedCustomers[arrIdx].phone = "+1 832 759 3256";
    }
  }
})();
const allCustomers: Customer[] = [...originalCustomers, ...generatedCustomers];

const levelColorClasses: Record<string, string> = {
  "Rely": "bg-blue-600 text-white",
  "Amplified": "bg-green-500 text-white",
  "All In": "bg-yellow-400 text-gray-900",
};

// --- MAIN COMPONENT ---
export default function DashboardPage() {
  
  
  // --- State ---
  // Month - default to first month with data (Jan 2025) if current month not available
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const todayLabel = getTodayMonthLabel();
    return chartMonths.includes(todayLabel) ? todayLabel : chartMonths[0];
  });
  // Trend data (stateful to allow adding 'now')
  const [trend, setTrend] = useState<{ [k: string]: { date: string, value: number }[] }>(chartMonthlyData);
  // Sentiment stats (stateful so backend can update)
  const [sentimentStatsData, setSentimentStatsData] = useState(sentimentStats);
  // Insights state - FIFO list (newest first)
  const [insights, setInsights] = useState<{ id: number; text: string; completed: boolean }[]>([]);
  const [insightCounter, setInsightCounter] = useState(0);
  // Current highlight: today's date label
  const todayLabel = getTodayLabel();
  const isCurrMonth = selectedMonth === getTodayMonthLabel();
  // User name (no auth integration)
  const userName = "User";
  // Sentiment modal
  const [openSentiment, setOpenSentiment] = useState<{title: string, positive: number, neutral: number, negative: number} | null>(null);
  
  // Check if selected month is in the future
  const now = new Date();
  const [selMonthName, selYearStr] = selectedMonth.split(' ');
  const selYear = parseInt(selYearStr, 10);
  const selMonthIndex = chartMonths.indexOf(selectedMonth);
  const isFutureMonth = selYear > now.getFullYear() || 
    (selYear === now.getFullYear() && selMonthIndex > now.getMonth());

  // Effect: For curr month, add a new point for today (if not already present) every 3s, simulating real-time (Robinhood style)
  useEffect(() => {
    if (!isCurrMonth) return;
    const interval = setInterval(() => {
      setTrend(trendData => {
        const now = new Date();
        const dateLabel = `${now.toLocaleString('default',{month:'short'})} ${now.getDate()}`;
        const currMonthArr = trendData[selectedMonth] || [];
        if (!currMonthArr.some(d => d.date === dateLabel)) {
          const newPt = { date: dateLabel, value: 70 + Math.floor(Math.random()*21) };
          return { ...trendData, [selectedMonth]: [...currMonthArr, newPt] };
        }
        return trendData;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedMonth, isCurrMonth]);

  // Chart data to display: up to today if in current month, empty if future month, otherwise all
  let chartData = trend[selectedMonth] || [];
  if (isFutureMonth) {
    chartData = []; // No data for future months
  } else if (isCurrMonth) {
    const todayIdx = chartData.findIndex(d => parseInt(d.date.split(' ')[1]) === now.getDate());
    if (todayIdx >= 0) chartData = chartData.slice(0, todayIdx+1);
  }

  // Get current data point for highlight
  let highlightIdx = chartData.length - 1;
  if (isCurrMonth) {
    const idx = chartData.findIndex(d => parseInt(d.date.split(' ')[1]) === now.getDate());
    if (idx !== -1) highlightIdx = idx;
  }

  // --- CUSTOMER TABLE (Filtered by Month) ---
  const monthFilterLabel = selectedMonth.split(" ")[0].toLowerCase(); // e.g. "jan"
  const customersInMonth = allCustomers.filter((c: Customer) => {
    const customerMonth = c.date.split(" ")[0].toLowerCase(); // e.g. "jan" from "Jan 5, 2025"
    return customerMonth === monthFilterLabel;
  });
  // --- Row Selection State ---
  const [selectedRows, setSelectedRows] = useState<{ [order: string]: boolean }>({});
  // Helper for Select All state
  const allChecked = customersInMonth.length > 0 && customersInMonth.every((c: Customer) => selectedRows[c.order]);
  const someChecked = !allChecked && customersInMonth.some((c: Customer) => selectedRows[c.order]);

  // --- Handlers ---
  const handleExport = (): void => alert("Export data");
  const handleEnableNotifications = (): void => alert("Enable notifications");

  const handleSelectRandom = () => {
    // Randomly select 5 in current filtered list
    const shuffled = [...customersInMonth].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, 5);
    const newSel: { [order: string]: boolean } = {};
    picked.forEach((c: Customer) => (newSel[c.order] = true));
    setSelectedRows(newSel);
  };

  const handleMakeCall = async () => {
    const toCall = customersInMonth.filter((c: Customer) => selectedRows[c.order]);
    if (toCall.length === 0) {
      alert("Please select customer(s) to call.");
      return;
    }
    try {
      const results: string[] = [];
      for (const c of toCall) {
        const normalized = normalizePhoneNumber(c.phone);
        const createRes = await fetch(`${API_BASE_URL}/api/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: c.name, phone: normalized }),
        });
        if (!createRes.ok) {
          const errText = await createRes.text();
          results.push(`${c.name}: failed to upsert customer (${errText})`);
          continue;
        }
        const customer = await createRes.json();
        const id = customer.id;
        if (!id) {
          results.push(`${c.name}: missing id from customer response`);
          continue;
        }
        const callRes = await fetch(`${API_BASE_URL}/api/calls/${id}`, { method: 'POST' });
        if (!callRes.ok) {
          const errText = await callRes.text();
          results.push(`${c.name}: call failed (${errText})`);
          continue;
        }
        const call = await callRes.json();
        results.push(`${c.name}: call initiated (SID ${call.callSid || 'N/A'})`);
      }
      alert(results.join('\\n'));
    } catch (e) {
      console.error(e);
      alert('Failed to initiate calls. See console for details.');
    }
  };
  const handleEdit = (name: string): void => alert(`Edit ${name}`);
  const handleDelete = (name: string): void => alert(`Delete ${name}`);
  
  // Insights handlers
  const handleAddInsight = () => {
    const newInsight = {
      id: insightCounter,
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      completed: false,
    };
    setInsights([newInsight, ...insights]); // Add to front (FIFO)
    setInsightCounter(insightCounter + 1);
  };
  
  const handleToggleInsight = (id: number) => {
    setInsights(insights.map(ins => ins.id === id ? { ...ins, completed: !ins.completed } : ins));
  };
  const handleDeleteInsight = (id: number) => {
    setInsights(insights.filter(ins => ins.id !== id));
  };
  // Row selection
  const toggleRow = (order: string) => {
    setSelectedRows((prev) => ({ ...prev, [order]: !prev[order] }));
  };
  const setAllRows = (checked: boolean) => {
    const sel: { [order: string]: boolean } = {};
    customersInMonth.forEach((c: Customer) => (sel[c.order] = checked));
    setSelectedRows(sel);
  };
  // --- Sentiment arc util ---
  function getArc(percent: number, startAngle: number, color: string) {
    // percent: %, startAngle in degrees. returns arc path for semicircle
    const angle = (percent / 100) * 180;
    const r = 55, cx = 62.5, cy = 66;
    const rad = (deg: number) => (Math.PI / 180) * deg;
    const x1 = cx + r * Math.cos(rad(startAngle));
    const y1 = cy + r * Math.sin(rad(startAngle));
    const x2 = cx + r * Math.cos(rad(startAngle + angle));
    const y2 = cy + r * Math.sin(rad(startAngle + angle));
    const largeArcFlag = angle > 180 ? 1 : 0;
    const path = `M${x1},${y1} A${r},${r} 0 ${largeArcFlag},1 ${x2},${y2}`;
    return (
      <path
        key={color+startAngle}
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
      />
    );
  }
  // Arc color order: Positive (start 180), Neutral, Negative
  const arcStartAngles = [180, 180, 180];

  return (
    <div
      className="min-h-screen bg-pink-500/100 flex"
    >
      {/* Sidebar */}
      <aside className="w-[270px] min-w-[220px] bg-white flex flex-col items-center py-6 px-4 border-r-2 border-black">
        {/* Logo */}
        <div className="flex items-center gap-4 w-full mb-3 px-4">
          <div className="w-12 h-12 flex items-center justify-center">
            <img src="/TMoodBileLogo.svg" alt="T-MoodBile Logo" className="w-full h-full" />
          </div>
          <span className="font-extrabold text-3xl text-[#ED008C] tracking-wide whitespace-nowrap">
            T-MoodBile
          </span>
        </div>
        {/* Insights Section */}
        <div className="w-full mt-1 flex-1 flex flex-col">
          <h3 className="text-[#ED008C] text-lg font-semibold mb-3 px-2">Insights</h3>
          <div className="flex-1 overflow-y-auto space-y-2 px-2">
            {insights.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-4">No insights yet</p>
            ) : (
              insights.map((insight) => (
                <div
                  key={insight.id}
                  className="bg-pink-50 border border-pink-100 rounded-lg p-3 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={insight.completed}
                      onChange={() => handleToggleInsight(insight.id)}
                      className="mt-1 w-4 h-4 accent-[#ED008C] cursor-pointer flex-shrink-0"
                    />
                    <p className={`text-gray-700 text-xs leading-relaxed ${
                      insight.completed ? 'line-through opacity-60' : ''
                    }`}>
                      {insight.text}
                    </p>
                  </div>
                  <div className="mt-2 pl-6">
                    <button
                      onClick={() => handleDeleteInsight(insight.id)}
                      className="text-[#ED008C] hover:opacity-90 text-xs font-medium flex items-center gap-1"
                      aria-label="Delete insight"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Main content wrapper */}
      <main className="flex-1 flex flex-col min-h-screen bg-white bg-opacity-90">
        {/* Top Header */}
        <div className="flex items-center justify-between px-10 pt-8 pb-3">
          <div>
            <h2 className="text-[#ED008C] font-semibold text-2xl">
              Welcome back, {userName}
            </h2>
            <div className="text-xs text-gray-600 mt-0.5">
              View the customer sentiment of your company
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEnableNotifications}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#ED008C] text-xs text-[#ED008C] font-medium bg-white hover:bg-[#ED008C]/10 transition"
            >
              <Bell size={16} />
              Enable Notifications
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#ED008C] text-xs text-[#ED008C] font-medium bg-white hover:bg-[#ED008C]/10 transition"
            >
              <DownloadCloud size={16} />
              Export data
            </button>
          </div>
        </div>

        {/* Sentiment Cards */}
        <section className="mx-10 flex gap-6 mt-2 mb-6">
          {sentimentStatsData.map((item, idx) => {
            const total = item.positive + item.neutral + item.negative;
            const pos = (item.positive / total) * 100;
            const neu = (item.neutral / total) * 100;
            const neg = (item.negative / total) * 100;
            // Arc positions
            const start1 = 180; // Positive
            const start2 = 180 + (pos * 1.8); // Neutral
            const start3 = start2 + (neu * 1.8); // Negative
            return (
              <Card
                key={item.title}
                className="rounded-xl flex-1 bg-[#ED008C]/90 shadow-[0_10px_28px_rgba(0,0,0,0.35)] py-5 px-5 min-w-[250px] cursor-pointer"
                onClick={() => setOpenSentiment(item)}
              >
                <div className="font-semibold text-white text-[18px] mb-0">
                  {item.title}
                </div>
                <div className="flex flex-col items-center justify-center gap-0">
                  <div className="relative mb-1">
                    <svg width="180" height="110" viewBox="0 0 125 76" className="mx-auto">
                      {/* arcs */}
                      {getArc(pos, start1, item.colors[0])}
                      {getArc(neu, start2, item.colors[1])}
                      {getArc(neg, start3, item.colors[2])}
                    </svg>
                    <div className="absolute inset-x-0 top-[65px] flex flex-col items-center">
                      <span className="font-bold text-3xl text-white leading-none">
                        {item.positive}%
                      </span>
                      <span className="text-xs text-white mt-1">Positive</span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="w-full mt-2">
                    <div className="grid grid-cols-3 gap-1">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold" style={{ color: item.colors[0] }}>Positive</span>
                        <span className="text-xs text-white">{item.positive}%</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold" style={{ color: item.colors[1] }}>Neutral</span>
                        <span className="text-xs text-white">{item.neutral}%</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold" style={{ color: item.colors[2] }}>Negative</span>
                        <span className="text-xs text-white">{item.negative}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </section>

        {/* Sentiment Over Time - Full Width (Robinhood style, 2025, current date) */}
        <Card className="bg-[#ED008C]/90 rounded-xl px-6 pt-5 pb-2 mx-10 w-auto shadow-[0_10px_28px_rgba(0,0,0,0.35)] mb-7">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-white font-semibold text-lg">
              <span className="w-5 h-5 flex items-center justify-center bg-[#ED008C] rounded-full text-white text-xs font-extrabold mr-2">
                <svg width={18} height={18}>
                  <circle cx={9} cy={9} r={7} fill="#fff" fillOpacity={0.19} />
                  <circle cx={9} cy={9} r={4} fill="#fff" />
                </svg>
              </span>
              <span>Sentiment Over Time</span>
            </div>
            {/* Month Dropdown */}
            <div className="relative">
              <button type="button"
                className="flex items-center bg-white/80 text-sm px-2.5 py-1 rounded-md border border-[#ED008C] text-[#ED008C] hover:bg-[#ED008C]/10 transition font-medium min-w-[128px]"
              >
                {selectedMonth}
                <ChevronDown size={16} className="ml-2" />
                <select
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                >
                  {chartMonths.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </button>
            </div>
          </div>
          {/* Dynamic % - pulls latest value from line */}
          {!isFutureMonth && (
            <div className="flex items-baseline mb-2">
              <span className="text-white text-xl font-bold">
                {chartData.length > 0 ? chartData[highlightIdx].value+'%' : '--'}
              </span>
              {/* Percentage change indicator */}
              {chartData.length > 1 && (
                <span className={`ml-2 text-xs font-bold flex items-center ${chartData[highlightIdx].value > chartData[highlightIdx-1].value ? 'text-green-200' : chartData[highlightIdx].value < chartData[highlightIdx-1].value ? 'text-red-200' : 'text-white/60'}`}>
                  {chartData[highlightIdx].value > chartData[highlightIdx-1].value ? '▲' : chartData[highlightIdx].value < chartData[highlightIdx-1].value ? '▼' : '—'}
                  {Math.abs(chartData[highlightIdx].value - chartData[highlightIdx-1].value)}%
                </span>
              )}
            </div>
          )}
          {isFutureMonth && (
            <div className="flex items-baseline mb-2">
              <span className="text-white/60 text-sm italic">No data available for future months</span>
            </div>
          )}
          <div className="w-full h-[220px] mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPink" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fff" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#fff" stopOpacity={0.09} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#fff", fontSize: 12 }}
                  padding={{ left: 10, right: 10 }}
                  ticks={isCurrMonth
                    ? chartData.map(d => d.date) // tick for each day up to today
                    : chartData.filter((_, i) => i % 2 === 0 || i === chartData.length - 1).map(d => d.date) // ticks every 2 data points for past months
                  }
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  hide
                  domain={[60, 100]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#ED008C",
                    border: "none",
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2.6}
                  fill="url(#colorPink)"
                  dot={{ stroke: "#fff", strokeWidth: 2, fill: "#ED008C", r: 4 }}
                  activeDot={{ stroke: "#fff", strokeWidth: 2, fill: "#ED008C", r: 6 }}
                />
                {/* Highlight current date point (Robinhood-style) */}
                {chartData.length > 0 && (
                  <circle
                    cx={((highlightIdx)/(chartData.length-1||1))*98+1+'%'}
                    cy={220 - ((chartData[highlightIdx].value-60)/40)*180}
                    r={8}
                    stroke="#fff"
                    strokeWidth={3}
                    fill="#ED008C"
                    opacity="0.75"
                  />
                )}
                {chartData.length > 0 && (
                  <line
                    x1={((highlightIdx)/(chartData.length-1||1))*100+'%'} x2={((highlightIdx)/(chartData.length-1||1))*100+'%'} y1={0} y2={220}
                    stroke="#fff" strokeDasharray="6 2" strokeWidth={2.0} opacity={0.87}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Table - Call Customers - Full width, moved down */}
        <Card className="bg-[#ED008C]/90 rounded-xl px-6 pt-4 pb-4 shadow-[0_10px_28px_rgba(0,0,0,0.35)] mx-10 min-w-[400px] mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-white text-lg">
              Call Customers For A Survey
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center bg-white/80 text-sm px-2.5 py-1 rounded-md border border-[#ED008C] text-[#ED008C] hover:bg-[#ED008C]/10 transition font-medium min-w-[100px]"
                >
                  {selectedMonth}
                  <ChevronDown size={16} className="ml-2" />
                  <select
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                  >
                    {chartMonths.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </button>
              </div>
              <button
                onClick={handleSelectRandom}
                className="bg-[#ED008C] text-white font-semibold text-xs rounded-md px-2.5 py-1 border border-[#ED008C] shadow hover:opacity-90 transition"
              >
                Select Random Sample
              </button>
              <button
                onClick={handleMakeCall}
                className="bg-[#ED008C] text-white font-semibold text-xs rounded-md flex items-center px-3 py-1 gap-1 shadow hover:opacity-90 transition"
              >
                <PhoneCall size={16} className="mr-1" /> Make Call
              </button>
            </div>
          </div>
          {/* Table */}
          <div className="overflow-x-auto rounded-lg scrollbar-thin scrollbar-thumb-[#ED008C] max-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#ED008C]/30">
                  <th className="px-2 py-2 text-white text-xs font-semibold rounded-tl-lg text-center">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={el => {
                        if (el) el.indeterminate = someChecked;
                      }}
                      onChange={e => setAllRows(e.target.checked)}
                      className="accent-[#ED008C] w-4 h-4 border rounded"
                      aria-label="Select All"
                    />
                  </th>
                  <th className="px-2 py-2 text-white text-xs font-semibold">
                    Order
                  </th>
                  <th className="px-2 py-2 text-white text-xs font-semibold">
                    Client
                  </th>
                  <th className="px-2 py-2 text-white text-xs font-semibold">
                    Date
                  </th>
                  <th className="px-2 py-2 text-white text-xs font-semibold">
                    Level
                  </th>
                  <th className="px-2 py-2 text-white text-xs font-semibold">
                    Country
                  </th>
                  <th className="px-2 py-2 text-white text-xs font-semibold">
                    Phone Number
                  </th>
                  <th className="px-2 py-2 text-white text-xs font-semibold rounded-tr-lg text-center w-12">
                    {/* Actions */}
                  </th>
                </tr>
              </thead>
              <tbody>
                {customersInMonth.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-white font-semibold py-6">
                      No customers for this month.
                    </td>
                  </tr>
                ) : customersInMonth.map((customer, idx) => (
                  <tr
                    key={customer.order}
                    className={`even:bg-pink-600/40 odd:bg-pink-500/70 border-y border-pink-400/25`}
                  >
                    <td className="px-2 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!selectedRows[customer.order]}
                        onChange={() => toggleRow(customer.order)}
                        className="accent-pink-500 w-4 h-4 border rounded"
                        aria-label={`Select ${customer.name}`}
                      />
                    </td>
                    <td className="px-2 py-3 font-bold text-white text-sm">
                      {customer.order}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-col">
                        <span className="text-white font-semibold text-sm leading-tight">
                          {customer.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-white text-sm font-medium">
                      {customer.date}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${levelColorClasses[customer.level as string]}`}
                      >
                        {customer.level}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-white text-sm font-medium">
                      {customer.country}
                    </td>
                    <td className="px-2 py-3 text-white text-sm font-medium">
                      {customer.phone}
                    </td>
                    <td className="px-2 py-3 text-white flex gap-2 items-center justify-center">
                      <button
                        className="hover:bg-pink-700/50 p-0.5 rounded transition"
                        onClick={() => handleEdit(customer.name)}
                        aria-label={`Edit ${customer.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="hover:bg-red-500/50 p-0.5 rounded transition"
                        onClick={() => handleDelete(customer.name)}
                        aria-label={`Delete ${customer.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {openSentiment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpenSentiment(null)} />
          <div className="relative z-10 w-[560px] max-w-[92vw] bg-white rounded-xl shadow-2xl p-6 border border-[#ED008C]/20">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-2xl font-extrabold text-[#ED008C]">{openSentiment.title}</h3>
              <button onClick={() => setOpenSentiment(null)} className="text-[#ED008C] font-semibold px-3 py-1 border border-[#ED008C] rounded-md hover:bg-[#ED008C]/10 transition text-sm">Close</button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-100 rounded-lg p-3 text-center">
                <div className="text-sm font-semibold" style={{color: '#70FF99'}}>Positive</div>
                <div className="text-xl font-extrabold">{openSentiment.positive}%</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 text-center">
                <div className="text-sm font-semibold" style={{color: '#FDD657'}}>Neutral</div>
                <div className="text-xl font-extrabold">{openSentiment.neutral}%</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-3 text-center">
                <div className="text-sm font-semibold" style={{color: '#CC0000'}}>Negative</div>
                <div className="text-xl font-extrabold">{openSentiment.negative}%</div>
              </div>
            </div>
            <div className="text-gray-700 text-sm leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </div>
          </div>
        </div>
      )}
      
      {/* Add Insight Button - Bottom Left */}
      <button
        onClick={handleAddInsight}
        className="fixed bottom-6 left-6 bg-[#ED008C] text-white font-semibold text-sm rounded-lg px-4 py-2 shadow-lg hover:opacity-90 transition flex items-center gap-2"
      >
        <span className="text-lg">+</span> Add Insight
      </button>
    </div>
  );
}
