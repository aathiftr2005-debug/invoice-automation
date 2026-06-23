import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios.js";
import SkeletonLoader from "../components/SkeletonLoader.jsx";

function CountUp({ value }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => latest.toFixed(2));
  useEffect(() => {
    const controls = animate(count, Number(value || 0), { duration: 0.9, ease: "easeOut" });
    return controls.stop;
  }, [count, value]);
  return <motion.span>{rounded}</motion.span>;
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInvoice = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/invoices", { params: { per_page: 100 } });
        setInvoice(response.data.items.find((item) => String(item.id) === id) || null);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadInvoice();
  }, [id]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl">
        <SkeletonLoader rows={4} />
      </div>
    );
  }

  if (!invoice) {
    return <p className="text-deepBlack/70">Invoice not found.</p>;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <button className="mb-6 inline-flex items-center gap-2 rounded-md border border-deepBlack/15 px-4 py-2 text-sm font-semibold text-deepBlack hover:bg-mango/20" onClick={() => navigate("/invoices")}>
        <ArrowLeft size={18} />
        Back
      </button>

      <motion.div className="glass-card rounded-lg p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-mangoDeep">{invoice.invoice_number || "Invoice"}</p>
            <h2 className="mt-2 text-3xl font-bold md:text-5xl">{invoice.vendor_name || "Unknown vendor"}</h2>
            <p className="mt-3 text-deepBlack/60">{invoice.invoice_date || "No invoice date"} · {invoice.file_name}</p>
          </div>
          <div className="rounded-lg border border-mango/60 bg-mango/20 p-5 text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-deepBlack/60">Total</p>
            <p className="mt-2 text-4xl font-extrabold">{invoice.currency} <CountUp value={invoice.total_amount} /></p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.16em] text-deepBlack/55">
              <tr>
                <th className="py-3">Description</th>
                <th className="py-3">Quantity</th>
                <th className="py-3">Unit Price</th>
                <th className="py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.line_items || []).map((item, index) => (
                <motion.tr key={`${item.description}-${index}`} className="border-t border-deepBlack/10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }}>
                  <td className="py-4 pr-4 font-semibold">{item.description}</td>
                  <td className="py-4 text-deepBlack/70">{item.quantity}</td>
                  <td className="py-4 text-deepBlack/70">{Number(item.unit_price).toFixed(2)}</td>
                  <td className="py-4 text-right font-bold">{Number(item.amount).toFixed(2)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {!invoice.line_items?.length && <p className="py-10 text-center text-deepBlack/55">No line items were extracted.</p>}
        </div>
      </motion.div>
    </div>
  );
}
