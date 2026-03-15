"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/services/api";
import { batchUpdateProductCollections, invalidateCollectionCache } from "@/services/products";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SavedCollection {
  id: string;
  name: string;
  createdAt: number;
  itemCount: number;
  thumbnail: string | null;
}

interface SavedCollectionsContextType {
  collections: SavedCollection[];
  createCollection: (name: string) => Promise<SavedCollection | null>;
  deleteCollection: (collectionId: string) => Promise<void>;
  batchUpdateCollections: (productId: string, add: string[], remove: string[]) => Promise<boolean>;
  refreshCollections: () => Promise<void>;
}

const SavedCollectionsContext = createContext<SavedCollectionsContextType | undefined>(undefined);

export function SavedCollectionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, token } = useAuth();
  const [collections, setCollections] = useState<SavedCollection[]>([]);

  // Fetch collections list (without items)
  const refreshCollections = async () => {
    if (!isAuthenticated || !token) {
      console.log('[SavedCollectionsContext] Not authenticated, clearing collections');
      setCollections([]);
      return;
    }

    try {
      console.log('[SavedCollectionsContext] Fetching collections list...');
      const response = await api.get('/api/collections/');
      if (response.data.success) {
        const backendCollections = response.data.collections.map((c: any) => ({
          id: c.collectionId,
          name: c.name,
          createdAt: new Date(c.createdAt).getTime(),
          itemCount: c.itemCount,
          thumbnail: c.thumbnail
        }));
        console.log('[SavedCollectionsContext] Collections fetched:', backendCollections);
        setCollections(backendCollections);
      }
    } catch (error) {
      console.error('[SavedCollectionsContext] Error fetching collections:', error);
    }
  };

  // Batch update collections for a product
  const batchUpdateCollectionsWrapper = async (
    productId: string,
    add: string[],
    remove: string[]
  ): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error("Please sign in to save products");
      return false;
    }

    try {
      const response = await batchUpdateProductCollections(productId, add, remove);
      if (response.success) {
        // Refresh collections to update counts and thumbnails
        await refreshCollections();
        return true;
      }
      if (response.errors && response.errors.length > 0) {
        toast.error(response.errors[0]);
      }
      return false;
    } catch (error) {
      console.error('[SavedCollectionsContext] Error batch updating collections:', error);
      toast.error('Failed to update collections');
      return false;
    }
  };

  // Initialize collections on mount and when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshCollections();
    } else {
      setCollections([]);
    }
  }, [isAuthenticated, token]);

  const createCollection = async (name: string): Promise<SavedCollection | null> => {
    if (!isAuthenticated) {
      toast.error("Please sign in to create collections");
      return null;
    }

    try {
      const response = await api.post('/api/collections/create/', { name });
      if (response.data.success) {
        const newCollection: SavedCollection = {
          id: response.data.collection.collectionId,
          name: response.data.collection.name,
          createdAt: new Date(response.data.collection.createdAt).getTime(),
          itemCount: 0,
          thumbnail: null
        };
        setCollections((prev) => [newCollection, ...prev]);
        return newCollection;
      }
      throw new Error(response.data.error || 'Failed to create collection');
    } catch (error: any) {
      console.error('Error creating collection:', error);
      toast.error(error.response?.data?.error || 'Failed to create collection');
      return null;
    }
  };

  const deleteCollection = async (collectionId: string) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to delete collections");
      return;
    }

    try {
      const response = await api.delete(`/api/collections/${collectionId}/`);
      if (response.data.success) {
        setCollections((prev) => prev.filter((c) => c.id !== collectionId));
        // Invalidate cache for deleted collection
        invalidateCollectionCache(collectionId);
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Failed to delete collection');
    }
  };

  return (
    <SavedCollectionsContext.Provider
      value={{
        collections,
        createCollection,
        deleteCollection,
        batchUpdateCollections: batchUpdateCollectionsWrapper,
        refreshCollections
      }}
    >
      {children}
    </SavedCollectionsContext.Provider>
  );
}

export function useSavedCollections() {
  const context = useContext(SavedCollectionsContext);
  if (context === undefined) {
    throw new Error("useSavedCollections must be used within a SavedCollectionsProvider");
  }
  return context;
}
