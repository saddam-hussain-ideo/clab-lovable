import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarRange, Code, Loader2, Plus, Save, Trash2 } from "lucide-react";
import type { PageContent, RoadmapContent as RoadmapContentType, RoadmapPhase } from "@/lib/types/cms";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { createEmptyPhase, isRoadmapContent, STATUS_OPTIONS } from "./utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommandLineEditor } from "@/components/admin/CommandLineEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SimpleRichTextEditor } from "./SimpleRichTextEditor";

interface RoadmapContentProps {
  content: PageContent | undefined;
  formatDate: (date: string) => string;
}

const defaultRoadmapContent: RoadmapContentType = {
  phases: [
    {
      id: "phase1",
      name: "Phase 1: Foundation",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam at purus ac ligula efficitur varius. Maecenas non lacinia lectus. Proin at nisi arcu. Sed egestas ligula eu magna vestibulum, id finibus massa accumsan.",
      htmlDescription: "<h3>Foundation Phase</h3><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam at purus ac ligula efficitur varius. Maecenas non lacinia lectus. Proin at nisi arcu. Sed egestas ligula eu magna vestibulum, id finibus massa accumsan.</p><ul><li>Build core infrastructure</li><li>Establish community foundation</li><li>Initial token distribution</li></ul>",
      status: "completed",
      items: [
        "Build core infrastructure", 
        "Establish community foundation", 
        "Initial token distribution"
      ]
    },
    {
      id: "phase2",
      name: "Phase 2: Growth",
      description: "Fusce porta nulla in diam venenatis, sed efficitur metus facilisis. Nulla facilisi. Aenean at aliquam dui. Donec id convallis nulla, non tempor mi. Sed ac mi vitae mi tristique lobortis.",
      htmlDescription: "<h3>Growth Phase</h3><p>Fusce porta nulla in diam venenatis, sed efficitur metus facilisis. Nulla facilisi. Aenean at aliquam dui. Donec id convallis nulla, non tempor mi. Sed ac mi vitae mi tristique lobortis.</p><ul><li>Exchange listings</li><li>Partnership development</li><li>Marketing expansion</li></ul>",
      status: "in-progress",
      items: [
        "Exchange listings", 
        "Partnership development", 
        "Marketing expansion"
      ]
    },
    {
      id: "phase3",
      name: "Phase 3: Expansion",
      description: "Duis sodales enim eget nulla feugiat, quis molestie enim tincidunt. Curabitur in aliquam nulla. Maecenas eu finibus elit. Nulla non dapibus turpis, a scelerisque neque.",
      htmlDescription: "<h3>Expansion Phase</h3><p>Duis sodales enim eget nulla feugiat, quis molestie enim tincidunt. Curabitur in aliquam nulla. Maecenas eu finibus elit. Nulla non dapibus turpis, a scelerisque neque.</p><ul><li>Platform development</li><li>New ecosystem features</li><li>Cross-chain integration</li></ul>",
      status: "upcoming",
      items: [
        "Platform development", 
        "New ecosystem features", 
        "Cross-chain integration"
      ]
    },
    {
      id: "phase4",
      name: "Phase 4: Maturity",
      description: "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Sed feugiat ligula vel ullamcorper auctor. Duis molestie arcu sit amet quam congue, id congue ipsum pulvinar.",
      htmlDescription: "<h3>Maturity Phase</h3><p>Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Sed feugiat ligula vel ullamcorper auctor. Duis molestie arcu sit amet quam congue, id congue ipsum pulvinar.</p><ul><li>Advanced features</li><li>Enterprise solutions</li><li>Global expansion</li></ul>",
      status: "upcoming",
      items: [
        "Advanced features", 
        "Enterprise solutions", 
        "Global expansion"
      ]
    }
  ],
  vision: "Our strategic vision is to build a comprehensive ecosystem that empowers users through educational resources, innovative tools, and a supportive community. Through careful planning and execution across multiple phases, we aim to transform the landscape of crypto education and accessibility.",
  milestones: [
    { 
      title: "Token Launch", 
      description: "Successfully launched with a secure and accessible structure.",
      status: "completed",
      icon: "CheckCircle2" 
    },
    { 
      title: "Community Growth", 
      description: "Expanded community across multiple platforms with engaged members.",
      status: "completed",
      icon: "CheckCircle2" 
    },
    { 
      title: "Learning Platform", 
      description: "Launching comprehensive education resources and tools.",
      status: "in-progress",
      icon: "Clock" 
    },
    { 
      title: "Global Expansion", 
      description: "Reaching new markets and supporting multiple languages.",
      status: "upcoming",
      icon: "Rocket" 
    },
    { 
      title: "Enterprise Solutions", 
      description: "Developing advanced features for institutional users.",
      status: "upcoming",
      icon: "Target" 
    }
  ]
};

export const RoadmapContent = ({ content, formatDate }: RoadmapContentProps) => {
  const [activeTab, setActiveTab] = useState<string>(() => {
    const savedTab = localStorage.getItem("roadmap-cms-active-tab");
    return savedTab || "phases";
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRaw, setEditingRaw] = useState(false);
  const [phases, setPhases] = useState<RoadmapPhase[]>(() => {
    const roadmapContent = isRoadmapContent(content?.content) ? content?.content : null;
    return Array.isArray(roadmapContent?.phases) ? roadmapContent.phases : [];
  });
  const [editingPhaseIndex, setEditingPhaseIndex] = useState<number | null>(null);
  const [editingPhase, setEditingPhase] = useState<RoadmapPhase | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem("roadmap-cms-active-tab", activeTab);
  }, [activeTab]);
  
  useEffect(() => {
    const hasContent = isRoadmapContent(content?.content) && 
                       content.content.phases && 
                       content.content.phases.length > 0;
    
    if (!hasContent) {
      handlePopulateDefaultContent();
    }
  }, [content]);

  const roadmapContent = isRoadmapContent(content?.content) ? content?.content : {
    phases: [],
    vision: ''
  } as RoadmapContentType;

  const handleSubmit = async (editorContent: string) => {
    setIsSubmitting(true);

    try {
      const existingContent = isRoadmapContent(content?.content) ? content.content : { 
        phases: []
      };

      const updatedContent = {
        ...existingContent,
        body: editorContent
      };

      const { error: updateError } = await supabase
        .from("page_content")
        .update({
          content: updatedContent
        })
        .eq('page_id', 'roadmap')
        .eq('section_id', 'main');

      if (updateError) {
        const { error: insertError } = await supabase
          .from("page_content")
          .insert({
            page_id: "roadmap",
            section_id: "main",
            content: updatedContent
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "Success",
        description: "Roadmap content has been updated",
      });
    } catch (error) {
      console.error("Error updating content:", error);
      toast({
        title: "Error",
        description: "Failed to update roadmap content",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveRawData = (updatedContent: any) => {
    toast({
      title: "Success",
      description: "Roadmap data has been updated",
    });
    setEditingRaw(false);
  };

  const handleAddPhase = () => {
    const newPhase = createEmptyPhase();
    setEditingPhase(newPhase);
    setEditingPhaseIndex(phases.length);
  };

  const handleEditPhase = (phase: RoadmapPhase, index: number) => {
    setEditingPhase({ ...phase });
    setEditingPhaseIndex(index);
  };

  const handleHtmlContentChange = (htmlContent: string) => {
    if (editingPhase) {
      setEditingPhase({
        ...editingPhase,
        htmlDescription: htmlContent
      });
    }
  };

  const handleSavePhase = async () => {
    if (editingPhase && editingPhaseIndex !== null) {
      setIsSubmitting(true);
      
      try {
        const updatedPhases = [...phases];
        
        if (editingPhaseIndex >= updatedPhases.length) {
          updatedPhases.push(editingPhase);
        } else {
          updatedPhases[editingPhaseIndex] = editingPhase;
        }
        
        setPhases(updatedPhases);
        
        const existingContent = isRoadmapContent(content?.content) ? content.content : { 
          phases: [],
          vision: roadmapContent.vision || ''
        };

        const updatedContent = {
          ...existingContent,
          phases: updatedPhases
        };

        const { error: updateError } = await supabase
          .from("page_content")
          .update({
            content: updatedContent
          })
          .eq('page_id', 'roadmap')
          .eq('section_id', 'main');

        if (updateError) {
          const { error: insertError } = await supabase
            .from("page_content")
            .insert({
              page_id: "roadmap",
              section_id: "main",
              content: updatedContent
            });

          if (insertError) throw insertError;
        }
        
        toast({
          title: "Success",
          description: "Roadmap phase has been saved",
        });
        
        setEditingPhase(null);
        setEditingPhaseIndex(null);
      } catch (error) {
        console.error("Error saving phase:", error);
        toast({
          title: "Error",
          description: "Failed to save roadmap phase",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCancelEditPhase = () => {
    setEditingPhase(null);
    setEditingPhaseIndex(null);
  };

  const handleDeletePhase = async (index: number) => {
    setIsSubmitting(true);
    
    try {
      const updatedPhases = phases.filter((_, i) => i !== index);
      setPhases(updatedPhases);
      
      const existingContent = isRoadmapContent(content?.content) ? content.content : { 
        phases: [],
        vision: roadmapContent.vision || ''
      };

      const updatedContent = {
        ...existingContent,
        phases: updatedPhases
      };

      const { error: updateError } = await supabase
        .from("page_content")
        .update({
          content: updatedContent
        })
        .eq('page_id', 'roadmap')
        .eq('section_id', 'main');

      if (updateError) {
        const { error: insertError } = await supabase
          .from("page_content")
          .insert({
            page_id: "roadmap",
            section_id: "main",
            content: updatedContent
          });

        if (insertError) throw insertError;
      }
      
      toast({
        title: "Phase Deleted",
        description: "The roadmap phase has been removed",
      });
    } catch (error) {
      console.error("Error deleting phase:", error);
      toast({
        title: "Error",
        description: "Failed to delete roadmap phase",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePopulateDefaultContent = async () => {
    setIsSubmitting(true);
    
    try {
      const { error: updateError } = await supabase
        .from("page_content")
        .update({
          content: defaultRoadmapContent
        })
        .eq('page_id', 'roadmap')
        .eq('section_id', 'main');

      if (updateError) {
        const { error: insertError } = await supabase
          .from("page_content")
          .insert({
            page_id: "roadmap",
            section_id: "main",
            content: defaultRoadmapContent
          });

        if (insertError) throw insertError;
      }
      
      setPhases(defaultRoadmapContent.phases);
      
      toast({
        title: "Default Content Added",
        description: "Roadmap has been populated with sample content",
      });
    } catch (error) {
      console.error("Error adding default content:", error);
      toast({
        title: "Error",
        description: "Failed to add default content",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const PhaseEditor = ({ phase, index }: { phase: RoadmapPhase, index: number }) => {
    const phaseIdInputId = `phase-id-${index}`;
    const phaseNameInputId = `phase-name-${index}`;
    const phaseStatusId = `phase-status-${index}`;
    const phaseHtmlDescriptionId = `phase-html-description-${index}`;
    
    return (
      <div className="space-y-4 border border-zinc-800 rounded-md p-4">
        <h4 className="text-base font-medium">Edit Phase</h4>
        
        <div className="space-y-2">
          <Label htmlFor={phaseNameInputId}>Phase Name</Label>
          <Input 
            id={phaseNameInputId}
            value={editingPhase?.name || ''} 
            onChange={(e) => {
              if (editingPhase) {
                setEditingPhase({...editingPhase, name: e.target.value});
              }
            }}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={phaseIdInputId}>Phase ID</Label>
          <Input 
            id={phaseIdInputId}
            value={editingPhase?.id || ''} 
            onChange={(e) => {
              if (editingPhase) {
                setEditingPhase({...editingPhase, id: e.target.value});
              }
            }}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={phaseHtmlDescriptionId}>Description (HTML Editor)</Label>
          <SimpleRichTextEditor
            value={editingPhase?.htmlDescription || editingPhase?.description || ''}
            onChange={handleHtmlContentChange}
            className="min-h-[200px] border border-zinc-800 rounded-md"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={phaseStatusId}>Status</Label>
          <Select 
            value={editingPhase?.status || 'upcoming'} 
            onValueChange={(value) => {
              if (editingPhase) {
                setEditingPhase({
                  ...editingPhase, 
                  status: value as 'completed' | 'in-progress' | 'upcoming'
                });
              }
            }}
          >
            <SelectTrigger id={phaseStatusId}>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCancelEditPhase}
            disabled={isSubmitting}
            type="button"
          >
            Cancel
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleSavePhase}
            disabled={isSubmitting}
            className="flex items-center gap-1"
            type="button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  const PhaseCard = ({ phase, index }: { phase: RoadmapPhase, index: number }) => (
    <div className="border border-zinc-800 rounded-md p-4 space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-base font-medium">{phase.name}</h4>
          <p className="text-sm text-muted-foreground">ID: {phase.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleEditPhase(phase, index)}
            disabled={isSubmitting}
          >
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => handleDeletePhase(index)}
            disabled={isSubmitting}
          >
            Delete
          </Button>
        </div>
      </div>
      
      <div className="bg-zinc-900 rounded p-2 text-sm">
        <p>{phase.description}</p>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xs">Status:</span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          phase.status === 'completed' ? 'bg-green-500/20 text-green-400' : 
          phase.status === 'in-progress' ? 'bg-amber-500/20 text-amber-400' : 
          'bg-blue-500/20 text-blue-400'
        }`}>
          {phase.status}
        </span>
      </div>
    </div>
  );

  return (
    <Card className="border-zinc-800 bg-zinc-950">
      <CardHeader>
        <CardTitle>Roadmap Content</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4" />
          Last updated: {content?.updated_at ? formatDate(content.updated_at) : 'Never'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="phases" className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Roadmap Phases</h3>
                <div className="flex gap-2">
                  {phases.length === 0 && (
                    <Button
                      size="sm"
                      variant="default"
                      className="flex items-center gap-1"
                      onClick={handlePopulateDefaultContent}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Add Sample Content
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex items-center gap-1"
                    onClick={handleAddPhase}
                    disabled={isSubmitting || editingPhaseIndex !== null}
                  >
                    <Plus className="h-4 w-4" /> Add Phase
                  </Button>
                </div>
              </div>
              
              {editingPhaseIndex !== null && editingPhase ? (
                <PhaseEditor phase={editingPhase} index={editingPhaseIndex} />
              ) : phases.length > 0 ? (
                <div className="space-y-4">
                  {phases.map((phase, index) => (
                    <PhaseCard key={phase.id || index} phase={phase} index={index} />
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No phases have been added yet. Click the "Add Sample Content" button to populate with example data or "Add Phase" to create your first roadmap phase.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="raw">
            {editingRaw ? (
              <CommandLineEditor
                sectionId="main"
                pageId="roadmap"
                initialContent={content?.content || { phases: [] }}
                onSave={handleSaveRawData}
                onCancel={() => setEditingRaw(false)}
              />
            ) : (
              <div className="space-y-4">
                <Button 
                  onClick={() => setEditingRaw(true)}
                  variant="outline"
                >
                  Edit Raw JSON
                </Button>
                <pre className="bg-zinc-900 p-4 rounded-md overflow-auto text-xs text-zinc-400 max-h-[400px]">
                  {JSON.stringify(content?.content || { phases: [] }, null, 2)}
                </pre>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
