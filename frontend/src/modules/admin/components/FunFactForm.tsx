import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { WasteType } from "../services/WasteTypesService";

export const FUN_FACT_MAX_LENGTH = 255;

export const funFactFormSchema = z.object({
  wasteTypeId: z.string().min(1, "Selecciona un tipo de residuo."),
  text: z
    .string()
    .trim()
    .min(1, "Escribe el contenido del fun fact.")
    .max(FUN_FACT_MAX_LENGTH, `Máximo ${FUN_FACT_MAX_LENGTH} caracteres.`),
});

export type FunFactFormValues = z.infer<typeof funFactFormSchema>;

type FunFactFormProps = {
  defaultValues: FunFactFormValues;
  wasteTypes: WasteType[];
  isSubmitting: boolean;
  isWasteTypesLoading?: boolean;
  hasWasteTypesError?: boolean;
  submitLabel: string;
  onSubmit: (values: FunFactFormValues) => void;
  onCancel: () => void;
};

export default function FunFactForm({
  defaultValues,
  wasteTypes,
  isSubmitting,
  isWasteTypesLoading = false,
  hasWasteTypesError = false,
  submitLabel,
  onSubmit,
  onCancel,
}: FunFactFormProps) {
  const form = useForm<FunFactFormValues>({
    resolver: zodResolver(funFactFormSchema),
    defaultValues,
  });

  const textValue = form.watch("text") ?? "";
  const remainingChars = FUN_FACT_MAX_LENGTH - textValue.length;

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <FormField
          control={form.control}
          name="wasteTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-[#0b2f4e]">Tipo de residuo</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting || isWasteTypesLoading || hasWasteTypesError}
              >
                <FormControl>
                  <SelectTrigger className="h-11 w-full border-slate-200 bg-white">
                    <SelectValue
                      placeholder={isWasteTypesLoading ? "Cargando tipos..." : "Selecciona un tipo de residuo"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white">
                  {wasteTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {hasWasteTypesError && (
          <p className="mt-2 text-sm text-red-600">No se pudieron cargar los tipos de residuo.</p>
        )}

        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-[#0b2f4e]">Texto</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Escribe aquí el contenido"
                  disabled={isSubmitting}
                  maxLength={FUN_FACT_MAX_LENGTH}
                  className="min-h-28 resize-none border-slate-200 bg-white shadow-none focus-visible:ring-emerald-500"
                />
              </FormControl>
              <p className="mt-1 text-right text-xs text-slate-400">
                {remainingChars} caracteres restantes
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-[#18b566] text-white hover:bg-[#129a56]"
            disabled={isSubmitting || isWasteTypesLoading || hasWasteTypesError}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
