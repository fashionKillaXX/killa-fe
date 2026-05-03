"use client";

import { useParams } from "next/navigation";
import OutfitDetail from "@/components/magazine/OutfitDetail";

export default function OutfitPage() {
  const params = useParams();
  const id = params.id as string;
  return <OutfitDetail outfitId={id} />;
}
