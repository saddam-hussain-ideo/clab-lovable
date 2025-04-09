
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

interface DistributionStatusTableProps {
  refreshData: () => Promise<void>;
  activeNetwork: string;
}

export function DistributionStatusTable({ refreshData, activeNetwork }: DistributionStatusTableProps) {
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const fetchContributions = async () => {
    setLoading(true);
    try {
      // Calculate start index for pagination
      const startIndex = (page - 1) * pageSize;
      
      console.log(`Fetching contributions for network: ${activeNetwork}`);
      
      // First get total count
      const { count, error: countError } = await supabase
        .from('presale_contributions')
        .select('*', { count: 'exact', head: true })
        .eq('network', activeNetwork);
        
      if (countError) {
        console.error('Error getting count:', countError);
        toast.error('Failed to fetch contribution count');
      }
        
      // Calculate total pages
      if (count !== null) {
        setTotalPages(Math.ceil(count / pageSize));
        console.log(`Total contributions: ${count}, pages: ${Math.ceil(count / pageSize)}`);
      }
      
      // Then get paginated data
      const { data, error } = await supabase
        .from('presale_contributions')
        .select('*')
        .eq('network', activeNetwork)
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + pageSize - 1);
        
      if (error) {
        console.error('Error fetching contributions:', error);
        toast.error('Failed to fetch contributions');
        throw error;
      }
      
      if (data) {
        console.log(`Fetched ${data.length} contributions`);
        setContributions(data);
      }
    } catch (error) {
      console.error('Error fetching contributions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, [page, activeNetwork]);
  
  // Set up a refresh when the external refresh function is called
  useEffect(() => {
    // Create a custom event to listen for refresh
    const handleRefresh = () => {
      console.log('Distribution refresh event received');
      fetchContributions();
    };
    
    window.addEventListener('distribution_refresh', handleRefresh);
    
    return () => {
      window.removeEventListener('distribution_refresh', handleRefresh);
    };
  }, []);

  // Helper function to format relative time
  const formatRelativeTime = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Helper function to format status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100/20 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-blue-100/20 text-blue-700 border-blue-200">Confirmed</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100/20 text-green-700 border-green-200">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100/20 text-red-700 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper function to truncate wallet addresses
  const truncateAddress = (address: string) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-card p-4 border-b">
        <h3 className="text-lg font-medium">Recent Contributions</h3>
        <p className="text-sm text-muted-foreground">
          Latest token purchase transactions
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-60">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Distribution</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions.length > 0 ? (
                  contributions.map((contribution) => (
                    <TableRow key={contribution.id}>
                      <TableCell className="font-mono text-xs">
                        {truncateAddress(contribution.wallet_address)}
                      </TableCell>
                      <TableCell>
                        {Math.round(contribution.token_amount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(contribution.status)}
                      </TableCell>
                      <TableCell>
                        {contribution.distribution_date ? (
                          <Badge variant="outline" className="bg-green-100/20 text-green-700 border-green-200">Distributed</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-zinc-100/20 text-zinc-700 border-zinc-200">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatRelativeTime(contribution.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No contributions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="py-4 border-t">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={page === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {totalPages > 5 && (
                    <>
                      <PaginationItem>
                        <PaginationLink className="pointer-events-none">...</PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setPage(totalPages)}
                          isActive={page === totalPages}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
