"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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

function formatMonthLabel(date: Date): string {
  return `${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`;
}

function getMonthLabelFromISO(dateStr: string): string {
  const d = new Date(dateStr);
  return formatMonthLabel(d);
}

function getMonthDayLabelFromISO(dateStr: string): string {
  const d = new Date(dateStr);
  const monthAbbr = d.toLocaleString('en-US', { month: 'short' });
  return `${monthAbbr} ${d.getDate()}`;
}

const DEFAULT_MONTHS = ['Oct 2025', 'Nov 2025'];

type CustomerRow = {
  id: number;
  name: string;
  phone: string;
  date: string;
  level: string;
  country: string;
  monthLabel: string;
};

type ActionableInsight = {
  id: number;
  type: 'survey' | 'social';
  sentiment: string;
  text: string;
  insight: string | null;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
};

type TrendSeries = {
  topic: string;
  points: { date: string; value: number }[];
};

type SurveyResponse = {
  id: number;
  customer_name: string | null;
  customer_phone: string | null;
  sentiment: string;
  transcript: string | null;
  insight: string | null;
  created_at: string;
};

type SocialPost = {
  id: number;
  platform: string;
  text_content: string;
  sentiment: string;
  insight: string | null;
  post_url: string | null;
  created_at: string;
};

const sentimentLegend = [
  { label: "Positive", color: "#70FF99" },
  { label: "Neutral", color: "#FDD657" },
  { label: "Negative", color: "#CC0000" },
];

const defaultSentimentStats = [
  {
    title: "Direct Sentiment",
    positive: 0,
    neutral: 0,
    negative: 0,
    colors: ["#70FF99", "#FDD657", "#CC0000"],
  },
  {
    title: "Indirect Sentiment",
    positive: 0,
    neutral: 0,
    negative: 0,
    colors: ["#70FF99", "#FDD657", "#CC0000"],
  },
  {
    title: "Total Customer Sentiment",
    positive: 0,
    neutral: 0,
    negative: 0,
    colors: ["#70FF99", "#FDD657", "#CC0000"],
  },
];

const levelColorClasses: Record<string, string> = {
  "Rely": "bg-blue-600 text-white",
  "Amplified": "bg-green-500 text-white",
  "All In": "bg-yellow-400 text-gray-900",
};

async function fetchJson<T = any>(
  url: string,
  options?: RequestInit,
  label?: string
): Promise<T | null> {
  const tag = label ? `[Dashboard] ${label}` : "[Dashboard]";
  try {
    const res = await fetch(url, options);
    const raw = await res.text();
    console.debug(`${tag} raw response`, raw);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${raw}`);
    }
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error(`${tag} failed to parse JSON`, err, raw);
      throw err;
    }
  } catch (err) {
    console.error(`${tag} request failed`, err);
    throw err;
  }
}

// --- MAIN COMPONENT ---
export default function DashboardPage() {
  
  
  // --- State ---
  const currentMonthLabel = useMemo(() => formatMonthLabel(new Date()), []);
  const initialMonths = useMemo(() => {
    const seed = new Set(DEFAULT_MONTHS);
    if (currentMonthLabel) {
      seed.add(currentMonthLabel);
    }
    return Array.from(seed);
  }, [currentMonthLabel]);

  const [chartMonths, setChartMonths] = useState<string[]>(initialMonths);
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    initialMonths.includes(currentMonthLabel) ? currentMonthLabel : initialMonths[0]
  );
  const [trend, setTrend] = useState<Record<string, { date: string; value: number }[]>>({});
  const [sentimentStatsData, setSentimentStatsData] = useState(defaultSentimentStats);
  const [allCustomers, setAllCustomers] = useState<CustomerRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Record<number, boolean>>({});
  const [actionableInsights, setActionableInsights] = useState<ActionableInsight[]>([]);
  const [trendsData, setTrendsData] = useState<TrendSeries[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [resolvingInsightId, setResolvingInsightId] = useState<number | null>(null);
  const [openSentiment, setOpenSentiment] = useState<{title: string, positive: number, neutral: number, negative: number} | null>(null);

  const todayLabel = useMemo(() => {
    const now = new Date();
    return `${now.toLocaleString('default',{month:'short'})} ${now.getDate()}`;
  }, []);

  const isCurrMonth = selectedMonth === currentMonthLabel;
  const now = new Date();
  const [selMonthName, selYearStr] = selectedMonth.split(' ');
  const selYear = parseInt(selYearStr ?? `${now.getFullYear()}`, 10);
  const selMonthIndex = chartMonths.indexOf(selectedMonth);
  const isFutureMonth =
    selYear > now.getFullYear() ||
    (selYear === now.getFullYear() && selMonthIndex > now.getMonth());

  const userName = "User";

  useEffect(() => {
    setSelectedRows({});
  }, [selectedMonth]);

  // Effect removed: No simulated data points; rely solely on backend data

  // Effect: Fetch KPIs (gauges) and update live
  useEffect(() => {
    let isMounted = true;
    async function fetchKpis() {
      try {
        const data = await fetchJson<any>(
          `${API_BASE_URL}/api/dashboard/kpis`,
          undefined,
          "KPI"
        );
        if (!isMounted || !data) return;
        const direct = data.direct_sentiment_breakdown || {};
        const indirect = data.indirect_sentiment_breakdown || {};
        const totalPos = data.total_customer_sentiment_percent ?? 0;
        const indirectNeutral = Math.max(
          0,
          100 - (indirect.positive_percent ?? 0) - (indirect.negative_percent ?? 0)
        );
        setSentimentStatsData([
          {
            title: "Direct Sentiment",
            positive: Math.round(direct.good_percent ?? 0),
            neutral: Math.round(direct.neutral_percent ?? 0),
            negative: Math.round(direct.bad_percent ?? 0),
            colors: ["#70FF99", "#FDD657", "#CC0000"],
          },
          {
            title: "Indirect Sentiment",
            positive: Math.round(indirect.positive_percent ?? 0),
            neutral: Math.round(indirectNeutral),
            negative: Math.round(indirect.negative_percent ?? 0),
            colors: ["#70FF99", "#FDD657", "#CC0000"],
          },
          {
            title: "Total Customer Sentiment",
            positive: Math.round(totalPos),
            neutral: 0,
            negative: Math.max(0, Math.round(100 - totalPos)),
            colors: ["#70FF99", "#FDD657", "#CC0000"],
          },
        ]);
      } catch (e) {
        console.error("[Dashboard] KPI fetch failed", e);
      }
    }
    fetchKpis();
    const id = setInterval(fetchKpis, 5000);
    return () => { isMounted = false; clearInterval(id); };
  }, []);

  const fetchActionableInsights = useCallback(async () => {
    try {
      const data = await fetchJson<ActionableInsight[]>(
        `${API_BASE_URL}/api/dashboard/actionable-insights`,
        undefined,
        "Actionable Insights"
      );
      setActionableInsights(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load actionable insights", e);
    }
  }, []);

  useEffect(() => {
    fetchActionableInsights();
  }, [fetchActionableInsights]);

  const handleResolveInsight = useCallback(async (insight: ActionableInsight) => {
    try {
      setResolvingInsightId(insight.id);
      await fetchJson(
        `${API_BASE_URL}/api/sentiments/resolve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: insight.type, id: insight.id }),
        },
        'Resolve Insight'
      );
      setActionableInsights(prev =>
        prev.filter(item => !(item.id === insight.id && item.type === insight.type))
      );
    } catch (err) {
      console.error("Failed to resolve insight", err);
      alert("Failed to mark insight as resolved. Please try again.");
    } finally {
      setResolvingInsightId(null);
    }
  }, []);

  // Effect: Fetch sentiment-over-time and map into month buckets
  useEffect(() => {
    let isMounted = true;
    async function fetchTrend() {
      try {
        const data = await fetchJson<{ date: string; good_percent: number }[]>(
          `${API_BASE_URL}/api/dashboard/sentiment-over-time`,
          undefined,
          "Sentiment Over Time"
        );
        if (!isMounted || !Array.isArray(data)) return;
        const bucket: { [k: string]: { date: string, value: number }[] } = {};
        const monthLabels = new Set<string>();
        data.forEach(pt => {
          const monthLabel = getMonthLabelFromISO(pt.date);
          monthLabels.add(monthLabel);
          const dayLabel = getMonthDayLabelFromISO(pt.date);
          if (!bucket[monthLabel]) bucket[monthLabel] = [];
          bucket[monthLabel].push({ date: dayLabel, value: pt.good_percent });
        });
        setTrend(prev => ({ ...prev, ...bucket }));
        setChartMonths(prev => {
          const next = new Set(prev);
          monthLabels.forEach(label => next.add(label));
          const arr = Array.from(next);
          if (!arr.includes(selectedMonth) && arr.length > 0) {
            setSelectedMonth(arr[0]);
          }
          return arr;
        });
      } catch (e) {
        // silent
      }
    }
    fetchTrend();
    // no polling required here unless needed
    return () => { isMounted = false; };
  }, []);

  // Effect: Fetch Google Trends formatted data
  useEffect(() => {
    let isMounted = true;
    async function fetchTrends() {
      try {
        const payload = await fetchJson<Record<string, any[]>>(
          `${API_BASE_URL}/api/dashboard/trends`,
          undefined,
          "Trends"
        );
        if (!isMounted || !payload) return;
        const parsed: TrendSeries[] = Object.entries(payload || {}).map(
          ([topic, values]: [string, any]) => ({
            topic,
            points: Array.isArray(values)
              ? values.map((v: any) => ({
                  date: v.date,
                  value: typeof v.value === 'number' ? v.value : Number(v.value) || 0,
                }))
              : [],
          })
        );
        setTrendsData(parsed);
      } catch (e) {
        console.error("Failed to load trends data", e);
      }
    }
    fetchTrends();
    return () => {
      isMounted = false;
    };
  }, []);

  // Effect: Fetch survey responses
  useEffect(() => {
    let isMounted = true;
    async function fetchSurveys() {
      try {
        const data = await fetchJson<SurveyResponse[]>(
          `${API_BASE_URL}/api/dashboard/surveys`,
          undefined,
          "Surveys"
        );
        if (!isMounted) return;
        setSurveyResponses(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load surveys", e);
      }
    }
    fetchSurveys();
    return () => {
      isMounted = false;
    };
  }, []);

  // Effect: Fetch social posts
  useEffect(() => {
    let isMounted = true;
    async function fetchSocial() {
      try {
        const data = await fetchJson<SocialPost[]>(
          `${API_BASE_URL}/api/dashboard/social`,
          undefined,
          "Social"
        );
        if (!isMounted) return;
        setSocialPosts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load social posts", e);
      }
    }
    fetchSocial();
    return () => {
      isMounted = false;
    };
  }, []);

  // Effect: Fetch customers and populate Oct/Nov months
  useEffect(() => {
    let isMounted = true;
    async function fetchCustomers() {
      try {
        const rows = await fetchJson<{ id: number; name: string; phone: string }[]>(
          `${API_BASE_URL}/api/dashboard/customers`,
          undefined,
          "Customers"
        );
        if (!isMounted || !Array.isArray(rows) || rows.length === 0) return;
        const levels = ["Rely","Amplified","All In"];
        const countries = ["USA","India","Germany","UK","Canada","Spain","Denmark","Australia","Canada","United States"];
        const randDay = (monthIndex: number) => {
          const year = 2025;
          const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
          return Math.max(1, Math.min(daysInMonth, Math.floor(Math.random() * daysInMonth) + 1));
        };
        // Assign half to Oct (index 9) and half to Nov (index 10). Duplicate if only one to fill both.
        const out: CustomerRow[] = [];
        const half = Math.ceil(rows.length / 2);
        const octRows = rows.slice(0, half);
        const novRows = rows.slice(half);
        // Ensure both months have data
        const octMonthAbbr = 'Oct';
        const novMonthAbbr = 'Nov';
        const yearStr = '2025';
        octRows.forEach(r => {
          const d = randDay(9);
          out.push({
            id: r.id,
            name: r.name,
            date: `${octMonthAbbr} ${d}, ${yearStr}`,
            level: levels[Math.floor(Math.random() * levels.length)],
            country: countries[Math.floor(Math.random() * countries.length)],
            phone: r.phone,
            monthLabel: `${octMonthAbbr} ${yearStr}`,
          });
        });
        const novSource = novRows.length > 0 ? novRows : rows.slice(0, Math.max(1, Math.min(3, rows.length)));
        novSource.forEach(r => {
          const d = randDay(10);
          out.push({
            id: r.id,
            name: r.name,
            date: `${novMonthAbbr} ${d}, ${yearStr}`,
            level: levels[Math.floor(Math.random() * levels.length)],
            country: countries[Math.floor(Math.random() * countries.length)],
            phone: r.phone,
            monthLabel: `${novMonthAbbr} ${yearStr}`,
          });
        });
        setAllCustomers(out);
        setSelectedRows({});
        setChartMonths(prev => {
          const monthSet = new Set(prev);
          out.forEach(c => monthSet.add(c.monthLabel));
          const monthsArray = Array.from(monthSet);
          if (!monthsArray.includes(selectedMonth) && monthsArray.length > 0) {
            setSelectedMonth(monthsArray[0]);
          }
          return monthsArray;
        });
      } catch (e) {
        // silent
      }
    }
    fetchCustomers();
    return () => { isMounted = false; };
  }, []);
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
  const customersInMonth = allCustomers.filter(c => c.monthLabel === selectedMonth);
  // Helper for Select All state
  const allChecked =
    customersInMonth.length > 0 &&
    customersInMonth.every(c => selectedRows[c.id]);
  const someChecked =
    !allChecked && customersInMonth.some(c => selectedRows[c.id]);

  // --- Handlers ---
  const handleExport = (): void => alert("Export data");
  const handleEnableNotifications = (): void => alert("Enable notifications");

  const handleSelectRandom = () => {
    // Randomly select 5 in current filtered list
    const shuffled = [...customersInMonth].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, 5);
    const newSel: Record<number, boolean> = {};
    picked.forEach(c => (newSel[c.id] = true));
    setSelectedRows(newSel);
  };

  const handleMakeCall = async () => {
    const toCall = customersInMonth.filter(c => selectedRows[c.id]);
    if (toCall.length === 0) {
      alert("Please select customer(s) to call.");
      return;
    }
    try {
      const results: string[] = [];
      for (const c of toCall) {
        const normalized = normalizePhoneNumber(c.phone);
        try {
          const customer = await fetchJson<{ id?: number }>(
            `${API_BASE_URL}/api/customers`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: c.name, phone: normalized }),
            },
            `Upsert Customer ${normalized}`
          );
          const id = customer?.id;
          if (!id) {
            results.push(`${c.name}: missing id from customer response`);
            continue;
          }
          const call = await fetchJson<{ callSid?: string }>(
            `${API_BASE_URL}/api/calls/${id}`,
            { method: 'POST' },
            `Call Customer ${id}`
          );
          results.push(`${c.name}: call initiated (SID ${call?.callSid || 'N/A'})`);
        } catch (err: any) {
          console.error("Call initiation failed", err);
          results.push(`${c.name}: call failed (${err?.message || 'error'})`);
        }
      }
      alert(results.join('\n'));
    } catch (e) {
      console.error(e);
      alert('Failed to initiate calls. See console for details.');
    }
  };
  const handleEdit = (name: string): void => alert(`Edit ${name}`);
  const handleDelete = (name: string): void => alert(`Delete ${name}`);
  // Row selection
  const toggleRow = (customerId: number) => {
    setSelectedRows(prev => ({ ...prev, [customerId]: !prev[customerId] }));
  };
  const setAllRows = (checked: boolean) => {
    const sel: Record<number, boolean> = {};
    customersInMonth.forEach(c => {
      sel[c.id] = checked;
    });
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
            {actionableInsights.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-4">No actionable insights pending.</p>
            ) : (
              actionableInsights.map((insight) => (
                <div
                  key={`${insight.type}-${insight.id}`}
                  className="bg-pink-50 border border-pink-100 rounded-lg p-3 shadow-sm"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#ED008C] uppercase">
                        {insight.type}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          insight.sentiment === 'good'
                            ? 'bg-green-100 text-green-700'
                            : insight.sentiment === 'neutral'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {insight.sentiment}
                      </span>
                    </div>
                    <p className="text-gray-700 text-xs leading-relaxed">
                      {insight.insight || insight.text}
                    </p>
                    {insight.customer_name && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        {insight.customer_name}
                        {insight.customer_phone ? ` • ${insight.customer_phone}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      {new Date(insight.created_at).toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleResolveInsight(insight)}
                      disabled={resolvingInsightId === insight.id}
                      className="text-[#ED008C] hover:opacity-90 text-xs font-medium flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                      Mark Resolved
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
                    ID
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
                ) : customersInMonth.map((customer) => (
                  <tr
                    key={customer.id}
                    className={`even:bg-pink-600/40 odd:bg-pink-500/70 border-y border-pink-400/25`}
                  >
                    <td className="px-2 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!selectedRows[customer.id]}
                        onChange={() => toggleRow(customer.id)}
                        className="accent-pink-500 w-4 h-4 border rounded"
                        aria-label={`Select ${customer.name}`}
                      />
                    </td>
                    <td className="px-2 py-3 font-bold text-white text-sm">
                      {customer.id}
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
            {openSentiment.title === "Direct Sentiment" && (
              <div className="mt-6 space-y-4 max-h-[360px] overflow-y-auto pr-1">
                <Card className="border border-[#ED008C]/30 rounded-lg shadow-sm">
                  <div className="p-4">
                    <h4 className="text-[#ED008C] font-semibold text-base mb-2">Google Trend Topics</h4>
                    <div className="space-y-3">
                      {trendsData.length === 0 ? (
                        <p className="text-sm text-gray-500">No trend data available.</p>
                      ) : (
                        trendsData.map(series => {
                          const latest = series.points.at(-1);
                          return (
                            <div key={series.topic} className="border border-pink-100 rounded-lg p-3 bg-pink-50">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[#ED008C]">
                                  {series.topic}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {latest ? latest.date : ""}
                                </span>
                              </div>
                              <div className="mt-1">
                                <span className="text-xl font-bold text-[#ED008C]">
                                  {latest ? Math.round(latest.value) : "--"}
                                </span>
                                <span className="text-xs text-gray-500 ml-1">score</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="border border-[#ED008C]/30 rounded-lg shadow-sm">
                  <div className="p-4">
                    <h4 className="text-[#ED008C] font-semibold text-base mb-2">Latest Social Mentions</h4>
                    <div className="space-y-3">
                      {socialPosts.length === 0 ? (
                        <p className="text-sm text-gray-500">No social posts ingested yet.</p>
                      ) : (
                        socialPosts.slice(0, 6).map(post => (
                          <div key={post.id} className="border border-pink-100 rounded-lg p-3 bg-pink-50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold uppercase text-[#ED008C]">
                                {post.platform}
                              </span>
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  post.sentiment === "good"
                                    ? "bg-green-100 text-green-700"
                                    : post.sentiment === "neutral"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {post.sentiment}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed line-clamp-4">
                              {post.text_content}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-[11px] text-gray-400">
                                {new Date(post.created_at).toLocaleString()}
                              </span>
                              {post.post_url && (
                                <a
                                  href={post.post_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] font-medium text-[#ED008C] hover:underline"
                                >
                                  View
                                </a>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="border border-[#ED008C]/30 rounded-lg shadow-sm">
                  <div className="p-4">
                    <h4 className="text-[#ED008C] font-semibold text-base mb-2">Recent Survey Responses</h4>
                    <div className="space-y-3">
                      {surveyResponses.length === 0 ? (
                        <p className="text-sm text-gray-500">No survey responses available.</p>
                      ) : (
                        surveyResponses.slice(0, 6).map(response => (
                          <div key={response.id} className="border border-pink-100 rounded-lg p-3 bg-pink-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-sm font-semibold text-[#ED008C]">
                                  {response.customer_name || "Unknown Customer"}
                                </span>
                                {response.customer_phone && (
                                  <span className="text-xs text-gray-500 block">
                                    {response.customer_phone}
                                  </span>
                                )}
                              </div>
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  response.sentiment === "good"
                                    ? "bg-green-100 text-green-700"
                                    : response.sentiment === "neutral"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {response.sentiment}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-gray-700 leading-relaxed line-clamp-4">
                              {response.transcript || "No transcript provided."}
                            </p>
                            {response.insight && (
                              <p className="mt-2 text-[11px] text-gray-500 italic">
                                Insight: {response.insight}
                              </p>
                            )}
                            <span className="text-[11px] text-gray-400 block mt-2">
                              {new Date(response.created_at).toLocaleString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Refresh Insights Button - Bottom Left */}
      <button
        onClick={fetchActionableInsights}
        className="fixed bottom-6 left-6 bg-[#ED008C] text-white font-semibold text-sm rounded-lg px-4 py-2 shadow-lg hover:opacity-90 transition flex items-center gap-2"
      >
        <span className="text-lg">↻</span> Refresh Insights
      </button>
    </div>
  );
}
