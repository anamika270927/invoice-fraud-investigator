import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  ChevronRight,
  CircleDollarSign,
  FileSearch,
  FileText,
  LayoutDashboard,
  Menu,
  Search,
  ShieldAlert,
  Users,
  X,
  Upload,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";



const API = "http://127.0.0.1:8000";

function App() {
  const [page, setPage] = useState("dashboard");
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      const [invoiceResponse, summaryResponse] = await Promise.all([
        fetch(`${API}/api/invoices`),
        fetch(`${API}/api/summary`),
      ]);

      const invoiceData = await invoiceResponse.json();
      const summaryData = await summaryResponse.json();

      setInvoices(invoiceData.invoices || []);
      setSummary(summaryData);
    } catch (error) {
      console.error("Backend connection failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        alert("Could not analyze the file.");
        return;
      }

      alert(
        `Analysis complete: ${data.count} invoices processed from ${data.filename}`
      );

      await loadData();
    } catch (error) {
      console.error("Upload error:", error);
      alert("Unable to connect to the fraud detection engine.");
    }

    event.target.value = "";
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoice_id
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        invoice.vendor.toLowerCase().includes(search.toLowerCase()) ||
        invoice.employee.toLowerCase().includes(search.toLowerCase());

      const matchesRisk =
        riskFilter === "ALL" || invoice.risk_level === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [invoices, search, riskFilter]);

  const vendorData = useMemo(() => {
    const map = {};

    invoices.forEach((invoice) => {
      map[invoice.vendor] =
        (map[invoice.vendor] || 0) + Number(invoice.amount);
    });

    return Object.entries(map).map(([vendor, amount]) => ({
      vendor:
        vendor.length > 15 ? vendor.slice(0, 15) + "..." : vendor,
      amount,
    }));
  }, [invoices]);

  const riskData = useMemo(() => {
    if (!summary) return [];

    return [
      { name: "High", value: summary.high_risk },
      { name: "Medium", value: summary.medium_risk },
      { name: "Low", value: summary.low_risk },
    ];
  }, [summary]);

  const openInvestigation = (invoice) => {
    setSelectedInvoice(invoice);
    setPage("investigate");
    setSidebarOpen(false);
  };

  const formatMoney = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-200">

      {/* Mobile Header */}
      <div className="fixed top-0 z-40 flex h-16 w-full items-center border-b border-white/10 bg-[#0b0f18] px-4 lg:hidden">

        <button
          onClick={() => setSidebarOpen(true)}
          className="mr-4 rounded-lg p-2 hover:bg-white/5"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-red-500/10 p-2 text-red-400">
            <ShieldAlert size={19} />
          </div>

          <span className="font-semibold">
            FraudLens
          </span>
        </div>
      </div>


      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 border-r border-white/10 bg-[#0b0f18] transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >

        <div className="flex h-full flex-col">

          {/* Logo */}
          <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-red-500/10 p-2.5 text-red-400">
                <ShieldAlert size={22} />
              </div>

              <div>
                <div className="font-bold tracking-wide">
                  FraudLens
                </div>

                <div className="text-[10px] uppercase tracking-widest text-slate-500">
                  Invoice Intelligence
                </div>
              </div>

            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X size={20} />
            </button>

          </div>


          {/* Navigation */}
          <div className="px-4 py-6">

            <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Monitoring
            </div>

            <NavItem
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              active={page === "dashboard"}
              onClick={() => {
                setPage("dashboard");
                setSidebarOpen(false);
              }}
            />

            <NavItem
              icon={<FileSearch size={18} />}
              label="Investigations"
              active={page === "investigate"}
              onClick={() => {
                setPage("investigate");
                setSidebarOpen(false);
              }}
            />

            <NavItem
              icon={<FileText size={18} />}
              label="Invoice Monitor"
              active={page === "invoices"}
              onClick={() => {
                setPage("invoices");
                setSidebarOpen(false);
              }}
            />

            <NavItem
              icon={<BarChart3 size={18} />}
              label="Analytics"
              active={page === "analytics"}
              onClick={() => {
                setPage("analytics");
                setSidebarOpen(false);
              }}
            />

          </div>


          {/* Bottom Card */}
          <div className="mt-auto border-t border-white/10 p-4">

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">

              <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                <Users size={14} />
                Investigation Mode
              </div>

              <div className="text-sm font-medium text-white">
                Human-in-the-loop
              </div>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Risk scores prioritize invoices for human review.
                They do not automatically prove fraud.
              </p>

            </div>

          </div>

        </div>
      </aside>


      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}


      {/* Main */}
      <main className="min-h-screen lg:ml-64">

        {/* Desktop Header */}
        <header className="hidden h-20 items-center justify-between border-b border-white/10 bg-[#080b12] px-8 lg:flex">

          <div>

            <h1 className="text-xl font-semibold text-white">

              {page === "dashboard" &&
                "Fraud Monitoring Dashboard"}

              {page === "investigate" &&
                "Invoice Investigation"}

              {page === "invoices" &&
                "Invoice Monitor"}

              {page === "analytics" &&
                "Risk Analytics"}

            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Explainable invoice risk intelligence
            </p>

          </div>


          <div className="flex items-center gap-5">

            <div className="relative">

              <Bell size={19} className="text-slate-400" />

              {summary?.high_risk > 0 && (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
              )}

            </div>

            <div className="h-7 w-px bg-white/10" />

            <div className="text-right">

              <div className="text-sm font-medium text-white">
                Risk Desk
              </div>

              <div className="text-[11px] text-slate-500">
                Analyst View
              </div>

            </div>

          </div>

        </header>


        {/* Content */}
        <div className="px-4 pb-10 pt-24 sm:px-6 lg:px-8 lg:pt-8">

          {loading ? (
            <Loading />
          ) : (
            <>

              {page === "dashboard" && (
                <Dashboard
                  summary={summary}
                  invoices={invoices}
                  riskData={riskData}
                  vendorData={vendorData}
                  formatMoney={formatMoney}
                  openInvestigation={openInvestigation}
                  setPage={setPage}
                  handleFileUpload={handleFileUpload}
                />
              )}

              {page === "invoices" && (
                <InvoiceMonitor
                  invoices={filteredInvoices}
                  search={search}
                  setSearch={setSearch}
                  riskFilter={riskFilter}
                  setRiskFilter={setRiskFilter}
                  openInvestigation={openInvestigation}
                />
              )}

              {page === "investigate" && (
                <Investigation
                  invoice={selectedInvoice}
                  formatMoney={formatMoney}
                  setPage={setPage}
                />
              )}

              {page === "analytics" && (
                <Analytics
                  invoices={invoices}
                  summary={summary}
                  vendorData={vendorData}
                  riskData={riskData}
                  formatMoney={formatMoney}
                />
              )}

            </>
          )}

        </div>

      </main>

    </div>
  );
}

/* ---------------- NAV ITEM ---------------- */

function NavItem({
  icon,
  label,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
        active
          ? "bg-red-500/10 text-red-400"
          : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}


/* ---------------- DASHBOARD ---------------- */

/* ---------------- DASHBOARD ---------------- */

function Dashboard({
  summary,
  invoices,
  riskData,
  vendorData,
  formatMoney,
  openInvestigation,
  setPage,
  handleFileUpload,
}) {
  const highRisk = invoices
    .filter((invoice) => invoice.risk_level === "HIGH")
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 5);

  return (
    <div className="space-y-7">

      {/* Heading */}
      <section>

        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

          <div>

            <div className="mb-2 flex items-center gap-2 text-xs text-red-400">

              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />

              LIVE MONITORING

            </div>

            <h2 className="text-2xl font-semibold text-white">
              Invoice Risk Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Detect unusual invoice patterns before payment approval.
            </p>

          </div>


          <div className="flex items-center gap-3">

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-200 transition hover:bg-slate-800">

              <Upload size={17} />

              Upload CSV

              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />

            </label>

            <button
              onClick={() => setPage("invoices")}
              className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.06]"
            >
              View all invoices
              <ChevronRight size={16} />
            </button>

          </div>

        </div>


        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            icon={<FileText size={19} />}
            label="Invoices Analyzed"
            value={summary?.total_invoices || 0}
            sub="Across current dataset"
          />

          <StatCard
            icon={<ShieldAlert size={19} />}
            label="High Risk"
            value={summary?.high_risk || 0}
            sub="Requires investigation"
            danger
          />

          <StatCard
            icon={<CircleDollarSign size={19} />}
            label="Total Invoice Value"
            value={formatMoney(summary?.total_amount)}
            sub="Current invoice population"
          />

          <StatCard
            icon={<AlertTriangle size={19} />}
            label="High-Risk Value"
            value={formatMoney(summary?.high_risk_amount)}
            sub="Flagged for review"
            danger
          />

        </div>

      </section>


      {/* Charts */}
      <section className="grid gap-5 xl:grid-cols-3">

        {/* Vendor Chart */}
        <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-5 xl:col-span-2">

          <div className="mb-5">

            <h3 className="font-semibold text-white">
              Invoice Value by Vendor
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Aggregate transaction value across detected vendors
            </p>

          </div>


          <div className="h-72">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart data={vendorData}>

                <CartesianGrid
                  stroke="#1f2937"
                  vertical={false}
                />

                <XAxis
                  dataKey="vendor"
                  tick={{
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fill: "#64748b",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #263244",
                    borderRadius: "10px",
                    color: "#fff",
                  }}
                  formatter={(value) =>
                    formatMoney(value)
                  }
                />

                <Bar
                  dataKey="amount"
                  radius={[5, 5, 0, 0]}
                  fill="#ef4444"
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>


        {/* Risk Chart */}
        <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-5">

          <div className="mb-2">

            <h3 className="font-semibold text-white">
              Risk Distribution
            </h3>

            <p className="text-xs text-slate-500">
              Current risk classification
            </p>

          </div>


          <div className="h-56">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie
                  data={riskData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={4}
                >

                  <Cell fill="#ef4444" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#334155" />

                </Pie>

                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #263244",
                    borderRadius: "10px",
                  }}
                />

              </PieChart>

            </ResponsiveContainer>

          </div>


          <div className="space-y-2">

            <RiskLegend
              label="High Risk"
              value={summary?.high_risk}
              dot="bg-red-500"
            />

            <RiskLegend
              label="Medium Risk"
              value={summary?.medium_risk}
              dot="bg-amber-500"
            />

            <RiskLegend
              label="Low Risk"
              value={summary?.low_risk}
              dot="bg-slate-600"
            />

          </div>

        </div>

      </section>


      {/* Priority Investigations */}
      <section className="rounded-2xl border border-white/10 bg-[#0d111a]">

        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

          <div>

            <h3 className="font-semibold text-white">
              Priority Investigations
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Highest-risk invoices requiring analyst attention
            </p>

          </div>

          <button
            onClick={() => setPage("invoices")}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Open monitor →
          </button>

        </div>


        <div className="divide-y divide-white/5">

          {highRisk.length === 0 ? (

            <div className="p-6 text-sm text-slate-500">
              No high-risk invoices detected.
            </div>

          ) : (

            highRisk.map((invoice) => (

              <button
                key={invoice.invoice_id}
                onClick={() =>
                  openInvestigation(invoice)
                }
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-white/[0.025]"
              >

                <div className="flex items-center gap-4">

                  <div className="rounded-lg bg-red-500/10 p-2.5 text-red-400">
                    <AlertTriangle size={18} />
                  </div>

                  <div>

                    <div className="text-sm font-medium text-white">
                      {invoice.invoice_id}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {invoice.vendor} · {invoice.employee}
                    </div>

                  </div>

                </div>


                <div className="flex items-center gap-6">

                  <div className="hidden text-right sm:block">

                    <div className="text-sm text-white">
                      {formatMoney(invoice.amount)}
                    </div>

                    <div className="text-xs text-slate-500">
                      Invoice value
                    </div>

                  </div>

                  <RiskBadge
                    level={invoice.risk_level}
                    score={invoice.risk_score}
                  />

                  <ChevronRight
                    size={16}
                    className="text-slate-600"
                  />

                </div>

              </button>

            ))

          )}

        </div>

      </section>

    </div>
  );
}

/* ---------------- STAT CARD ---------------- */

function StatCard({
  icon,
  label,
  value,
  sub,
  danger,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-5">

      <div className="mb-5 flex items-start justify-between">

        <div
          className={`rounded-lg p-2.5 ${
            danger
              ? "bg-red-500/10 text-red-400"
              : "bg-slate-500/10 text-slate-400"
          }`}
        >
          {icon}
        </div>

      </div>

      <div className="text-2xl font-semibold text-white">
        {value}
      </div>

      <div className="mt-1 text-sm text-slate-400">
        {label}
      </div>

      <div className="mt-2 text-[11px] text-slate-600">
        {sub}
      </div>

    </div>
  );
}


/* ---------------- RISK LEGEND ---------------- */

function RiskLegend({
  label,
  value,
  dot,
}) {
  return (
    <div className="flex items-center justify-between text-sm">

      <div className="flex items-center gap-2 text-slate-400">

        <span
          className={`h-2 w-2 rounded-full ${dot}`}
        />

        {label}

      </div>

      <span className="font-medium text-white">
        {value}
      </span>

    </div>
  );
}


/* ---------------- RISK BADGE ---------------- */

function RiskBadge({
  level,
  score,
}) {

  const styles = {
    HIGH: "border-red-500/20 bg-red-500/10 text-red-400",
    MEDIUM:
      "border-amber-500/20 bg-amber-500/10 text-amber-400",
    LOW:
      "border-slate-500/20 bg-slate-500/10 text-slate-400",
  };

  return (
    <div
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
        styles[level]
      }`}
    >
      {level} · {score}
    </div>
  );
}


/* ---------------- INVOICE MONITOR ---------------- */

function InvoiceMonitor({
  invoices,
  search,
  setSearch,
  riskFilter,
  setRiskFilter,
  openInvestigation,
}) {

  return (
    <div className="space-y-5">

      <div>

        <h2 className="text-2xl font-semibold text-white">
          Invoice Monitor
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Search, filter and investigate analyzed invoices.
        </p>

      </div>


      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0d111a] p-4 md:flex-row">

        <div className="relative flex-1">

          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search invoice, vendor or employee..."
            className="w-full rounded-lg border border-white/10 bg-[#080b12] py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-red-500/40"
          />

        </div>


        <select
          value={riskFilter}
          onChange={(e) =>
            setRiskFilter(e.target.value)
          }
          className="rounded-lg border border-white/10 bg-[#080b12] px-4 py-2.5 text-sm text-slate-300 outline-none"
        >
          <option value="ALL">
            All Risk Levels
          </option>

          <option value="HIGH">
            High Risk
          </option>

          <option value="MEDIUM">
            Medium Risk
          </option>

          <option value="LOW">
            Low Risk
          </option>

        </select>

      </div>


      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d111a]">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[800px] text-left">

            <thead className="border-b border-white/10 bg-white/[0.02]">

              <tr className="text-[11px] uppercase tracking-wider text-slate-500">

                <th className="px-5 py-4">
                  Invoice
                </th>

                <th className="px-5 py-4">
                  Vendor
                </th>

                <th className="px-5 py-4">
                  Employee
                </th>

                <th className="px-5 py-4">
                  Amount
                </th>

                <th className="px-5 py-4">
                  Risk
                </th>

                <th className="px-5 py-4"></th>

              </tr>

            </thead>


            <tbody className="divide-y divide-white/5">

              {invoices.map((invoice) => (

                <tr
                  key={invoice.invoice_id}
                  className="text-sm hover:bg-white/[0.02]"
                >

                  <td className="px-5 py-4 font-medium text-white">
                    {invoice.invoice_id}
                  </td>

                  <td className="px-5 py-4 text-slate-400">
                    {invoice.vendor}
                  </td>

                  <td className="px-5 py-4 text-slate-500">
                    {invoice.employee}
                  </td>

                  <td className="px-5 py-4 text-slate-300">
                    ₹
                    {Number(
                      invoice.amount
                    ).toLocaleString("en-IN")}
                  </td>

                  <td className="px-5 py-4">

                    <RiskBadge
                      level={invoice.risk_level}
                      score={invoice.risk_score}
                    />

                  </td>

                  <td className="px-5 py-4 text-right">

                    <button
                      onClick={() =>
                        openInvestigation(invoice)
                      }
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Investigate
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>


        {invoices.length === 0 && (
          <div className="p-10 text-center text-sm text-slate-500">
            No invoices match the selected filters.
          </div>
        )}

      </div>

    </div>
  );
}


/* ---------------- INVESTIGATION ---------------- */

function Investigation({
  invoice,
  formatMoney,
  setPage,
}) {

  if (!invoice) {

    return (
      <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-8 text-center">

        <FileSearch
          className="mx-auto mb-4 text-slate-500"
          size={32}
        />

        <h2 className="font-semibold text-white">
          No invoice selected
        </h2>

        <button
          onClick={() => setPage("invoices")}
          className="mt-4 text-sm text-red-400"
        >
          Go to invoice monitor
        </button>

      </div>
    );
  }


  return (
    <div className="space-y-5">

      <button
        onClick={() => setPage("invoices")}
        className="text-sm text-slate-500 hover:text-white"
      >
        ← Back to invoices
      </button>


      <div className="grid gap-5 xl:grid-cols-3">

        {/* Invoice Info */}
        <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-6 xl:col-span-2">

          <div className="flex flex-col justify-between gap-5 sm:flex-row">

            <div>

              <div className="mb-2 text-xs uppercase tracking-widest text-slate-500">
                Investigation
              </div>

              <h2 className="text-2xl font-semibold text-white">
                {invoice.invoice_id}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {invoice.vendor} · {invoice.employee}
              </p>

            </div>


            <RiskBadge
              level={invoice.risk_level}
              score={invoice.risk_score}
            />

          </div>


          <div className="mt-8 grid gap-4 sm:grid-cols-3">

            <Info
              label="Invoice Amount"
              value={formatMoney(invoice.amount)}
            />

            <Info
              label="Employee"
              value={invoice.employee}
            />

            <Info
              label="Vendor"
              value={invoice.vendor}
            />

          </div>

        </div>


        {/* Score */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-6">

          <div className="text-xs uppercase tracking-widest text-red-400">
            Risk Score
          </div>

          <div className="mt-3 flex items-end gap-2">

            <span className="text-5xl font-bold text-white">
              {invoice.risk_score}
            </span>

            <span className="pb-2 text-sm text-slate-500">
              / 100
            </span>

          </div>


          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">

            <div
              className="h-full rounded-full bg-red-500"
              style={{
                width: `${invoice.risk_score}%`,
              }}
            />

          </div>


          <p className="mt-4 text-xs leading-5 text-slate-500">
            This score indicates the concentration of detected
            risk indicators. It is not proof of fraudulent activity.
          </p>

        </div>

      </div>


      {/* Reasons */}
      <div className="rounded-2xl border border-white/10 bg-[#0d111a]">

        <div className="border-b border-white/10 px-6 py-5">

          <h3 className="font-semibold text-white">
            Why was this invoice flagged?
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Explainable signals generated by the detection engine.
          </p>

        </div>


        <div className="space-y-3 p-6">

          {invoice.reasons?.map(
            (reason, index) => (

              <div
                key={index}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4"
              >

                <div className="mt-0.5 rounded-md bg-red-500/10 p-1.5 text-red-400">

                  <AlertTriangle size={15} />

                </div>


                <div>

                  <div className="text-sm text-slate-200">
                    {reason}
                  </div>

                  <div className="mt-1 text-xs text-slate-600">
                    Detection signal #{index + 1}
                  </div>

                </div>

              </div>

            )
          )}

        </div>

      </div>

    </div>
  );
}


/* ---------------- INFO BOX ---------------- */

function Info({
  label,
  value,
}) {

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">

      <div className="text-[11px] uppercase tracking-wider text-slate-600">
        {label}
      </div>

      <div className="mt-2 text-sm font-medium text-white">
        {value}
      </div>

    </div>
  );
}


/* ---------------- ANALYTICS ---------------- */

function Analytics({
  invoices,
  summary,
  vendorData,
  riskData,
  formatMoney,
}) {

  const averageRisk =
    invoices.length > 0
      ? Math.round(
          invoices.reduce(
            (sum, invoice) =>
              sum + invoice.risk_score,
            0
          ) / invoices.length
        )
      : 0;


  return (
    <div className="space-y-5">

      <div>

        <h2 className="text-2xl font-semibold text-white">
          Risk Analytics
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Summary of detected invoice risk patterns.
        </p>

      </div>


      <div className="grid gap-4 sm:grid-cols-3">

        <StatCard
          icon={<ShieldAlert size={19} />}
          label="Average Risk Score"
          value={averageRisk}
          sub="Across analyzed invoices"
        />

        <StatCard
          icon={<AlertTriangle size={19} />}
          label="Medium + High"
          value={
            (summary?.medium_risk || 0) +
            (summary?.high_risk || 0)
          }
          sub="Invoices requiring review"
        />

        <StatCard
          icon={<CircleDollarSign size={19} />}
          label="Flagged Value"
          value={formatMoney(
            summary?.high_risk_amount
          )}
          sub="High-risk invoice value"
          danger
        />

      </div>


      <div className="grid gap-5 lg:grid-cols-2">

        {/* Risk distribution */}
        <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-5">

          <h3 className="font-semibold text-white">
            Risk Distribution
          </h3>

          <div className="mt-4 h-72">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie
                  data={riskData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                >

                  <Cell fill="#ef4444" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#334155" />

                </Pie>

                <Tooltip />

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>


        {/* Vendor exposure */}
        <div className="rounded-2xl border border-white/10 bg-[#0d111a] p-5">

          <h3 className="font-semibold text-white">
            Vendor Exposure
          </h3>

          <div className="mt-4 h-72">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart data={vendorData}>

                <CartesianGrid
                  stroke="#1f2937"
                  vertical={false}
                />

                <XAxis
                  dataKey="vendor"
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fill: "#64748b",
                    fontSize: 10,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value) =>
                    formatMoney(value)
                  }
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #263244",
                  }}
                />

                <Bar
                  dataKey="amount"
                  fill="#94a3b8"
                  radius={[5, 5, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>

    </div>
  );
}


/* ---------------- LOADING ---------------- */

function Loading() {

  return (
    <div className="flex min-h-[60vh] items-center justify-center">

      <div className="text-center">

        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-red-400" />

        <p className="mt-4 text-sm text-slate-500">
          Connecting to fraud detection engine...
        </p>

      </div>

    </div>
  );
}


export default App;
