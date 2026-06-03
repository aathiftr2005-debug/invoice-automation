import { BarChart3, FileText, Menu, UploadCloud, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/upload", label: "Upload", icon: UploadCloud },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/analytics", label: "Analytics", icon: BarChart3 }
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Open navigation"
        className="fixed right-4 top-4 z-40 rounded-md border border-white/10 bg-slate-950/70 p-2 text-softWhite backdrop-blur md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu size={22} />
      </button>
      {isOpen && <button aria-label="Close navigation backdrop" className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setIsOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-slate-950/88 p-5 backdrop-blur-xl transition-transform duration-300 md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300">Invoice AI</p>
            <h1 className="mt-2 text-2xl font-bold">Automation</h1>
          </div>
          <button aria-label="Close navigation" className="rounded-md p-2 text-slate-300 md:hidden" onClick={() => setIsOpen(false)}>
            <X size={22} />
          </button>
        </div>
        <nav className="space-y-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition hover:bg-white/[0.08] hover:text-white ${
                  isActive ? "bg-indigoElectric text-white shadow-glow" : "text-slate-300"
                }`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
