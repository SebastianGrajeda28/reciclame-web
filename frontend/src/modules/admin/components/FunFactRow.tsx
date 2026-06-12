import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import type { FunFact } from "../services/FunFactsService";

type FunFactRowProps = {
  fact: FunFact & { wasteTypeName: string };
  isSaving?: boolean;
  onRequestEdit: (id: string) => void;
  onRequestStatusChange: (id: string, isActive: boolean) => void;
};

export default function FunFactRow({
  fact,
  isSaving = false,
  onRequestEdit,
  onRequestStatusChange,
}: FunFactRowProps) {
  return (
    <TableRow>
      <TableCell className={fact.isActive ? "w-44" : "w-44 opacity-50"}>
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
          {fact.wasteTypeName || "—"}
        </span>
      </TableCell>
      <TableCell
        className={
          fact.isActive
            ? "whitespace-normal text-sm leading-relaxed text-slate-700"
            : "whitespace-normal text-sm leading-relaxed text-slate-700 opacity-50"
        }
      >
        {fact.text}
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          {fact.isActive ? (
            <>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => onRequestEdit(fact.id)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                <Pencil className="h-3 w-3" />
                Editar
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => onRequestStatusChange(fact.id, false)}
                className="inline-flex items-center gap-1 rounded-md border border-red-100 bg-white px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                Desactivar
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onRequestStatusChange(fact.id, true)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" />
              Restaurar
            </button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
