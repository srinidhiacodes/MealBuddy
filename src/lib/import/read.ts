import Papa from "papaparse";
import { readSheet } from "read-excel-file/node";
import { parseRows, type ParseResult } from "./parse";

export type FileKind = "csv" | "xlsx";

export function fileKind(fileName: string): FileKind | null {
  const ext = fileName.toLowerCase().split(".").pop();
  if (ext === "csv") return "csv";
  if (ext === "xlsx") return "xlsx";
  return null;
}

/** Reads an uploaded CSV or XLSX file into recipes. */
export async function readRecipeFile(fileName: string, data: Buffer): Promise<ParseResult> {
  const kind = fileKind(fileName);
  if (kind === "csv") {
    const parsed = Papa.parse<string[]>(data.toString("utf8"), { skipEmptyLines: "greedy" });
    return parseRows(parsed.data);
  }
  if (kind === "xlsx") {
    const rows = await readSheet(data);
    return parseRows(rows as unknown[][]);
  }
  throw new Error("Only .csv and .xlsx files are supported");
}
