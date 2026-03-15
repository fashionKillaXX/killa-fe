"use client";

import { useParams } from "next/navigation";
import { ProductDetails } from "@/components/ProductDetails";

/**
 * Product detail page.
 * Extracts productId from the route params and passes it to ProductDetails.
 */
export default function ProductPage() {
  const params = useParams();
  const productId = params.productId as string;
  return <ProductDetails productId={productId} />;
}
