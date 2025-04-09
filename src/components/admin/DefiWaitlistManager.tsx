
import React, { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

export const DefiWaitlistManager = () => {
  const [waitlistEntries, setWaitlistEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWaitlistEntries();
  }, []);

  const fetchWaitlistEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('defi_card_waitlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setWaitlistEntries(data || []);
    } catch (error) {
      console.error('Error fetching waitlist entries:', error);
      toast.error('Failed to load waitlist entries');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!waitlistEntries.length) {
      toast.error('No data to export');
      return;
    }

    try {
      // Format entries for CSV
      const csvHeader = ['Name', 'Email', 'Twitter', 'Telegram', 'Discord', 'Signup Date'];
      
      const csvRows = waitlistEntries.map(entry => {
        const date = new Date(entry.created_at).toLocaleString();
        return [
          entry.name || '',
          entry.email || '',
          entry.twitter || '',
          entry.telegram || '',
          entry.discord || '',
          date
        ].map(val => `"${val.replace(/"/g, '""')}"`).join(',');
      });
      
      const csvString = [csvHeader.join(','), ...csvRows].join('\n');
      
      // Create downloadable link
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.setAttribute('href', url);
      link.setAttribute('download', `defi-card-waitlist-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Waitlist data exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export data');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">DEFI Card Waitlist</h2>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={exportToCSV}
          disabled={loading || !waitlistEntries.length}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading waitlist entries...</div>
      ) : waitlistEntries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No entries in the waitlist yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-zinc-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Social
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {waitlistEntries.map((entry) => (
                <tr key={entry.id} className="bg-zinc-900 hover:bg-zinc-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {entry.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {entry.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    <div className="space-y-1">
                      {entry.twitter && <div>Twitter: {entry.twitter}</div>}
                      {entry.telegram && <div>Telegram: {entry.telegram}</div>}
                      {entry.discord && <div>Discord: {entry.discord}</div>}
                      {!entry.twitter && !entry.telegram && !entry.discord && '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
