"use client";

import { useParams } from "next/navigation";
import { CategoryProductsPage } from "@/components/CategoryProductsPage";

export default function CategoryPage() {
  const params = useParams();
  return <CategoryProductsPage categoryName={decodeURIComponent(params.categoryName as string)} />;
}
