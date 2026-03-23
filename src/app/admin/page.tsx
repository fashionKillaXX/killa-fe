'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  checkAdminAccess,
  fetchDashboardStats,
  fetchBrands,
  createBrand,
  fetchJobs,
  fetchJobDetail,
  createJob,
  type Brand,
  type Job,
  type JobType,
  type DashboardStats,
} from '@/services/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Package,
  Tags,
  Image,
  Sparkles,
  Plus,
  Play,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────

const JOB_TYPE_LABELS: Record<JobType, string> = {
  scraping: 'Scrape Products',
  llm_analysis: 'GPT Tag Analysis',
  image_enrichment: 'Image Enrichment',
  scraping_pipeline: 'Full Scrape Pipeline',
  embedding_generation: 'Generate Embeddings',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'running') return <Loader2 className="h-4 w-4 animate-spin" />;
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4" />;
  if (status === 'failed') return <AlertCircle className="h-4 w-4" />;
  return <Clock className="h-4 w-4" />;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !authUser?.email) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    checkAdminAccess(authUser.email).then((ok) => {
      setAuthorized(ok);
      setLoading(false);
    }).catch(() => {
      setAuthorized(false);
      setLoading(false);
    });
  }, [authUser, isAuthenticated, authLoading]);

  // Load data once authorized
  const loadData = useCallback(async () => {
    try {
      const [s, b, j] = await Promise.all([
        fetchDashboardStats(),
        fetchBrands(),
        fetchJobs(),
      ]);
      setStats(s);
      setBrands(b);
      setJobs(j);
    } catch (e) {
      console.error('Failed to load admin data', e);
    }
  }, []);

  useEffect(() => {
    if (authorized) loadData();
  }, [authorized, loadData]);

  // Auto-refresh jobs every 10s
  useEffect(() => {
    if (!authorized) return;
    const id = setInterval(async () => {
      try {
        const j = await fetchJobs();
        setJobs(j);
      } catch {}
    }, 10000);
    return () => clearInterval(id);
  }, [authorized]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <h1 className="text-xl font-semibold">Access Denied</h1>
        <p className="text-gray-500">
          You don&apos;t have admin access. Please sign in with an authorized account.
        </p>
        <Button variant="outline" onClick={() => (window.location.href = '/')}>
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">FitCurry Admin</h1>
            <p className="text-sm text-gray-500">Brand & product management</p>
          </div>
          <Button variant="ghost" size="sm" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Stats Cards */}
        {stats && <StatsCards stats={stats} />}

        {/* Tabs */}
        <Tabs defaultValue="brands" className="mt-6">
          <TabsList>
            <TabsTrigger value="brands">Brands</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="brands">
            <BrandsSection brands={brands} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="jobs">
            <JobsSection jobs={jobs} brands={brands} onRefresh={loadData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ── Stats Cards ───────────────────────────────────────────────────────

function StatsCards({ stats }: { stats: DashboardStats }) {
  const cards = [
    { label: 'Brands', value: stats.total_brands, icon: Package },
    { label: 'Products', value: stats.total_products, icon: Tags },
    { label: 'Tagged', value: stats.products_with_tags, icon: Sparkles },
    { label: 'Searchable', value: stats.products_with_embeddings, icon: Image },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-gray-100 p-2">
              <c.icon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{c.value?.toLocaleString() ?? '—'}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Brands Section ────────────────────────────────────────────────────

function BrandsSection({
  brands,
  onRefresh,
}: {
  brands: Brand[];
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [ig, setIg] = useState('');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [scrapingBrand, setScrapingBrand] = useState<string | null>(null);
  const [busyBrand, setBusyBrand] = useState<{ id: string; action: string } | null>(null);

  const handleScrape = async (brand: Brand) => {
    if (!brand.url) {
      alert('Brand has no URL configured');
      return;
    }
    setScrapingBrand(brand.brandId);
    try {
      await createJob('scraping_pipeline', { brand_urls: [brand.url] });
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setScrapingBrand(null);
    }
  };

  const handleBrandAction = async (brand: Brand, jobType: JobType) => {
    setBusyBrand({ id: brand.brandId, action: jobType });
    try {
      await createJob(jobType, { brand_ids: [brand.brandId] });
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyBrand(null);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createBrand({ name: name.trim(), url: url.trim() || undefined, brandInstagram: ig.trim() || undefined });
      setName('');
      setUrl('');
      setIg('');
      setOpen(false);
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  };

  const filtered = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.url || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Brands ({brands.length})</CardTitle>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search brands..."
            className="w-48"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" /> Add Brand
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Brand</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Input
                  placeholder="Brand name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  placeholder="Website URL (e.g. https://brand.com)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Input
                  placeholder="Instagram handle (without @)"
                  value={ig}
                  onChange={(e) => setIg(e.target.value)}
                />
                <Button onClick={handleCreate} disabled={creating || !name.trim()} className="w-full">
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Brand
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white text-left text-gray-500">
              <tr>
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">URL</th>
                <th className="pb-2 font-medium text-center">Pipeline Status</th>
                <th className="pb-2 font-medium text-right">Added</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((b) => (
                <tr key={b.brandId} className="hover:bg-gray-50">
                  <td className="py-2 font-medium">{b.name}</td>
                  <td className="py-2 text-gray-500 truncate max-w-[200px]">
                    {b.url ? (
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {(() => { try { return new URL(b.url).hostname; } catch { return b.url; } })()}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2">
                    {b.pipeline?.total_products ? (
                      <div className="flex items-center gap-1.5 justify-center">
                        <span className="text-xs text-gray-500">{b.pipeline.total_products}</span>
                        <Badge variant={b.pipeline.with_images > 0 ? 'default' : 'outline'} className={`text-[10px] px-1.5 py-0 ${b.pipeline.with_images > 0 ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : ''}`}>
                          IMG {b.pipeline.with_images}/{b.pipeline.total_products}
                        </Badge>
                        <Badge variant={b.pipeline.with_tags > 0 ? 'default' : 'outline'} className={`text-[10px] px-1.5 py-0 ${b.pipeline.with_tags > 0 ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : ''}`}>
                          TAG {b.pipeline.with_tags}/{b.pipeline.total_products}
                        </Badge>
                        <Badge variant={b.pipeline.with_embeddings > 0 ? 'default' : 'outline'} className={`text-[10px] px-1.5 py-0 ${b.pipeline.with_embeddings > 0 ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}`}>
                          EMB {b.pipeline.with_embeddings}/{b.pipeline.total_products}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs text-center block">Not scraped</span>
                    )}
                  </td>
                  <td className="py-2 text-right text-gray-400">
                    {b.created_at ? timeAgo(b.created_at) : '—'}
                  </td>
                  <td className="py-2 text-right flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!b.url || scrapingBrand === b.brandId}
                      onClick={() => handleScrape(b)}
                    >
                      {scrapingBrand === b.brandId ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                      <span className="ml-1">Scrape</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyBrand?.id === b.brandId && busyBrand?.action === 'llm_analysis'}
                      onClick={() => handleBrandAction(b, 'llm_analysis')}
                    >
                      {busyBrand?.id === b.brandId && busyBrand?.action === 'llm_analysis' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      <span className="ml-1">GPT Tags</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyBrand?.id === b.brandId && busyBrand?.action === 'embedding_generation'}
                      onClick={() => handleBrandAction(b, 'embedding_generation')}
                    >
                      {busyBrand?.id === b.brandId && busyBrand?.action === 'embedding_generation' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Tags className="h-3 w-3" />
                      )}
                      <span className="ml-1">Embed</span>
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No brands found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Jobs Section ──────────────────────────────────────────────────────

function JobsSection({
  jobs,
  brands,
  onRefresh,
}: {
  jobs: Job[];
  brands: Brand[];
  onRefresh: () => void;
}) {
  const [launching, setLaunching] = useState<JobType | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [jobLogs, setJobLogs] = useState<Record<string, string>>({});

  // Auto-poll logs for expanded running jobs
  useEffect(() => {
    if (!expandedJob) return;
    const job = jobs.find((j) => j.jobId === expandedJob);
    if (!job || (job.status !== 'running' && job.status !== 'pending')) return;

    const poll = async () => {
      try {
        const detail = await fetchJobDetail(expandedJob);
        setJobLogs((prev) => ({ ...prev, [expandedJob]: detail.logs || 'Waiting for logs...' }));
      } catch {}
    };
    poll(); // immediate first fetch
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [expandedJob, jobs]);

  const launchJob = async (jobType: JobType) => {
    setLaunching(jobType);
    try {
      const params: Record<string, any> = {};
      // Scraping pipeline needs brand_urls
      if (jobType === 'scraping_pipeline') {
        const urls = brands.filter((b) => b.url).map((b) => b.url!);
        if (urls.length === 0) {
          alert('No brands with URLs to scrape');
          setLaunching(null);
          return;
        }
        params.brand_urls = urls;
      }
      await createJob(jobType, params);
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLaunching(null);
    }
  };

  const toggleLogs = async (jobId: string) => {
    if (expandedJob === jobId) {
      setExpandedJob(null);
      return;
    }
    setExpandedJob(jobId);
    try {
      const detail = await fetchJobDetail(jobId);
      setJobLogs((prev) => ({ ...prev, [jobId]: detail.logs || 'No logs yet.' }));
    } catch {
      setJobLogs((prev) => ({ ...prev, [jobId]: 'Failed to fetch logs.' }));
    }
  };

  const jobActions: { type: JobType; desc: string }[] = [
    { type: 'scraping_pipeline', desc: 'Scrape + enrich images for all brands' },
    { type: 'llm_analysis', desc: 'GPT-4o tag analysis on untagged products' },
    { type: 'embedding_generation', desc: 'Generate search embeddings for tagged products' },
  ];

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {jobActions.map((a) => (
            <Button
              key={a.type}
              variant="outline"
              size="sm"
              disabled={launching !== null}
              onClick={() => launchJob(a.type)}
            >
              {launching === a.type ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {JOB_TYPE_LABELS[a.type]}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Job History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Job History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {jobs.map((job) => (
              <div
                key={job.jobId}
                className="rounded-lg border p-3"
              >
                <div
                  className="flex cursor-pointer items-center justify-between"
                  onClick={() => toggleLogs(job.jobId)}
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon status={job.status} />
                    <span className="font-medium">
                      {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                    </span>
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS[job.status]}
                    >
                      {job.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>{timeAgo(job.created_at)}</span>
                    {expandedJob === job.jobId ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {expandedJob === job.jobId && (
                  <div className="mt-3 border-t pt-3">
                    {job.result_summary && Object.keys(job.result_summary).length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {Object.entries(job.result_summary).map(([k, v]) => (
                          <Badge key={k} variant="outline">
                            {k}: {String(v)}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <pre className="max-h-64 overflow-auto rounded bg-gray-900 p-3 text-xs text-green-400">
                      {jobLogs[job.jobId] || 'Loading...'}
                    </pre>
                  </div>
                )}
              </div>
            ))}
            {jobs.length === 0 && (
              <p className="py-8 text-center text-gray-400">No jobs yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
