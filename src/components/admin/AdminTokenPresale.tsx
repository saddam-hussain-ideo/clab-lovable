import React, { useState, useEffect } from 'react';
import { PresaleAdmin } from './presale/PresaleAdmin';
import { PresaleDistribution } from './presale/PresaleDistribution';
import { PresaleTransactions } from './presale/PresaleTransactions';
import { PresaleReports } from './presale/PresaleReports';
import { PresaleStages } from './presale/PresaleStages';
import { StageDialog } from './presale/StageDialog';
import { DeleteStageDialog } from './presale/DeleteStageDialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/lib/supabase";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { getNetworkPreference } from '@/utils/presale/purchaseHandlers';
import { setActiveNetwork } from '@/utils/wallet';

const AdminTokenPresale = () => {
  const [activeTab, setActiveTab] = useState('admin');
  const [activeNetwork, setActiveNetwork] = useState('mainnet');
  const [isLoading, setIsLoading] = useState(false);
  const [isPresaleActive, setIsPresaleActive] = useState(true);
  const [contributions, setContributions] = useState([]);
  
  // Stage management state
  const [stages, setStages] = useState([]);
  const [isCreateStageOpen, setIsCreateStageOpen] = useState(false);
  const [isEditStageOpen, setIsEditStageOpen] = useState(false);
  const [isDeleteStageOpen, setIsDeleteStageOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);

  // Fetch presale settings
  const { data: presaleSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['presaleSettings', activeNetwork],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('presale_settings')
        .select('*')
        .eq('id', 'default')
        .eq('network', activeNetwork)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch network settings
  useEffect(() => {
    const fetchNetworkSettings = async () => {
      try {
        const { active_network } = await getNetworkPreference();
        
        // Check for user preference first
        const userPreference = localStorage.getItem('userNetworkPreference');
        if (userPreference === 'mainnet' || userPreference === 'testnet') {
          setActiveNetwork(userPreference);
        } else {
          // Otherwise use global setting
          setActiveNetwork(active_network);
          localStorage.setItem('userNetworkPreference', active_network);
        }
      } catch (error) {
        console.error("Error fetching network settings:", error);
      }
    };
    
    fetchNetworkSettings();
  }, []);

  // Fetch stages for the current network
  const fetchStages = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('presale_stages')
        .select('*')
        .eq('network', activeNetwork)
        .order('order_number', { ascending: true });
      
      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Error fetching presale stages:', error);
      toast.error('Failed to fetch presale stages');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch contributions for the transaction view
  useEffect(() => {
    const fetchContributions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('presale_contributions')
          .select('*')
          .eq('network', activeNetwork)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setContributions(data || []);
      } catch (error) {
        console.error('Error fetching contributions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContributions();
  }, [activeNetwork]);

  // Fetch stages when the network changes
  useEffect(() => {
    fetchStages();
  }, [activeNetwork]);

  const handleNetworkChange = (network) => {
    setActiveNetwork(network);
    
    // Store the admin's preference
    localStorage.setItem('userNetworkPreference', network);
    
    // Update the global active network
    setActiveNetwork(network);
  };

  // Stage dialog handlers
  const openCreateStageDialog = () => {
    setSelectedStage(null);
    setIsCreateStageOpen(true);
  };

  const openEditStageDialog = (stage) => {
    setSelectedStage(stage);
    setIsEditStageOpen(true);
  };

  const openDeleteStageDialog = (stage) => {
    setSelectedStage(stage);
    setIsDeleteStageOpen(true);
  };

  const closeStageDialog = () => {
    setIsCreateStageOpen(false);
    setIsEditStageOpen(false);
    setSelectedStage(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteStageOpen(false);
    setSelectedStage(null);
  };

  const handleStageSubmit = async (stageData, isEdit) => {
    try {
      setIsLoading(true);
      
      if (isEdit) {
        const { error } = await supabase
          .from('presale_stages')
          .update(stageData)
          .eq('id', selectedStage.id);
        
        if (error) throw error;
        
        toast.success('Stage updated successfully');
      } else {
        const { error } = await supabase
          .from('presale_stages')
          .insert({
            ...stageData,
            network: activeNetwork
          });
        
        if (error) throw error;
        
        toast.success('Stage created successfully');
      }
      
      fetchStages();
      closeStageDialog();
    } catch (error) {
      console.error('Error saving stage:', error);
      toast.error('Failed to save stage');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStage = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('presale_stages')
        .delete()
        .eq('id', selectedStage.id);
      
      if (error) throw error;
      
      toast.success('Stage deleted successfully');
      fetchStages();
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting stage:', error);
      toast.error('Failed to delete stage');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Token Presale Management</h1>
        
        <div className="flex items-center space-x-2 mt-4 sm:mt-0 p-2 bg-zinc-800 rounded-lg">
          <span className={`text-sm ${activeNetwork === 'testnet' ? 'text-yellow-400 font-medium' : 'text-gray-400'}`}>Testnet</span>
          <Switch 
            checked={activeNetwork === 'mainnet'}
            onCheckedChange={(checked) => handleNetworkChange(checked ? 'mainnet' : 'testnet')}
          />
          <span className={`text-sm ${activeNetwork === 'mainnet' ? 'text-green-400 font-medium' : 'text-gray-400'}`}>Mainnet</span>
          <Badge 
            variant={activeNetwork === 'mainnet' ? 'success' : 'warning'}
            className="ml-2"
          >
            {activeNetwork === 'mainnet' ? 'Mainnet' : 'Testnet'}
          </Badge>
        </div>
      </div>
      
      <div className="flex space-x-1 bg-black/20 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('admin')}
          className={`px-3 py-1.5 text-sm rounded-md transition-all ${
            activeTab === 'admin' 
              ? 'bg-white text-black font-medium' 
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab('stages')}
          className={`px-3 py-1.5 text-sm rounded-md transition-all ${
            activeTab === 'stages' 
              ? 'bg-white text-black font-medium' 
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          Stages
        </button>
        <button
          onClick={() => setActiveTab('distribution')}
          className={`px-3 py-1.5 text-sm rounded-md transition-all ${
            activeTab === 'distribution' 
              ? 'bg-white text-black font-medium' 
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          Distribution
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-3 py-1.5 text-sm rounded-md transition-all ${
            activeTab === 'transactions' 
              ? 'bg-white text-black font-medium' 
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3 py-1.5 text-sm rounded-md transition-all ${
            activeTab === 'reports' 
              ? 'bg-white text-black font-medium' 
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          Reports
        </button>
      </div>
      
      <div className="bg-zinc-900 rounded-lg border border-zinc-800">
        {activeTab === 'admin' && <PresaleAdmin 
          activeNetwork={activeNetwork} 
          onNetworkChange={handleNetworkChange}
        />}
        {activeTab === 'stages' && <PresaleStages
          stages={stages}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          fetchStages={fetchStages}
          openCreateStageDialog={openCreateStageDialog}
          openEditStageDialog={openEditStageDialog}
          openDeleteStageDialog={openDeleteStageDialog}
          activeNetwork={activeNetwork}
        />}
        {activeTab === 'distribution' && <PresaleDistribution 
          isPresaleActive={isPresaleActive}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          refetchSettings={refetchSettings}
          activeNetwork={activeNetwork}
          onNetworkChange={handleNetworkChange}
          presaleSettings={presaleSettings}
          contributions={contributions}
        />}
        {activeTab === 'transactions' && <PresaleTransactions 
          contributions={contributions}
          activeNetwork={activeNetwork}
          onNetworkChange={handleNetworkChange}
        />}
        {activeTab === 'reports' && <PresaleReports 
          activeNetwork={activeNetwork}
          onNetworkChange={handleNetworkChange}
        />}
      </div>

      {/* Stage Management Dialogs */}
      {isCreateStageOpen && (
        <StageDialog
          isOpen={isCreateStageOpen}
          onOpenChange={setIsCreateStageOpen}
          onSubmit={(data) => handleStageSubmit(data, false)}
          existingStages={stages}
          isEdit={false}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          fetchStages={fetchStages}
          stagesLength={stages.length}
          activeNetwork={activeNetwork}
          editingStage={null}
        />
      )}
      {isEditStageOpen && selectedStage && (
        <StageDialog
          isOpen={isEditStageOpen}
          onOpenChange={setIsEditStageOpen}
          onSubmit={(data) => handleStageSubmit(data, true)}
          existingStages={stages}
          isEdit={true}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          fetchStages={fetchStages}
          stagesLength={stages.length}
          activeNetwork={activeNetwork}
          editingStage={selectedStage}
        />
      )}
      {isDeleteStageOpen && selectedStage && (
        <DeleteStageDialog
          isOpen={isDeleteStageOpen}
          onOpenChange={setIsDeleteStageOpen}
          onDelete={handleDeleteStage}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          fetchStages={fetchStages}
          editingStage={selectedStage}
        />
      )}
    </div>
  );
};

export default AdminTokenPresale;
