import { Suspense } from "react";
import TraitsClient from "./traitsClient";

export default function TraitsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <TraitsClient />
    </Suspense>
  );
}
