import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FileText, RefreshCw, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios.js";

const processingSteps = ["Extracting text...", "Analyzing with AI...", "Saving to database..."];

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isProcessing) return undefined;
    const interval = window.setInterval(() => {
      setActiveStep((step) => Math.min(step + 1, processingSteps.length - 1));
    }, 1500);
    return () => window.clearInterval(interval);
  }, [isProcessing]);

  const canUpload = useMemo(() => selectedFile && !isProcessing, [selectedFile, isProcessing]);

  const handleFile = (file) => {
    setError("");
    setInvoice(null);
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF invoice.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("PDF must be 10MB or smaller.");
      return;
    }
    setSelectedFile(file);
  };

  const uploadInvoice = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    setIsProcessing(true);
    setActiveStep(0);
    setError("");
    try {
      const response = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setInvoice(response.data.invoice);
      toast.success("Invoice processed successfully.");
    } catch (uploadError) {
      setError(uploadError.message);
      toast.error(uploadError.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-300">Upload</p>
        <h2 className="mt-2 text-3xl font-bold md:text-5xl">Process a PDF invoice</h2>
      </div>

      <div
        className={`glass-card grid min-h-[46vh] place-items-center rounded-lg border-2 border-dashed p-6 text-center transition ${
          isDragging ? "dropzone-active" : "border-indigo-400/45"
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files?.[0]);
        }}
      >
        <div className="max-w-xl">
          <div className="mx-auto mb-5 grid size-16 place-items-center rounded-lg bg-indigoElectric/20 text-indigo-200">
            <UploadCloud size={34} />
          </div>
          <h3 className="text-2xl font-bold">Drop your invoice here</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">PDF only, up to 10MB. The file is validated before processing.</p>
          <label className="mt-6 inline-flex cursor-pointer rounded-md bg-indigoElectric px-5 py-3 text-sm font-bold text-white shadow-glow transition hover:bg-indigo-500">
            Choose PDF
            <input className="sr-only" type="file" accept="application/pdf" onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>
        </div>
      </div>

      {selectedFile && (
        <motion.div className="glass-card flex flex-col gap-4 rounded-lg p-5 md:flex-row md:items-center md:justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <FileText className="text-indigo-300" />
            <div>
              <p className="font-semibold">{selectedFile.name}</p>
              <p className="text-sm text-slate-400">{formatBytes(selectedFile.size)}</p>
            </div>
          </div>
          <button className="rounded-md bg-indigoElectric px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50" disabled={!canUpload} onClick={uploadInvoice}>
            {isProcessing ? "Processing" : "Upload and process"}
          </button>
        </motion.div>
      )}

      {isProcessing && (
        <div className="glass-card rounded-lg p-5">
          <div className="space-y-4">
            {processingSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <div className={`size-3 rounded-full ${index <= activeStep ? "bg-indigoElectric" : "bg-slate-700"}`} />
                <p className={index <= activeStep ? "text-white" : "text-slate-500"}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {invoice && (
          <motion.div className="glass-card rounded-lg p-6" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 28 }}>
            <div className="mb-5 flex items-center gap-3">
              <CheckCircle2 className="text-emerald-300" />
              <h3 className="text-xl font-bold">Extracted invoice preview</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <Preview label="Vendor" value={invoice.vendor_name || "Unknown"} />
              <Preview label="Invoice No" value={invoice.invoice_number || "Unknown"} />
              <Preview label="Date" value={invoice.invoice_date || "Unknown"} />
              <Preview label="Amount" value={`${invoice.currency} ${Number(invoice.total_amount).toFixed(2)}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="glass-card rounded-lg border-red-400/30 p-5">
          <p className="font-semibold text-red-200">{error}</p>
          <button className="mt-4 inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/[0.08]" onClick={uploadInvoice}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

function Preview({ label, value }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 break-words text-lg font-bold">{value}</p>
    </div>
  );
}
