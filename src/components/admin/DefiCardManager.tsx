import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Download, Check, X, Truck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const DefiCardManager = () => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<number>(500);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistrations();
    fetchSettings();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from("defi_card_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRegistrations(data || []);
    } catch (error: any) {
      console.error("Error fetching registrations:", error);
      setError(error.message || "Failed to load DEFI card registrations");
      toast.error("Failed to load DEFI card registrations");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from("defi_card_settings")
        .select("min_purchase_amount")
        .eq("id", 1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const { error: createError } = await supabase
            .from("defi_card_settings")
            .insert([{ id: 1, min_purchase_amount: 500 }]);
            
          if (createError) throw createError;
          setMinPurchaseAmount(500);
        } else {
          throw error;
        }
      } else {
        setMinPurchaseAmount(data.min_purchase_amount);
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      setError(error.message || "Failed to load settings");
    }
  };

  const updateSettings = async () => {
    try {
      setIsUpdatingSettings(true);
      setError(null);
      
      const { data: existingSettings } = await supabase
        .from("defi_card_settings")
        .select("id")
        .eq("id", 1)
        .single();

      if (!existingSettings) {
        const { error: insertError } = await supabase
          .from("defi_card_settings")
          .insert([{ id: 1, min_purchase_amount: minPurchaseAmount }]);
          
        if (insertError) throw insertError;
      } else {
        const { error } = await supabase
          .from("defi_card_settings")
          .update({ min_purchase_amount: minPurchaseAmount })
          .eq("id", 1);
          
        if (error) throw error;
      }

      toast.success("Eligibility threshold updated successfully");
    } catch (error: any) {
      console.error("Error updating settings:", error);
      setError(error.message || "Failed to update eligibility threshold");
      toast.error("Failed to update eligibility threshold");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const approveRegistration = async (id: string) => {
    try {
      const { error } = await supabase
        .from("defi_card_registrations")
        .update({ is_approved: true, status: "approved" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Registration approved");
      fetchRegistrations();
    } catch (error) {
      console.error("Error approving registration:", error);
      toast.error("Failed to approve registration");
    }
  };

  const rejectRegistration = async (id: string) => {
    try {
      const { error } = await supabase
        .from("defi_card_registrations")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Registration rejected");
      fetchRegistrations();
    } catch (error) {
      console.error("Error rejecting registration:", error);
      toast.error("Failed to reject registration");
    }
  };

  const markAsShipped = async (id: string, trackingNumber: string) => {
    try {
      const { error } = await supabase
        .from("defi_card_registrations")
        .update({
          is_shipped: true,
          tracking_number: trackingNumber,
          status: "shipped",
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Registration marked as shipped");
      setSelectedRegistration(null);
      fetchRegistrations();
    } catch (error) {
      console.error("Error updating shipping status:", error);
      toast.error("Failed to update shipping status");
    }
  };

  const downloadCSV = () => {
    try {
      let dataToExport = [...registrations];
      
      if (filterStatus !== "all") {
        dataToExport = dataToExport.filter(reg => reg.status === filterStatus);
      }
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        dataToExport = dataToExport.filter(reg => 
          reg.first_name.toLowerCase().includes(term) ||
          reg.last_name.toLowerCase().includes(term) ||
          reg.email.toLowerCase().includes(term) ||
          reg.wallet_address.toLowerCase().includes(term)
        );
      }
      
      const headers = [
        "ID", "First Name", "Last Name", "Email", "Address Line 1", 
        "Address Line 2", "City", "State", "Postal Code", "Country", 
        "Status", "Approved", "Shipped", "Tracking Number", "Wallet Address", 
        "Registration Date"
      ];
      
      const csvRows = [headers.join(",")];
      
      for (const reg of dataToExport) {
        const row = [
          reg.id,
          `"${reg.first_name ? reg.first_name.replace(/"/g, '""') : ''}"`,
          `"${reg.last_name ? reg.last_name.replace(/"/g, '""') : ''}"`,
          `"${reg.email ? reg.email.replace(/"/g, '""') : ''}"`,
          `"${reg.address_line1 ? reg.address_line1.replace(/"/g, '""') : ''}"`,
          reg.address_line2 ? `"${reg.address_line2.replace(/"/g, '""')}"` : "",
          `"${reg.city ? reg.city.replace(/"/g, '""') : ''}"`,
          `"${reg.state ? reg.state.replace(/"/g, '""') : ''}"`,
          `"${reg.postal_code ? reg.postal_code.replace(/"/g, '""') : ''}"`,
          `"${reg.country ? reg.country.replace(/"/g, '""') : ''}"`,
          reg.status || "",
          reg.is_approved ? "Yes" : "No",
          reg.is_shipped ? "Yes" : "No",
          reg.tracking_number || "",
          reg.wallet_address || "",
          reg.created_at ? new Date(reg.created_at).toISOString() : ""
        ];
        
        csvRows.push(row.join(","));
      }
      
      const csvContent = csvRows.join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `defi_card_registrations_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Error downloading CSV:", error);
      setError(error.message || "Failed to download CSV");
      toast.error("Failed to download CSV");
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (filterStatus !== "all" && reg.status !== filterStatus) {
      return false;
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        (reg.first_name && reg.first_name.toLowerCase().includes(term)) ||
        (reg.last_name && reg.last_name.toLowerCase().includes(term)) ||
        (reg.email && reg.email.toLowerCase().includes(term)) ||
        (reg.wallet_address && reg.wallet_address.toLowerCase().includes(term))
      );
    }
    
    return true;
  });

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">DEFI Card Management</h1>
        <Card className="p-6 text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <Button onClick={() => { 
            fetchRegistrations(); 
            fetchSettings(); 
          }}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">DEFI Card Management</h1>

      <Card className="p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">Eligibility Settings</h2>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Label htmlFor="min-purchase">Minimum Purchase Amount ($)</Label>
            <Input
              id="min-purchase"
              type="number"
              value={minPurchaseAmount}
              onChange={(e) => setMinPurchaseAmount(Number(e.target.value))}
              placeholder="Minimum purchase amount in USD"
              min="0"
              step="10"
            />
          </div>
          <Button 
            onClick={updateSettings} 
            disabled={isUpdatingSettings}
          >
            {isUpdatingSettings ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update"
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Users must purchase at least this amount of CLAB tokens (in USD value) to be eligible for a DEFI card.
        </p>
      </Card>

      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex-1">
          <Input 
            placeholder="Search by name, email, or wallet address"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="border border-input bg-background px-3 h-10 rounded-md text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="shipped">Shipped</option>
            <option value="rejected">Rejected</option>
          </select>
          <Button onClick={downloadCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No registrations found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRegistrations.map((registration) => (
            <Card key={registration.id} className="p-4">
              <div className="flex flex-col md:flex-row justify-between">
                <div className="mb-4 md:mb-0">
                  <h3 className="font-semibold">{registration.first_name} {registration.last_name}</h3>
                  <p className="text-sm text-muted-foreground">{registration.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Wallet: {registration.wallet_address && `${registration.wallet_address.substring(0, 8)}...${registration.wallet_address.substring(registration.wallet_address.length - 8)}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registered: {registration.created_at && new Date(registration.created_at).toLocaleDateString()}
                  </p>
                  <div className="mt-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      registration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      registration.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      registration.status === 'shipped' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {registration.status ? (registration.status.charAt(0).toUpperCase() + registration.status.slice(1)) : 'Unknown'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {registration.status === 'pending' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-green-500 text-green-500 hover:bg-green-50"
                        onClick={() => approveRegistration(registration.id)}
                      >
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-red-500 text-red-500 hover:bg-red-50"
                        onClick={() => rejectRegistration(registration.id)}
                      >
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  {registration.status === 'approved' && !registration.is_shipped && (
                    <Dialog onOpenChange={(open) => {
                      if (open) {
                        setSelectedRegistration(registration);
                        setTrackingNumber("");
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-blue-500 text-blue-500 hover:bg-blue-50"
                        >
                          <Truck className="h-4 w-4 mr-1" /> Ship
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Mark as Shipped</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <Label htmlFor="tracking-number">Tracking Number</Label>
                          <Input
                            id="tracking-number"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="Enter tracking number"
                            className="mt-2"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setSelectedRegistration(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => markAsShipped(selectedRegistration.id, trackingNumber)}
                          >
                            Confirm
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Dialog onOpenChange={(open) => {
                    if (open) {
                      setSelectedRegistration(registration);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                      >
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Registration Details</DialogTitle>
                      </DialogHeader>
                      {selectedRegistration && (
                        <div className="py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium">Name</p>
                              <p>{selectedRegistration.first_name} {selectedRegistration.last_name}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Email</p>
                              <p>{selectedRegistration.email}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm font-medium">Address</p>
                              <p>{selectedRegistration.address_line1}</p>
                              {selectedRegistration.address_line2 && <p>{selectedRegistration.address_line2}</p>}
                              <p>
                                {selectedRegistration.city}, {selectedRegistration.state} {selectedRegistration.postal_code}
                              </p>
                              <p>{selectedRegistration.country}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Status</p>
                              <p className="capitalize">{selectedRegistration.status}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Registration Date</p>
                              <p>{selectedRegistration.created_at && new Date(selectedRegistration.created_at).toLocaleDateString()}</p>
                            </div>
                            {selectedRegistration.tracking_number && (
                              <div className="col-span-2">
                                <p className="text-sm font-medium">Tracking Number</p>
                                <p>{selectedRegistration.tracking_number}</p>
                              </div>
                            )}
                            <div className="col-span-2">
                              <p className="text-sm font-medium">Wallet Address</p>
                              <p className="text-xs break-all">{selectedRegistration.wallet_address}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
