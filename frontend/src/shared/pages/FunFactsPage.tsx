import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ColumnDef,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Download, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import FunFactForm, { type FunFactFormValues } from "@/modules/admin/components/FunFactForm";
import FunFactRow from "@/modules/admin/components/FunFactRow";
import {
  createFunFact,
  deactivateFunFact,
  getFunFacts,
  restoreFunFact,
  updateFunFact,
  type FunFact,
  type FunFactPayload,
} from "@/modules/admin/services/FunFactsService";
import { getWasteTypes } from "@/modules/admin/services/WasteTypesService";
import { useUser } from "../context/UserContext";
import { AppPage, AppSurface } from "../components/AppPage";

type FunFactsTab = "active" | "inactive";
type FilterValue = "all" | string;
type EnrichedFunFact = FunFact & { wasteTypeName: string };
type PendingAction =
  | { type: "deactivate"; factId: string }
  | { type: "restore"; factId: string };

const FUN_FACTS_QUERY_KEY = ["admin-fun-facts"];
const WASTE_TYPES_QUERY_KEY = ["admin-waste-types"];

function tabClasses(selected: boolean) {
  return `flex-1 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none ${
    selected ? "bg-[#18b566] text-white" : "text-slate-600 hover:bg-slate-100"
  }`;
}

function exportToCsv(rows: { text: string; wasteTypeName: string; isActive: boolean }[]) {
  const header = "Tipo de residuo,Texto,Estado";
  const lines = rows.map((row) =>
    [
      `"${row.wasteTypeName.replace(/"/g, '""')}"`,
      `"${row.text.replace(/"/g, '""')}"`,
      row.isActive ? "activo" : "inactivo",
    ].join(",")
  );

  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "fun-facts.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function FunFactsPage() {
  const { session } = useUser();
  const queryClient = useQueryClient();

  const [selectedTab, setSelectedTab] = useState<FunFactsTab>("active");
  const [selectedWasteTypeId, setSelectedWasteTypeId] = useState<FilterValue>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [savingFactId, setSavingFactId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [textFilter, setTextFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const deferredTextFilter = useDeferredValue(textFilter);

  const { data: funFacts = [], isLoading, isFetching, error } = useQuery({
    queryKey: FUN_FACTS_QUERY_KEY,
    queryFn: () => getFunFacts(session!.access_token),
    enabled: !!session,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: wasteTypes = [], isLoading: isWasteTypesLoading, error: wasteTypesError } = useQuery({
    queryKey: WASTE_TYPES_QUERY_KEY,
    queryFn: () => getWasteTypes(session!.access_token),
    enabled: !!session,
    staleTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (values: FunFactPayload) => createFunFact(session!.access_token, values),
    onSuccess: async () => {
      setShowAddDialog(false);
      setSelectedTab("active");
      setSelectedWasteTypeId("all");
      toast.success("Dato curioso creado exitosamente");
      await queryClient.invalidateQueries({ queryKey: FUN_FACTS_QUERY_KEY });
    },
    onError: () => toast.error("Error al crear el dato curioso"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: FunFactPayload }) =>
      updateFunFact(session!.access_token, id, values),
    onSuccess: async () => {
      toast.success("Dato curioso actualizado exitosamente");
      setEditingFactId(null);
      await queryClient.invalidateQueries({ queryKey: FUN_FACTS_QUERY_KEY });
    },
    onError: () => toast.error("Error al actualizar el dato curioso"),
    onSettled: () => setSavingFactId(null),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? restoreFunFact(session!.access_token, id) : deactivateFunFact(session!.access_token, id),
    onSuccess: async (_, variables) => {
      setSelectedTab(variables.isActive ? "active" : "inactive");
      setPendingAction(null);
      toast.success(variables.isActive ? "Dato curioso restaurado" : "Dato curioso desactivado");
      await queryClient.invalidateQueries({ queryKey: FUN_FACTS_QUERY_KEY });
    },
    onError: () => toast.error("Error al cambiar el estado del dato curioso"),
    onSettled: () => setSavingFactId(null),
  });

  const isCreating = createMutation.isPending;
  const isMutating = isCreating || updateMutation.isPending || statusMutation.isPending;

  const activeFacts = useMemo(() => funFacts.filter((fact) => fact.isActive), [funFacts]);
  const inactiveFacts = useMemo(() => funFacts.filter((fact) => !fact.isActive), [funFacts]);
  const displayedFacts = selectedTab === "active" ? activeFacts : inactiveFacts;

  const wasteTypeNameById = useMemo(
    () =>
      wasteTypes.reduce<Record<string, string>>((acc, type) => {
        acc[type.id] = type.name;
        return acc;
      }, {}),
    [wasteTypes]
  );

  const typesInTab = useMemo(() => {
    const ids = new Set(displayedFacts.map((fact) => fact.wasteTypeId));
    return wasteTypes.filter((type) => ids.has(type.id));
  }, [displayedFacts, wasteTypes]);

  const filteredFacts = useMemo(
    () =>
      displayedFacts.filter((fact) =>
        selectedWasteTypeId === "all" ? true : fact.wasteTypeId === selectedWasteTypeId
      ),
    [displayedFacts, selectedWasteTypeId]
  );

  const normalizedTextFilter = deferredTextFilter.trim().toLocaleLowerCase();

  const enrichedFacts = useMemo<EnrichedFunFact[]>(
    () =>
      filteredFacts
        .map((fact) => ({
          ...fact,
          wasteTypeName: wasteTypeNameById[fact.wasteTypeId] ?? "—",
        }))
        .filter((fact) =>
          normalizedTextFilter.length === 0
            ? true
            : fact.text.toLocaleLowerCase().includes(normalizedTextFilter)
        ),
    [filteredFacts, normalizedTextFilter, wasteTypeNameById]
  );

  const columns = useMemo<ColumnDef<EnrichedFunFact>[]>(
    () => [
      {
        accessorKey: "wasteTypeName",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
          >
            Tipo
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
      },
      {
        accessorKey: "text",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
          >
            Texto
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
      },
      {
        id: "actions",
        header: () => (
          <span className="block text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
            Acciones
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: enrichedFacts,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: true,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [selectedTab, selectedWasteTypeId, normalizedTextFilter]);

  function handleCreate(values: FunFactFormValues) {
    createMutation.mutate({
      text: values.text.trim(),
      wasteTypeId: values.wasteTypeId,
    });
  }

  function handleEdit(values: FunFactFormValues) {
    if (!editingFactId) return;
    setSavingFactId(editingFactId);
    updateMutation.mutate({
      id: editingFactId,
      values: {
        text: values.text.trim(),
        wasteTypeId: values.wasteTypeId,
      },
    });
  }

  function requestStatusChange(id: string, isActive: boolean) {
    setPendingAction({ type: isActive ? "restore" : "deactivate", factId: id });
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;

    setSavingFactId(pendingAction.factId);

    await statusMutation.mutateAsync({
      id: pendingAction.factId,
      isActive: pendingAction.type === "restore",
    });
  }

  function handleExport() {
    const rows = table.getSortedRowModel().rows.map((row) => ({
      text: row.original.text,
      wasteTypeName: row.original.wasteTypeName,
      isActive: row.original.isActive,
    }));
    exportToCsv(rows);
  }

  const filteredRowCount = enrichedFacts.length;
  const pageRows = table.getRowModel().rows;
  const canGoPrevious = table.getCanPreviousPage();
  const canGoNext = table.getCanNextPage();
  const totalPages = table.getPageCount();
  const editingFact = editingFactId ? enrichedFacts.find((fact) => fact.id === editingFactId) ?? null : null;

  const pendingTitle =
    pendingAction?.type === "deactivate"
        ? "¿Desactivar dato curioso?"
        : "¿Restaurar dato curioso?";

  const pendingDescription =
    pendingAction?.type === "deactivate"
        ? "El dato curioso dejará de aparecer como activo, pero podrá restaurarse después."
        : "El dato curioso volverá a aparecer en la lista de activos.";

  return (
    <AppPage>
      <div className="flex flex-col gap-3 md:min-h-[72px] md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[3rem] font-extrabold leading-none text-[#0b2f4e]">
            Gestionar fun facts
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Vista general del rendimiento de reciclaje y participacion dentro de la plataforma.
          </p>
        </div>
        <Button
          type="button"
          className="h-10 rounded-lg bg-[#18b566] px-5 text-sm font-semibold text-white hover:bg-[#129a56]"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo fun fact
        </Button>
      </div>

      <AppSurface className="mt-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={textFilter}
              onChange={(event) => setTextFilter(event.target.value)}
              placeholder="Buscar por texto o tipo"
              className="w-full bg-white sm:w-[260px]"
            />
            <Select
              value={selectedWasteTypeId}
              onValueChange={(value) => setSelectedWasteTypeId(value)}
              disabled={isLoading || typesInTab.length === 0}
            >
              <SelectTrigger className="w-[220px] bg-white">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Todos los tipos</SelectItem>
                {typesInTab.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              type="button"
              onClick={handleExport}
              disabled={isLoading || filteredRowCount === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
            >
              <Upload className="h-3.5 w-3.5" />
              Exportar CSV
            </button>

            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">
              <Download className="h-3.5 w-3.5" />
              Importar CSV
              <input
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={() => toast.info("Importación próximamente")}
              />
            </label>
          </div>

          <div className="inline-flex rounded-lg border border-[#d9dee2] bg-white p-1">
            <button
              type="button"
              disabled={isMutating}
              onClick={() => {
                setSelectedTab("active");
                setSelectedWasteTypeId("all");
              }}
              className={tabClasses(selectedTab === "active")}
            >
              Activos ({activeFacts.length})
            </button>
            <button
              type="button"
              disabled={isMutating}
              onClick={() => {
                setSelectedTab("inactive");
                setSelectedWasteTypeId("all");
              }}
              className={tabClasses(selectedTab === "inactive")}
            >
              Inactivos ({inactiveFacts.length})
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="mt-6 space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        )}

        {!!error && (
          <p className="mt-4 text-sm text-red-600">
            No se pudieron cargar los datos curiosos. Intenta nuevamente.
          </p>
        )}

        {!isLoading && !error && filteredRowCount === 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-[#b7c7d6] bg-[#eef3f8] px-8 py-12 text-center">
            <p className="text-sm text-slate-600">
              {normalizedTextFilter
                ? "No hay datos curiosos que coincidan con la busqueda."
                : selectedWasteTypeId !== "all"
                  ? "No hay datos curiosos para el tipo de residuo seleccionado."
                  : selectedTab === "active"
                  ? "No hay datos curiosos activos."
                  : "No hay datos curiosos inactivos."}
            </p>
          </div>
        )}

        {!isLoading && !error && filteredRowCount > 0 && (
          <>
            <div className={`mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="border-slate-200 hover:bg-transparent">
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={
                            header.id === "actions"
                              ? "w-44 text-center"
                              : header.id === "wasteTypeName"
                                ? "w-44"
                                : ""
                          }
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {pageRows.map((row) => (
                    <FunFactRow
                      key={row.original.id}
                      fact={row.original}
                      isSaving={savingFactId === row.original.id}
                      onRequestEdit={setEditingFactId}
                      onRequestStatusChange={requestStatusChange}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <div>
                Mostrando {pageRows.length} de {filteredRowCount} datos curiosos.
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={String(pagination.pageSize)}
                  onValueChange={(value) =>
                    setPagination({ pageIndex: 0, pageSize: Number(value) })
                  }
                >
                  <SelectTrigger className="h-9 w-[110px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {[10, 20, 50].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size} por página
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>
                  Página {pagination.pageIndex + 1} de {Math.max(totalPages, 1)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canGoPrevious}
                  onClick={() => table.previousPage()}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canGoNext}
                  onClick={() => table.nextPage()}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </AppSurface>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0b2f4e]">Nuevo fun fact</DialogTitle>
          </DialogHeader>
          <FunFactForm
            defaultValues={{ wasteTypeId: "", text: "" }}
            wasteTypes={wasteTypes}
            isSubmitting={isCreating}
            isWasteTypesLoading={isWasteTypesLoading}
            hasWasteTypesError={!!wasteTypesError}
            submitLabel={isCreating ? "Creando..." : "Agregar"}
            onSubmit={handleCreate}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingFact} onOpenChange={(open) => !open && setEditingFactId(null)}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0b2f4e]">Editar fun fact</DialogTitle>
          </DialogHeader>
          {editingFact && (
            <FunFactForm
              defaultValues={{
                wasteTypeId: editingFact.wasteTypeId,
                text: editingFact.text,
              }}
              wasteTypes={wasteTypes}
              isSubmitting={savingFactId === editingFact.id}
              isWasteTypesLoading={isWasteTypesLoading}
              hasWasteTypesError={!!wasteTypesError}
              submitLabel={savingFactId === editingFact.id ? "Guardando..." : "Guardar"}
              onSubmit={handleEdit}
              onCancel={() => setEditingFactId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingTitle}</AlertDialogTitle>
            <AlertDialogDescription>{pendingDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isMutating}
              onClick={(event) => {
                event.preventDefault();
                void confirmPendingAction();
              }}
            >
              {isMutating
                ? "Guardando..."
                : pendingAction?.type === "deactivate"
                  ? "Desactivar"
                  : "Restaurar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppPage>
  );
}
