
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Search, Download, ArrowUpDown } from "lucide-react";

export interface PresaleTransactionsProps {
  contributions: any[];
  activeNetwork: string;
  onNetworkChange: (network: string) => void;
}

export const PresaleTransactions: React.FC<PresaleTransactionsProps> = ({
  contributions,
  activeNetwork,
  onNetworkChange
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(new Date())
  });
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range);
  };

  const filteredContributions = contributions
    .filter(contribution => {
      const matchesSearch = searchQuery === "" || 
        contribution.wallet_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contribution.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || contribution.status === statusFilter;
      
      const contributionDate = new Date(contribution.created_at);
      const isInDateRange = contributionDate >= dateRange.from && contributionDate <= dateRange.to;
      
      return matchesSearch && matchesStatus && isInDateRange;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getNetworkBadgeVariant = (network: string) => {
    return network === 'mainnet' ? 'success' : 'warning';
  };

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Wallet', 'Amount (SOL)', 'Tokens', 'Status', 'Transaction ID', 'Network'].join(','),
      ...filteredContributions.map(c => [
        format(new Date(c.created_at), 'yyyy-MM-dd HH:mm:ss'),
        c.wallet_address,
        c.sol_amount,
        c.token_amount,
        c.status,
        c.transaction_id,
        activeNetwork
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `presale-transactions-${activeNetwork}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Presale Transactions</CardTitle>
        <Badge 
          variant={getNetworkBadgeVariant(activeNetwork)}
          className="capitalize text-sm px-3 py-1"
        >
          {activeNetwork}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by wallet or transaction ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              
              <DateRangePicker
                date={dateRange}
                onDateChange={handleDateRangeChange}
              />
              
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <Separator />

          <div className="rounded-md border">
            <div className="grid grid-cols-7 p-4 bg-muted/50 text-sm font-medium">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}>
                Date
                <ArrowUpDown className="h-4 w-4" />
              </div>
              <div>Wallet</div>
              <div>Amount (SOL)</div>
              <div>Tokens</div>
              <div>Status</div>
              <div>Transaction</div>
              <div>Network</div>
            </div>
            
            <div className="divide-y">
              {filteredContributions.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No transactions found
                </div>
              ) : (
                filteredContributions.map((contribution, index) => (
                  <div key={index} className="grid grid-cols-7 p-4 text-sm items-center">
                    <div>{format(new Date(contribution.created_at), 'MMM dd, yyyy HH:mm')}</div>
                    <div className="font-mono text-xs">
                      {contribution.wallet_address.substring(0, 4)}...
                      {contribution.wallet_address.substring(contribution.wallet_address.length - 4)}
                    </div>
                    <div>{contribution.sol_amount} SOL</div>
                    <div>{parseInt(contribution.token_amount).toLocaleString()}</div>
                    <div>
                      <Badge variant={getStatusBadgeVariant(contribution.status)}>
                        {contribution.status}
                      </Badge>
                    </div>
                    <div className="font-mono text-xs">
                      {contribution.transaction_id ? (
                        <a
                          href={`https://${contribution.network === 'mainnet' ? '' : 'testnet.'}solscan.io/tx/${contribution.transaction_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600"
                        >
                          {contribution.transaction_id.substring(0, 4)}...
                          {contribution.transaction_id.substring(contribution.transaction_id.length - 4)}
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </div>
                    <div>
                      <Badge 
                        variant={getNetworkBadgeVariant(contribution.network || activeNetwork)}
                        className="text-xs"
                      >
                        {(contribution.network || activeNetwork) === 'mainnet' ? 'Mainnet' : 'Testnet'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
