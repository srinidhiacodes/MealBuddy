"use client";

import { useActionState, useRef } from "react";
import { uploadRecipes, type UploadResult } from "@/app/actions";
import { btn } from "./ui";

export default function UploadForm() {
  const [state, action, pending] = useActionState<UploadResult | null, FormData>(uploadRecipes, null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-[2_1_340px] flex-col items-center justify-center gap-2.5 rounded-[24px] border-[3px] border-dashed border-ocean/40 bg-ocean-tint p-7 text-center"
    >
      <span aria-hidden="true" className="text-5xl">📥</span>
      <h2 className="m-0 font-display text-2xl font-extrabold">Upload recipe files</h2>
      <p className="m-0 text-sm text-subtle">CSV or Excel (.xlsx). Add one file or many; each becomes a source you can switch on or off.</p>
      <label className={`${btn.primary} mt-1.5 cursor-pointer`}>
        {pending ? "Importing…" : "Choose files"}
        <input
          type="file"
          name="files"
          multiple
          accept=".csv,.xlsx"
          className="sr-only"
          disabled={pending}
          onChange={() => formRef.current?.requestSubmit()}
        />
      </label>
      {state?.files.map((f) => (
        <div
          key={f.name}
          role="status"
          className={`w-full rounded-xl px-3 py-2 text-left text-sm ${f.error ? "bg-coral-tint" : "bg-white"}`}
        >
          <strong>{f.name}</strong>
          {f.error ? (
            <> · {f.error}</>
          ) : (
            f.report && (
              <>
                {" "}· {f.report.added} added
                {f.report.duplicates > 0 && ` · ${f.report.duplicates} duplicates`}
                {f.report.skipped.length > 0 && ` · ${f.report.skipped.length} skipped`}
              </>
            )
          )}
        </div>
      ))}
    </form>
  );
}
