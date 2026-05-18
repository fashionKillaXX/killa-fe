"use client";

import { useParams } from "next/navigation";
import Magazine from "@/components/magazine/Magazine";

export default function AnchorPage() {
  const params = useParams();
  const id = params.id as string;
  return <Magazine anchorId={id} />;
}
