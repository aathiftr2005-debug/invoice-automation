import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/axios.js";
import SkeletonLoader from "../components/SkeletonLoader.jsx";

const pieColors = ["#6366F1", "#22D3EE", "#34D399", "#F59E0B", "#F472B6"];

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/analytics");
        setAnalytics(response.data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl">
        <SkeletonLoader rows={4} />
      </div>
    );
  }

  const summary = analytics?.summary || {};

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-300">Analytics</p>
        <h2 className="mt-2 text-3xl font-bold md:text-5xl">Spend intelligence</h2>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard index={0} label="Total invoices" value={summary.total_invoices || 0} />
        <SummaryCard index={1} label="Total amount" value={(summary.total_amount || 0).toFixed(2)} />
        <SummaryCard index={2} label="Average invoice" value={(summary.average_invoice_value || 0).toFixed(2)} />
        <SummaryCard index={3} label="Recent vendor" value={summary.most_recent_vendor || "None"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <motion.section className="glass-card rounded-lg p-5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <h3 className="mb-5 text-xl font-bold">Monthly spending</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.monthly_totals || []}>
                <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="month" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(248,250,252,0.14)", color: "#F8FAFC" }} />
                <Bar dataKey="total" fill="#6366F1" radius={[6, 6, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section className="glass-card rounded-lg p-5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <h3 className="mb-5 text-xl font-bold">Top vendors</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics?.top_vendors || []} dataKey="total" nameKey="vendor" outerRadius={112} label animationDuration={900}>
                  {(analytics?.top_vendors || []).map((entry, index) => (
                    <Cell key={entry.vendor} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid rgba(248,250,252,0.14)", color: "#F8FAFC" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, index }) {
  return (
    <motion.div className="glass-card rounded-lg p-5 transition hover:-translate-y-1 hover:border-indigo-300/35" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 break-words text-3xl font-extrabold">{value}</p>
    </motion.div>
  );
}
