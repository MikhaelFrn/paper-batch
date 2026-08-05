import { useMutation } from "@tanstack/react-query";
import { correctBarcodeMatch, lookupBarcode, recordBarcodeMatch } from "@/services/barcode";

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

export function useCorrectBarcodeMatch() {
  return useMutation({
    mutationFn: (input: { upc: string; issueId: string }) =>
      correctBarcodeMatch({ data: input }),
  });
}
