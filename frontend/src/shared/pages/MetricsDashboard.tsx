import { useEffect, useMemo, useState } from "react";
import { CalendarIcon, CheckCircle2, ScanSearch, Scale, Users } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import { fetchDashboard, type DashboardResponse } from "@/modules/dashboard/services/dashboardService";
import { useUser } from "../context/UserContext";
import { AppPage, AppSurface } from "../components/AppPage";

type DatePreset = "last7" | "last30" | "historical" | "custom";
type DashboardTab = "flow" | "results";

const kpiMetrics = [
  {
    title: "Reciclajes totales",
    value: "1,284",
    subtitle: "Acciones de reciclaje confirmadas",
    delta: "43 confirmados esta semana",
    icon: CheckCircle2,
  },
  {
    title: "Kg reciclados",
    value: "38.5 kg",
    subtitle: "Peso total reciclado en el periodo",
    delta: "PET lidera con 8.1 kg",
    icon: Scale,
  },
  {
    title: "Usuarios activos",
    value: "142",
    subtitle: "Usuarios con actividad en el periodo",
    delta: "12 usuarios nuevos",
    icon: Users,
  },
  {
    title: "Tasa de confirmación",
    value: "87%",
    subtitle: "Sesiones que terminaron en confirmación",
    delta: "43 de 52 llegaron a confirmar",
    icon: ScanSearch,
  },
];

const topResidues = [
  { key: "pet", name: "Plásticos PET", scans: 312, confirmed: 271, rate: 87, kilograms: 8.1 },
  { key: "carton", name: "Cartón", scans: 198, confirmed: 165, rate: 83, kilograms: 24.8 },
  { key: "papel", name: "Papel mixto", scans: 174, confirmed: 146, rate: 84, kilograms: 3.9 },
  { key: "tetrapak", name: "Tetra Pak", scans: 129, confirmed: 101, rate: 78, kilograms: 1.8 },
  { key: "vidrio", name: "Vidrio", scans: 118, confirmed: 97, rate: 82, kilograms: 5.1 },
  { key: "latas", name: "Latas", scans: 93, confirmed: 76, rate: 81, kilograms: 2.4 },
];

const recognitionQuality = [
  { name: "Alta confianza", value: 71, color: "#22c76f" },
  { name: "Baja confianza", value: 16, color: "#f4b740" },
  { name: "Corregidos por usuario", value: 13, color: "#0b2f4e" },
];

const funnelSteps = [
  { label: "Iniciaron", value: 100, color: "#0b2f4e" },
  { label: "Processing", value: 91, color: "#1c8fdf" },
  { label: "Mapa", value: 67, color: "#22c76f" },
  { label: "Instrucciones", value: 52, color: "#3ed08b" },
  { label: "Confirmaron", value: 43, color: "#129a56" },
];

const weeklyTrend = [
  { label: "sem. 06", value: 41 },
  { label: "sem. 07", value: 46 },
  { label: "sem. 08", value: 52 },
  { label: "sem. 09", value: 49 },
  { label: "sem. 10", value: 61 },
  { label: "sem. 11", value: 58 },
  { label: "sem. 12", value: 64 },
  { label: "sem. 13", value: 67 },
];

const detailRows = [
  { residue: "Plásticos PET", scans: 312, confirmed: 271, rate: "87%", kilograms: "8.1 kg" },
  { residue: "Cartón", scans: 198, confirmed: 165, rate: "83%", kilograms: "24.8 kg" },
  { residue: "Papel mixto", scans: 174, confirmed: 146, rate: "84%", kilograms: "3.9 kg" },
  { residue: "Tetra Pak", scans: 129, confirmed: 101, rate: "78%", kilograms: "1.8 kg" },
  { residue: "Vidrio", scans: 118, confirmed: 97, rate: "82%", kilograms: "5.1 kg" },
  { residue: "Latas", scans: 93, confirmed: 76, rate: "81%", kilograms: "2.4 kg" },
];

const categoryChartConfig = {
  confirmed: {
    label: "Confirmados",
    color: "#22c76f",
  },
} satisfies ChartConfig;

const weeklyChartConfig = {
  value: {
    label: "Confirmados",
    color: "#22c76f",
  },
} satisfies ChartConfig;

const qualityChartConfig = {
  value: {
    label: "Participación",
    color: "#22c76f",
  },
} satisfies ChartConfig;

function SummaryCard({
  title,
  value,
  subtitle,
  delta,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  delta: string;
  icon: typeof Users;
}) {
  return (
    <article className="relative min-h-[154px] overflow-hidden rounded-lg bg-[#0b2f4e] px-5 py-4 text-white shadow-[0_10px_28px_rgba(11,47,78,0.18)]">
      <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#22c76f] text-[#08324f]">
        <Icon className="h-5 w-5" />
      </div>

      <p className="pr-14 text-sm font-extrabold uppercase tracking-[0.02em]">{title}</p>
      <p className="mt-3 text-[2rem] font-extrabold leading-8">{value}</p>
      <p className="mt-1.5 text-sm text-white/76">{subtitle}</p>

      <div className="mt-4 text-[11px]">
        <span className="inline-flex rounded-full bg-[#0f8f57] px-2 py-1 font-medium text-[#9ff5c6]">{delta}</span>
      </div>
    </article>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function differenceInDaysInclusive(dateFrom: Date, dateTo: Date) {
  const start = startOfDay(dateFrom).getTime();
  const end = startOfDay(dateTo).getTime();
  return Math.max(1, Math.floor((end - start) / 86400000) + 1);
}

function formatRangeLabel(dateFrom: Date, dateTo: Date) {
  return `${formatDate(dateFrom)} - ${formatDate(dateTo)}`;
}

export default function MetricsDashboard() {
  const { session } = useUser();
  const [dateFrom, setDateFrom] = useState<Date>(new Date(2026, 5, 1));
  const [dateTo, setDateTo] = useState<Date>(new Date(2026, 5, 11));
  const [datePreset, setDatePreset] = useState<DatePreset>("last7");
  const [activeTab, setActiveTab] = useState<DashboardTab>("flow");
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loadError, setLoadError] = useState(false);
  const totalDays = useMemo(() => differenceInDaysInclusive(dateFrom, dateTo), [dateFrom, dateTo]);
  const topResidueChartHeight = Math.max(220, (dashboardData?.topResidues.length ?? topResidues.length) * 30 + 20);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    let cancelled = false;

    fetchDashboard(session.access_token, dateFrom.toISOString(), dateTo.toISOString())
      .then((data) => {
        if (!cancelled) {
          setDashboardData(data);
          setLoadError(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("[MetricsDashboard] No se pudo cargar dashboard real:", error);
          setLoadError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session?.access_token, dateFrom, dateTo]);

  const renderedKpis = useMemo(
    () =>
      dashboardData
        ? [
            {
              title: "Reciclajes totales",
              value: dashboardData.kpis.totalRecyclings.toLocaleString("es-PE"),
              subtitle: "Acciones de reciclaje confirmadas",
              delta: `${dashboardData.funnel[4]?.value ?? 0} confirmados en el periodo`,
              icon: CheckCircle2,
            },
            {
              title: "Kg reciclados",
              value: `${dashboardData.kpis.totalKg.toFixed(1)} kg`,
              subtitle: "Peso total reciclado en el periodo",
              delta:
                dashboardData.detailRows[0] != null
                  ? `${dashboardData.detailRows[0].residue} lidera con ${dashboardData.detailRows[0].kilograms.toFixed(1)} kg`
                  : "Sin registros en el periodo",
              icon: Scale,
            },
            {
              title: "Usuarios activos",
              value: dashboardData.kpis.activeUsersInPeriod.toLocaleString("es-PE"),
              subtitle: "Usuarios con actividad en el periodo",
              delta: `${dashboardData.kpis.newUsersInPeriod} usuarios nuevos`,
              icon: Users,
            },
            {
              title: "Tasa de confirmación",
              value: `${dashboardData.kpis.confirmationRate}%`,
              subtitle: "Sesiones que terminaron en confirmación",
              delta: `${dashboardData.funnel[4]?.value ?? 0} de ${dashboardData.funnel[0]?.value ?? 0} sesiones confirmadas`,
              icon: ScanSearch,
            },
          ]
        : kpiMetrics,
    [dashboardData, dateFrom, dateTo]
  );

  const renderedFunnel = dashboardData?.funnel.map((step, index) => ({
    ...step,
    color: funnelSteps[index]?.color ?? "#0b2f4e",
  })) ?? funnelSteps;

  const renderedTopResidues =
    dashboardData?.topResidues.map((row, index) => ({
      key: `${row.name}-${index}`,
      name: row.name,
      confirmed: row.confirmed,
    })) ?? topResidues;

  const renderedRecognitionQuality =
    dashboardData?.recognitionQuality.map((row) => ({
      name: row.name,
      value: row.percentage,
      count: row.count,
      color: row.color,
    })) ?? recognitionQuality.map((row) => ({ ...row, count: row.value }));

  const renderedTrend = dashboardData?.trend ?? weeklyTrend;

  const renderedDetailRows =
    dashboardData?.detailRows.map((row) => ({
      residue: row.residue,
      scans: row.scans,
      confirmed: row.confirmed,
      rate: `${row.rate}%`,
      kilograms: `${row.kilograms.toFixed(1)} kg`,
    })) ?? detailRows;

  const funnelMaxValue = Math.max(...renderedFunnel.map((step) => step.value), 1);

  const applyPreset = (preset: DatePreset) => {
    setDatePreset(preset);

    if (preset === "custom") {
      return;
    }

    const base = new Date(2026, 5, 11);

    if (preset === "last7") {
      setDateFrom(addDays(base, -6));
      setDateTo(base);
      return;
    }

    if (preset === "last30") {
      setDateFrom(addDays(base, -29));
      setDateTo(base);
      return;
    }

    setDateFrom(new Date(2025, 0, 1));
    setDateTo(base);
  };

  // Hasta tener datos reales se muestra carga, no valores de relleno.
  if (!dashboardData) {
    return (
      <AppPage>
        <h1 className="text-[3rem] font-extrabold leading-none text-[#0b2f4e]">Métricas</h1>
        <p className="mt-2 text-sm text-slate-500">
          Vista general del rendimiento de reciclaje y participacion dentro de la plataforma.
        </p>
        {loadError ? (
          <AppSurface className="mt-8 rounded-2xl bg-[#eef3f8] px-6 py-12 text-center">
            <p className="text-sm text-red-600">No se pudieron cargar las métricas. Intenta nuevamente.</p>
          </AppSurface>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        )}
      </AppPage>
    );
  }

  return (
    <AppPage>
      <div className="flex flex-col gap-3 md:min-h-[72px] md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[3rem] font-extrabold leading-none text-[#0b2f4e]">
            Métricas
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Vista general del rendimiento de reciclaje y participacion dentro de la plataforma.
          </p>
        </div>
        <div className="flex flex-wrap items-center content-center gap-3 md:self-center md:justify-end">
          {[
            { key: "last7", label: "Ultima semana" },
            { key: "last30", label: "Ultimo mes" },
            { key: "historical", label: "Histórico" },
          ].map((preset) => {
            const active =
              (preset.key === "last7" && datePreset === "last7") ||
              (preset.key === "last30" && datePreset === "last30") ||
              (preset.key === "historical" &&
                datePreset !== "last7" &&
                datePreset !== "last30" &&
                datePreset !== "custom");

            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyPreset(preset.key === "historical" ? ("historical" as DatePreset) : (preset.key as DatePreset))}
                className={cn(
                  "inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold transition",
                  active
                    ? "border-[#18b566] bg-[#18b566] text-white"
                    : "border-[#d7e6f2] bg-white text-[#0b2f4e] hover:border-[#b9d8c8]"
                )}
              >
                {preset.label}
              </button>
            );
          })}

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={() => setDatePreset("custom")}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition",
                  datePreset === "custom"
                    ? "border-[#18b566] bg-[#18b566] text-white"
                    : "border-[#d7e6f2] bg-white text-[#0b2f4e] hover:border-[#b9d8c8]"
                )}
              >
                Custom
                <CalendarIcon className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[340px] p-4">
              <div className="grid gap-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#0b2f4e]">Desde</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex h-11 w-full items-center justify-between rounded-lg border border-[#d9dee2] bg-white px-4 text-sm text-slate-500 shadow-sm transition hover:border-slate-300"
                      >
                        <span>{formatDate(dateFrom)}</span>
                        <CalendarIcon className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={(date) => date && setDateFrom(date)}
                      />
                    </PopoverContent>
                  </Popover>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#0b2f4e]">Hasta</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex h-11 w-full items-center justify-between rounded-lg border border-[#d9dee2] bg-white px-4 text-sm text-slate-500 shadow-sm transition hover:border-slate-300"
                      >
                        <span>{formatDate(dateTo)}</span>
                        <CalendarIcon className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={(date) => date && setDateTo(date)}
                        disabled={(date) => date < dateFrom}
                      />
                    </PopoverContent>
                  </Popover>
                </label>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <AppSurface className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {renderedKpis.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </AppSurface>

      <AppSurface className="mt-5">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DashboardTab)}>
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-3">
              <TabsList className="bg-slate-50">
                <TabsTrigger value="flow">Flujo y calidad</TabsTrigger>
                <TabsTrigger value="results">Resultados</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="flow" className="px-5 pb-5">
              <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <section className="flex h-[380px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[1.9rem] font-bold text-[#0b2f4e]">Embudo del flujo</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Sesiones que avanzaron por cada etapa del flujo de reciclaje.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#eef3f8] px-3 py-1 text-xs font-semibold text-[#0b2f4e]">
                    {formatRangeLabel(dateFrom, dateTo)}
                  </span>
                </div>

                <div className="mt-4 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="mx-auto flex h-full w-full max-w-lg flex-col justify-center gap-1.5">
                    {renderedFunnel.map((step) => {
                      const width = Math.max(32, Math.round((step.value / funnelMaxValue) * 100));

                      return (
                        <div key={step.label} className="flex flex-col items-center">
                          <div
                            className="flex h-[42px] items-center justify-between rounded-2xl px-4 text-white shadow-sm transition"
                            style={{
                              width: `${width}%`,
                              backgroundColor: step.color,
                            }}
                          >
                            <span className="text-sm font-semibold">{step.label}</span>
                            <span className="text-[1.55rem] font-extrabold leading-none">{step.value}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="flex h-[380px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[1.9rem] font-bold text-[#0b2f4e]">Calidad del reconocimiento IA</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Alta confianza, baja confianza y correcciones manuales del usuario.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    calidad de clasificacion
                  </span>
                </div>

                <div className="mt-4 grid flex-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,0.8fr)_minmax(260px,1.2fr)] lg:items-center">
                  <div className="grid gap-2">
                    {renderedRecognitionQuality.map((entry) => (
                      <div key={entry.name} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-sm font-medium text-[#0b2f4e]">{entry.name}</span>
                          </div>
                          <span className="text-lg font-extrabold leading-none text-[#0b2f4e]">{entry.value}%</span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-end text-xs text-slate-500">
                          <span className="font-semibold text-[#0b2f4e]">{entry.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex h-full min-h-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {renderedRecognitionQuality.some((entry) => entry.count > 0) ? (
                      <ChartContainer config={qualityChartConfig} className="h-[220px] w-full max-w-[280px] aspect-auto">
                        <PieChart>
                          <Pie
                            data={renderedRecognitionQuality}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={52}
                            outerRadius={86}
                            paddingAngle={3}
                            strokeWidth={0}
                            isAnimationActive={false}
                            label={({ percent }) => `${Math.round((percent || 0) * 100)}%`}
                            labelLine={false}
                          >
                            {renderedRecognitionQuality.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-semibold text-[#0b2f4e]">Sin clasificaciones</p>
                        <p className="mt-1 text-xs text-slate-500">No hay datos para el periodo seleccionado.</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
              </div>
            </TabsContent>

            <TabsContent value="results" className="px-5 pb-5">
              <div className="grid gap-4 xl:grid-cols-2">
              <section className="flex h-[380px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[1.9rem] font-bold text-[#0b2f4e]">Residuos mas reciclados</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Comparativo de residuos con mas confirmaciones en el periodo.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#eef3f8] px-3 py-1 text-xs font-semibold text-[#0b2f4e]">
                    {renderedTopResidues.length} residuos
                  </span>
                </div>

                <div className="mt-4 flex-1">
                  <ChartContainer
                    config={categoryChartConfig}
                    className="w-full aspect-auto"
                    style={{ height: `${topResidueChartHeight}px` }}
                  >
                    <BarChart
                      accessibilityLayer
                      data={renderedTopResidues}
                      layout="vertical"
                      margin={{ top: 4, right: 28, left: 8, bottom: 4 }}
                      barCategoryGap={14}
                    >
                      <CartesianGrid horizontal={false} stroke="#e5edf5" />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        width={108}
                        tick={{ fill: "#0b2f4e", fontSize: 14, fontWeight: 600 }}
                      />
                      <Bar
                        dataKey="confirmed"
                        radius={999}
                        barSize={14}
                        fill="var(--color-confirmed)"
                        isAnimationActive={false}
                        activeBar={false}
                      >
                        <LabelList
                          dataKey="confirmed"
                          position="right"
                          offset={10}
                          formatter={(value: number) => `${value}`}
                          className="fill-[#0b2f4e] text-xs font-semibold"
                        />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
              </section>

              <section className="flex h-[380px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[1.9rem] font-bold text-[#0b2f4e]">Tendencia temporal</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Evolucion de reciclajes confirmados a lo largo del tiempo.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#eef3f8] px-3 py-1 text-xs font-semibold text-[#0b2f4e]">
                    Periodo de {totalDays} dias
                  </span>
                </div>

                <div className="mt-4 flex-1">
                  <ChartContainer config={weeklyChartConfig} className="h-[260px] w-full aspect-auto">
                    <LineChart accessibilityLayer data={renderedTrend} margin={{ top: 16, right: 20, left: 8, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#e5edf5" />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tickMargin={12}
                        tick={{ fill: "#0b2f4e", fontSize: 12, fontWeight: 500 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                        width={34}
                        tick={{ fill: "#6b7c93", fontSize: 12 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="var(--color-value)"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#22c76f", strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: "#22c76f", strokeWidth: 0 }}
                        isAnimationActive={false}
                      >
                        <LabelList position="top" offset={10} className="fill-[#6b7c93] text-xs font-medium" />
                      </Line>
                    </LineChart>
                  </ChartContainer>
                </div>
              </section>
              </div>
            </TabsContent>
          </section>
        </Tabs>
      </AppSurface>

      <AppSurface className="mt-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-[1.9rem] font-bold text-[#0b2f4e]">Residuos por detalle</h3>
              <p className="mt-1 text-sm text-slate-500">
                Resumen detallado por tipo de residuo para el periodo seleccionado.
              </p>
            </div>
            <span className="rounded-full bg-[#eef3f8] px-3 py-1 text-xs font-semibold text-[#0b2f4e]">
              {renderedDetailRows.length} residuos
            </span>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-slate-50">
                <tr className="text-sm text-slate-600">
                  <th className="px-4 py-3 font-semibold">Residuo</th>
                  <th className="px-4 py-3 font-semibold">Escaneos</th>
                  <th className="px-4 py-3 font-semibold">Confirmados</th>
                  <th className="px-4 py-3 font-semibold">Tasa</th>
                  <th className="px-4 py-3 font-semibold">Kg totales</th>
                </tr>
              </thead>
              <tbody>
                {renderedDetailRows.map((row) => (
                  <tr key={row.residue} className="border-t border-slate-200 text-sm text-[#0b2f4e]">
                    <td className="px-4 py-3 font-medium">{row.residue}</td>
                    <td className="px-4 py-3">{row.scans}</td>
                    <td className="px-4 py-3">{row.confirmed}</td>
                    <td className="px-4 py-3">{row.rate}</td>
                    <td className="px-4 py-3">{row.kilograms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </AppSurface>

    </AppPage>
  );
}
