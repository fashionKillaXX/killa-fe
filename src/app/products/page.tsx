import { Suspense } from "react";
import { ProductCatalog } from "@/components/ProductCatalog";

/**
 * Products listing page.
 * Wrapped in Suspense because ProductCatalog uses useSearchParams().
 */
export default function ProductsPage() {
  return (
    <Suspense>
      <ProductCatalog />
    </Suspense>
  );
}
