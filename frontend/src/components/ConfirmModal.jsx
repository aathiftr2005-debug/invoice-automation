import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function ConfirmModal({ isOpen, title, message, onCancel, onConfirm, isBusy }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="glass-card w-full max-w-md rounded-lg p-6"
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-md bg-red-500/15 p-3 text-red-300">
                <AlertTriangle size={22} />
              </div>
              <h2 className="text-xl font-bold">{title}</h2>
            </div>
            <p className="text-sm leading-6 text-slate-300">{message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]" onClick={onCancel} disabled={isBusy}>
                Cancel
              </button>
              <button className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-60" onClick={onConfirm} disabled={isBusy}>
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
