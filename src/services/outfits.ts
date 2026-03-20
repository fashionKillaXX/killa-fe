/**
 * Outfit service — save, list, delete outfits.
 */
import api from './api';

export interface OutfitProduct {
  productId: string;
  name: string;
  productImageUrl: string;
  price: number | null;
  brand: string;
  slot: string;
  url: string;
}

export interface SavedOutfit {
  outfitId: string;
  name: string;
  description: string;
  occasion: string;
  products: OutfitProduct[];
  created_at: string;
}

export async function saveOutfit(data: {
  name: string;
  occasion?: string;
  description?: string;
  products: { productId: string; slot: string }[];
}): Promise<SavedOutfit> {
  const res = await api.post('/api/outfits/save/', data);
  return res.data.outfit;
}

export async function listOutfits(): Promise<SavedOutfit[]> {
  const res = await api.get('/api/outfits/list/');
  return res.data.outfits ?? [];
}

export async function deleteOutfit(outfitId: string): Promise<void> {
  await api.delete(`/api/outfits/${outfitId}/delete/`);
}

