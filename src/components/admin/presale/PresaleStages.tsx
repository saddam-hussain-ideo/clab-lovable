
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { MoreHorizontal, Plus, Edit, Trash2, AlertCircle, Check, DollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface PresaleStagesProps {
  stages: any[];
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  fetchStages: () => void;
  openCreateStageDialog: () => void;
  openEditStageDialog: (stage: any) => void;
  openDeleteStageDialog: (stage: any) => void;
  activeNetwork: string;
}

export const PresaleStages = ({
  stages,
  isLoading,
  setIsLoading,
  fetchStages,
  openCreateStageDialog,
  openEditStageDialog,
  openDeleteStageDialog,
  activeNetwork
}: PresaleStagesProps) => {
  
  const toggleActiveStage = async (stageId: number, isCurrentlyActive: boolean) => {
    try {
      setIsLoading(true);
      
      // First deactivate all stages if we're activating a new one
      if (!isCurrentlyActive) {
        await supabase
          .from('presale_stages')
          .update({ is_active: false })
          .eq('network', activeNetwork);
      }
      
      // Then update the selected stage
      const { error } = await supabase
        .from('presale_stages')
        .update({ is_active: !isCurrentlyActive })
        .eq('id', stageId);
      
      if (error) throw error;
      
      toast.success(isCurrentlyActive ? "Stage Deactivated" : "Stage Activated", {
        description: `The stage has been ${isCurrentlyActive ? 'deactivated' : 'activated'} successfully.`
      });
      
      fetchStages();
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to update stage status."
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatSolAmount = (amount: number | null): string => {
    if (amount === null || isNaN(Number(amount))) return '—';
    return Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };
  
  const formatUsdAmount = (amount: number | null): string => {
    if (amount === null || isNaN(Number(amount))) return '—';
    return `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Presale Stages</h3>
        <Button 
          onClick={openCreateStageDialog} 
          className="flex items-center"
          size="sm"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Stage
        </Button>
      </div>
      
      {stages.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center border border-dashed rounded-md p-8">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium">No stages found</h3>
                <p className="text-sm text-gray-500 mb-4">There are no presale stages configured yet.</p>
                <Button onClick={openCreateStageDialog} disabled={isLoading}>
                  Create First Stage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {stages.sort((a, b) => a.order_number - b.order_number).map((stage) => (
            <Card key={stage.id} className={`${stage.is_active ? 'border-green-500' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center text-lg">
                      {stage.name}
                      {stage.is_active && (
                        <Badge variant="success" className="ml-2">Active</Badge>
                      )}
                      {!stage.is_published && (
                        <Badge variant="outline" className="ml-2 text-gray-500">Hidden</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>#{stage.order_number} {stage.description && `— ${stage.description}`}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Stage Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openEditStageDialog(stage)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Stage
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleActiveStage(stage.id, stage.is_active)}>
                        {stage.is_active ? (
                          <>
                            <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                            Deactivate Stage
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            Activate Stage
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => openDeleteStageDialog(stage)}
                        className="text-red-500 focus:bg-red-50 focus:text-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Stage
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-500">Token Price (SOL)</span>
                    <span className="font-medium">{formatSolAmount(stage.token_price)} SOL</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 flex items-center">
                      <DollarSign className="h-3.5 w-3.5 mr-0.5 text-green-500" />
                      Token Price (USD)
                    </span>
                    <span className="font-medium">{formatUsdAmount(stage.token_price_usd)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500">Start Date</span>
                    <span>{formatDate(stage.start_date)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500">End Date</span>
                    <span>{formatDate(stage.end_date)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500">Target (SOL)</span>
                    <span>{formatSolAmount(stage.target_amount)} SOL</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 flex items-center">
                      <DollarSign className="h-3.5 w-3.5 mr-0.5 text-green-500" />
                      Target (USD)
                    </span>
                    <span>{formatUsdAmount(stage.target_amount_usd)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Published</span>
                  <Switch
                    checked={stage.is_published}
                    onCheckedChange={async (checked) => {
                      try {
                        setIsLoading(true);
                        const { error } = await supabase
                          .from('presale_stages')
                          .update({ is_published: checked })
                          .eq('id', stage.id);
                        
                        if (error) throw error;
                        
                        toast.success("Stage Updated", {
                          description: `The stage is now ${checked ? 'published' : 'hidden'}.`
                        });
                        
                        fetchStages();
                      } catch (error: any) {
                        toast.error("Error", {
                          description: error.message || "Failed to update stage visibility."
                        });
                        console.error(error);
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openEditStageDialog(stage)}
                  disabled={isLoading}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
