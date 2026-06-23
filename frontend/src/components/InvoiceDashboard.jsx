import { useEffect, useState } from "react";

export default function InvoiceDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_BASE_URL + "/invoices");
      if (!response.ok) {
        console.error("Dashboard HTTP error:", response.status, response.statusText);
        return;
      }
      const result = await response.json();
      console.log("Dashboard Raw Payload:", result);

      let list = [];
      if (Array.isArray(result.items)) list = result.items;
      else if (Array.isArray(result.data)) list = result.data;
      else if (Array.isArray(result)) list = result;
      else if (result && typeof result === "object") {
        const firstVal = Object.values(result).find(Array.isArray);
        if (firstVal) list = firstVal;
      }
      setInvoices(list);
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filtered = invoices.filter((inv) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (inv.vendor_name && inv.vendor_name.toLowerCase().includes(q)) ||
      (inv.invoice_number && inv.invoice_number.toLowerCase().includes(q));
    const s = inv.status || "Committed";
    const matchesStatus = statusFilter === "All" || s === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const fmt = (amount) => {
    const n = Number(amount) || 0;
    return "$" + n.toFixed(2);
  };

  const badge = (status) => {
    const s = status || "Committed";
    const cls =
      s === "Paid"
        ? "bg-green-100 text-green-800 border-green-200"
        : "bg-amber-100 text-amber-800 border-amber-200";
    return (
      <span
        className={
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium " +
          cls
        }
      >
        {s}
      </span>
    );
  };

  return (
    <div className="mx-auto mt-8 w-full max-w-6xl rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          placeholder="Search by client name or invoice number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          <option value="All">All Status</option>
          <option value="Committed">Committed</option>
          <option value="Paid">Paid</option>
        </select>
        <button
          onClick={fetchInvoices}
          className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-yellow-500"
        >
          Refresh Data
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Invoice #
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Client Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Amount
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-gray-400"
                >
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-gray-400"
                >
                  No invoices found
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {inv.invoice_number || "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {inv.vendor_name || "\u2014"}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-900">
                    {fmt(inv.total_amount, inv.currency)}
                  </td>
                  <td className="px-4 py-3">{badge(inv.status)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {inv.uploaded_at
                      ? new Date(inv.uploaded_at).toLocaleString()
                      : "\u2014"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
