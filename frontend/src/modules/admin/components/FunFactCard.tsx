import { useState } from "react";
import { Check, Pencil, RotateCcw, Trash2, X } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FunFact, FunFactPayload } from "../services/FunFactsService";
import type { WasteType } from "../services/WasteTypesService";

type PendingAction = "edit" | "deactivate" | "restore" | null;

type FunFactCardProps = {
  fact: FunFact;
  wasteTypes: WasteType[];
  isSaving?: boolean;
  onUpdate: (id: string, values: FunFactPayload) => Promise<void> | void;
  onChangeStatus: (id: string, isActive: boolean) => Promise<void> | void;
};

export default function FunFactCard({
  fact,
  wasteTypes,
  isSaving = false,
  onUpdate,
  onChangeStatus,
}: FunFactCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editWasteTypeId, setEditWasteTypeId] = useState(fact.wasteTypeId);
  const [editText, setEditText] = useState(fact.text);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const canSave = editWasteTypeId.trim().length > 0 && editText.trim().length > 0;

  function cancelEdit() {
    setEditWasteTypeId(fact.wasteTypeId);
    setEditText(fact.text);
    setIsEditing(false);
  }

  async function confirmPendingAction() {
    try {
      if (pendingAction === "edit") {
        await onUpdate(fact.id, { text: editText.trim(), wasteTypeId: editWasteTypeId });
        setIsEditing(false);
      }
      if (pendingAction === "deactivate") {
        await onChangeStatus(fact.id, false);
        setIsEditing(false);
      }
      if (pendingAction === "restore") {
        await onChangeStatus(fact.id, true);
      }
      setPendingAction(null);
    } catch {
      // error notified from mutation
    }
  }

  const actionTitle =
    pendingAction === "edit"
      ? "¿Guardar cambios?"
      : pendingAction === "deactivate"
        ? "¿Desactivar dato curioso?"
        : "¿Restaurar dato curioso?";

  const actionDescription =
    pendingAction === "edit"
      ? "Se actualizará el texto y/o el tipo de residuo de este dato curioso."
      : pendingAction === "deactivate"
        ? "El dato curioso dejará de aparecer como activo, pero podrá restaurarse desde la pestaña de inactivos."
        : "El dato curioso volverá a aparecer en la lista de activos.";

  return (
    <>
      <article className={`group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md ${!fact.isActive ? "opacity-60" : ""}`}>
        {isEditing ? (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo de residuo</span>
              <Select value={editWasteTypeId} onValueChange={setEditWasteTypeId} disabled={isSaving}>
                <SelectTrigger className="w-full border-slate-200 bg-white">
                  <SelectValue placeholder="Selecciona un tipo de residuo" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {wasteTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Texto</span>
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                disabled={isSaving}
                className="min-h-24 resize-none border-slate-200 bg-white shadow-none focus-visible:ring-emerald-500"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                className="bg-[#18b566] text-white hover:bg-[#129a56]"
                disabled={!canSave || isSaving}
                onClick={() => setPendingAction("edit")}
              >
                <Check className="h-3.5 w-3.5" />
                Confirmar
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={isSaving} onClick={cancelEdit}>
                <X className="h-3.5 w-3.5" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <span className="absolute left-4 top-3 text-5xl font-serif leading-none text-slate-100 select-none" aria-hidden="true">"</span>
            <p className="relative z-10 pt-4 text-sm leading-relaxed text-slate-700">{fact.text}</p>

            <div className="mt-4 flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              {fact.isActive ? (
                <>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Pencil className="h-3 w-3" />
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setPendingAction("deactivate")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-3 py-1.5 text-xs font-medium text-red-500 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    Desactivar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setPendingAction("restore")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restaurar
                </button>
              )}
            </div>
          </>
        )}
      </article>

      <AlertDialog open={!!pendingAction} onOpenChange={(open) => { if (!open) setPendingAction(null); }}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{actionTitle}</AlertDialogTitle>
            <AlertDialogDescription>{actionDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={isSaving} onClick={confirmPendingAction}>
              {isSaving
                ? "Guardando..."
                : pendingAction === "deactivate"
                  ? "Desactivar"
                  : pendingAction === "restore"
                    ? "Restaurar"
                    : "Guardar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
