import { useMutation } from "@tanstack/react-query";
import { lookupBarcode, recordBarcodeMatch } from "@/services/barcode";

export function useLookupBarcode() {
  return useMutation({
    mutationFn: (upc: string) => lookupBarcode({ data: { upc } }),
  });
}

export function useRecordBarcodeMatch() {
  return useMutation({
    mutationFn: (input: { upc: string; issueId: string }) =>
      recordBarcodeMatch({ data: input }),
  });
}
