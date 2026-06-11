import { buildBackendUrl } from "@/lib/backend-url";

const cache = new Map<string, DashboardResponse>();

export function clearDashboardCache() {
  cache.clear();
}

export type DashboardResponse = {
  filters: {
    start: string;
    end: string;
  };
  kpis: {
    totalRecyclings: number;
    totalKg: number;
    activeUsersInPeriod: number;
    newUsersInPeriod: number;
    confirmationRate: number;
  };
  funnel: Array<{
    label: string;
    value: number;
  }>;
  topResidues: Array<{
    name: string;
    confirmed: number;
  }>;
  recognitionQuality: Array<{
    name: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  trend: Array<{
    label: string;
    value: number;
  }>;
  detailRows: Array<{
    residue: string;
    scans: number;
    confirmed: number;
    rate: number;
    kilograms: number;
  }>;
};

export async function fetchDashboard(
  accessToken: string,
  start: string,
  end: string
): Promise<DashboardResponse> {
  const key = `${start}|${end}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const url = new URL(buildBackendUrl("/api/dashboard"));
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`No se pudo cargar el dashboard (${res.status})`);
  }

  const data: DashboardResponse = await res.json();
  cache.set(key, data);
  return data;
}
