import { motion } from "framer-motion";
import { Download, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import ConfirmModal from "../components/ConfirmModal.jsx";
import SkeletonLoader from "../components/SkeletonLoader.jsx";

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/invoices", { params: { search, start_date: startDate, end_date: endDate, per_page: 50 } });
      setInvoices(response.data.items);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(loadInvoices, 250);
    return () => window.clearTimeout(timeout);
  }, [search, startDate, endDate]);

  const deleteInvoice = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/invoices/${deleteTarget.id}`);
      toast.success("Invoice deleted.");
      setDeleteTarget(null);
      await loadInvoices();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const exportCsv = async () => {
    try {
      const response = await api.get("/export/csv", { responseType: "blob" });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "invoices.csv";
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("CSV export started.");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-300">Invoices</p>
          <h2 className="mt-2 text-3xl font-bold md:text-5xl">Invoice ledger</h2>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-md bg-indigoElectric px-4 py-3 text-sm font-bold text-white shadow-glow hover:bg-indigo-500" onClick={exportCsv}>
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="glass-card mb-5 grid gap-3 rounded-lg p-4 md:grid-cols-[1fr_auto_auto]">
        <label className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
          <Search size={18} className="text-slate-400" />
          <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500" placeholder="Search vendor" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <input className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        <input className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
      </div>

      <div className="glass-card overflow-hidden rounded-lg p-2">
        {isLoading ? (
          <div className="p-4">
            <SkeletonLoader type="table" rows={6} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-4 py-4">Vendor</th>
                  <th className="px-4 py-4">Invoice No</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">Currency</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, index) => (
                  <motion.tr
                    key={invoice.id}
                    className="cursor-pointer border-t border-white/[0.08] transition hover:bg-white/[0.04]"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                  >
                    <td className="px-4 py-4 font-semibold">{invoice.vendor_name || "Unknown"}</td>
                    <td className="px-4 py-4 text-slate-300">{invoice.invoice_number || "Unknown"}</td>
                    <td className="px-4 py-4 text-slate-300">{invoice.invoice_date || "Unknown"}</td>
                    <td className="px-4 py-4 font-bold">{Number(invoice.total_amount).toFixed(2)}</td>
                    <td className="px-4 py-4 text-slate-300">{invoice.currency}</td>
                    <td className="px-4 py-4 text-right">
                      <button
                        aria-label="Delete invoice"
                        className="rounded-md p-2 text-red-300 transition hover:bg-red-500/15"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteTarget(invoice);
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {!invoices.length && <p className="p-8 text-center text-slate-400">No invoices found.</p>}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete invoice"
        message={`Delete invoice ${deleteTarget?.invoice_number || ""}? This action cannot be undone.`}
        isBusy={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteInvoice}
      />
    </div>
  );
}
