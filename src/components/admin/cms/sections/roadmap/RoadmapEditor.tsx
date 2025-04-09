
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Save, Plus, Trash2, X, CheckCircle2, Clock, Rocket } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { createEmptyPhase, STATUS_OPTIONS } from "./utils";
import { RoadmapContent, RoadmapPhase } from "@/lib/types/cms";
import { useToast } from "@/hooks/use-toast";

interface RoadmapEditorProps {
  content?: any;
  onSave?: () => void;
}

export const RoadmapEditor = ({ content, onSave }: RoadmapEditorProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("vision");
  const [vision, setVision] = useState<string>("");
  const [phases, setPhases] = useState<RoadmapPhase[]>([]);
  const [editingPhaseIndex, setEditingPhaseIndex] = useState<number>(-1);
  const [tempPhase, setTempPhase] = useState<RoadmapPhase | null>(null);

  useEffect(() => {
    if (content?.content) {
      // Initialize with existing content
      setVision(content.content.vision || "");
      
      if (Array.isArray(content.content.phases)) {
        setPhases(content.content.phases);
      }
    }
  }, [content]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatedContent = {
        vision,
        phases
      };

      const { error } = await supabase
        .from("page_content")
        .update({ content: updatedContent })
        .eq("page_id", "roadmap")
        .eq("section_id", "main");

      if (error) throw error;

      toast({
        title: "Success",
        description: "Roadmap content has been updated",
      });
      
      if (onSave) onSave();
    } catch (error) {
      console.error("Error saving roadmap content:", error);
      toast({
        title: "Error",
        description: "Failed to save roadmap content",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPhase = () => {
    const newPhase = createEmptyPhase();
    setTempPhase(newPhase);
    setEditingPhaseIndex(phases.length);
  };

  const handleEditPhase = (index: number) => {
    setTempPhase({...phases[index]});
    setEditingPhaseIndex(index);
  };

  const handleSavePhase = () => {
    if (tempPhase) {
      const newPhases = [...phases];
      if (editingPhaseIndex >= 0 && editingPhaseIndex < phases.length) {
        newPhases[editingPhaseIndex] = tempPhase;
      } else {
        newPhases.push(tempPhase);
      }
      setPhases(newPhases);
      setTempPhase(null);
      setEditingPhaseIndex(-1);
    }
  };

  const handleCancelPhaseEdit = () => {
    setTempPhase(null);
    setEditingPhaseIndex(-1);
  };

  const handleDeletePhase = (index: number) => {
    const newPhases = [...phases];
    newPhases.splice(index, 1);
    setPhases(newPhases);
  };

  const handleUpdatePhaseItems = (items: string[], index: number) => {
    const newPhases = [...phases];
    newPhases[index].items = items;
    setPhases(newPhases);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case "upcoming":
        return <Rocket className="h-4 w-4 text-blue-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-2 border-b border-zinc-700 pb-2">
        <Button
          variant={activeTab === "vision" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("vision")}
        >
          Vision
        </Button>
        <Button
          variant={activeTab === "phases" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("phases")}
        >
          Phases
        </Button>
      </div>

      {activeTab === "vision" && (
        <div className="space-y-4">
          <Label htmlFor="vision">Roadmap Vision</Label>
          <Textarea
            id="vision"
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            placeholder="Enter your roadmap vision statement"
            rows={6}
          />
        </div>
      )}

      {activeTab === "phases" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Roadmap Phases</h3>
            <Button 
              onClick={handleAddPhase} 
              size="sm" 
              variant="outline"
              disabled={tempPhase !== null}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Phase
            </Button>
          </div>

          {tempPhase && (
            <Card className="border-dashed border-zinc-700">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="phase-name">Phase Name</Label>
                    <Input
                      id="phase-name"
                      value={tempPhase.name}
                      onChange={(e) => setTempPhase({...tempPhase, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phase-id">Phase ID</Label>
                    <Input
                      id="phase-id"
                      value={tempPhase.id}
                      onChange={(e) => setTempPhase({...tempPhase, id: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phase-description">Description</Label>
                    <Textarea
                      id="phase-description"
                      value={tempPhase.description}
                      onChange={(e) => setTempPhase({...tempPhase, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phase-status">Status</Label>
                    <Select 
                      value={tempPhase.status} 
                      onValueChange={(value) => 
                        setTempPhase({
                          ...tempPhase, 
                          status: value as 'completed' | 'in-progress' | 'upcoming'
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(option.value)}
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Items</Label>
                    <div className="space-y-2 mt-2">
                      {tempPhase.items.map((item, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            value={item}
                            onChange={(e) => {
                              const updatedItems = [...tempPhase.items];
                              updatedItems[idx] = e.target.value;
                              setTempPhase({...tempPhase, items: updatedItems});
                            }}
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              const filteredItems = tempPhase.items.filter((_, i) => i !== idx);
                              setTempPhase({...tempPhase, items: filteredItems});
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTempPhase({...tempPhase, items: [...tempPhase.items, '']})}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Item
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={handleCancelPhaseEdit}>
                      Cancel
                    </Button>
                    <Button onClick={handleSavePhase}>
                      Save Phase
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {phases.map((phase, index) => (
              <Card key={phase.id || index} className="border-zinc-800">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-lg font-medium flex items-center gap-2">
                        {getStatusIcon(phase.status)}
                        {phase.name}
                      </div>
                      <div className="text-zinc-400 text-sm">ID: {phase.id}</div>
                      <div className="mt-2 text-sm">{phase.description}</div>
                      {phase.items.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-semibold mb-1">Items:</h4>
                          <ul className="text-sm space-y-1">
                            {phase.items.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-purple-400">•</span> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPhase(index)}
                        disabled={tempPhase !== null}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePhase(index)}
                        disabled={tempPhase !== null}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isLoading}
        >
          <Save className="h-4 w-4 mr-2" /> Save Roadmap
        </Button>
      </div>
    </div>
  );
};
