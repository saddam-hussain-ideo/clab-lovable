import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { QuizCategory, QuizQuestion } from "@/lib/types/quiz";
import { Loader2, Plus, Pencil, Trash2, Filter, Search, X } from "lucide-react";
import { QuizCategoryBadge } from "./QuizCategoryBadge";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const QuizQuestionManager = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<QuizCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [formData, setFormData] = useState({
    text: "",
    category: "bitcoin_history" as QuizCategory,
    options: ["", "", "", ""],
    correct_option: 0
  });
  
  const { toast } = useToast();

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('quiz_questions')
        .select('*');
      
      if (filter) {
        query = query.eq('category', filter);
      }
      
      if (searchQuery) {
        query = query.ilike('text', `%${searchQuery}%`);
      }
      
      query = query.order('id', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setQuestions(data || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error",
        description: "Failed to load quiz questions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchQuestions();
  }, [filter, searchQuery]);

  const handleAddQuestion = () => {
    setCurrentQuestion(null);
    setFormData({
      text: "",
      category: "bitcoin_history",
      options: ["", "", "", ""],
      correct_option: 0
    });
    setEditDialogOpen(true);
  };
  
  const handleEditQuestion = (question: QuizQuestion) => {
    setCurrentQuestion(question);
    setFormData({
      text: question.text,
      category: question.category,
      options: Array.isArray(question.options) 
        ? question.options 
        : typeof question.options === 'object' && question.options !== null 
          ? Object.values(question.options) 
          : ["", "", "", ""],
      correct_option: question.correct_option
    });
    setEditDialogOpen(true);
  };
  
  const handleDeleteQuestion = (question: QuizQuestion) => {
    setCurrentQuestion(question);
    setDeleteDialogOpen(true);
  };
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };
  
  const saveQuestion = async () => {
    try {
      if (!formData.text.trim()) {
        toast({
          title: "Error",
          description: "Question text is required",
          variant: "destructive",
        });
        return;
      }
      
      const emptyOptions = formData.options.filter(opt => !opt.trim()).length;
      if (emptyOptions > 0) {
        toast({
          title: "Error",
          description: "All options must be filled",
          variant: "destructive",
        });
        return;
      }
      
      const processedOptions = formData.options;
      
      if (currentQuestion) {
        const { error } = await supabase
          .from('quiz_questions')
          .update({
            text: formData.text,
            category: formData.category,
            options: processedOptions,
            correct_option: formData.correct_option
          })
          .eq('id', currentQuestion.id);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Question updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('quiz_questions')
          .insert({
            text: formData.text,
            category: formData.category,
            options: processedOptions,
            correct_option: formData.correct_option
          });
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "New question added successfully",
        });
      }
      
      setEditDialogOpen(false);
      fetchQuestions();
    } catch (error) {
      console.error("Error saving question:", error);
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive",
      });
    }
  };
  
  const confirmDelete = async () => {
    if (!currentQuestion) return;
    
    try {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', currentQuestion.id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      
      setDeleteDialogOpen(false);
      fetchQuestions();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };
  
  const clearFilters = () => {
    setFilter(null);
    setSearchQuery("");
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Quiz Questions</CardTitle>
            <CardDescription>
              Manage quiz questions across different categories
            </CardDescription>
          </div>
          <Button onClick={handleAddQuestion}>
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 mb-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex w-full sm:w-auto space-x-2">
              <div className="flex items-center space-x-2">
                <Select 
                  value={filter || "all"}
                  onValueChange={(value) => setFilter(value === "all" ? null : value as QuizCategory)}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="All categories" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    <SelectItem value="satoshi">Satoshi</SelectItem>
                    <SelectItem value="bitcoin_history">Bitcoin History</SelectItem>
                    <SelectItem value="ethereum_history">Ethereum History</SelectItem>
                    <SelectItem value="altcoins">Altcoins</SelectItem>
                    <SelectItem value="defi">DeFi</SelectItem>
                    <SelectItem value="web3">Web3</SelectItem>
                    <SelectItem value="crypto_news">Crypto News</SelectItem>
                    <SelectItem value="crypto_personalities">Crypto Personalities</SelectItem>
                    <SelectItem value="degenerates">Degenerates</SelectItem>
                  </SelectContent>
                </Select>
                {(filter || searchQuery) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <Badge variant="outline" className="text-xs">
              {questions.length} question{questions.length !== 1 ? 's' : ''} found
            </Badge>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Question</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No questions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    questions.map((question) => (
                      <TableRow key={question.id}>
                        <TableCell className="font-medium">{question.text}</TableCell>
                        <TableCell>
                          <QuizCategoryBadge category={question.category} />
                        </TableCell>
                        <TableCell>
                          {Array.isArray(question.options) 
                            ? question.options.length 
                            : typeof question.options === 'object' && question.options !== null 
                              ? Object.keys(question.options).length
                              : 0} options
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mr-2"
                            onClick={() => handleEditQuestion(question)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {currentQuestion ? "Edit Question" : "Add New Question"}
            </DialogTitle>
            <DialogDescription>
              {currentQuestion 
                ? "Update the details for this quiz question" 
                : "Create a new quiz question with multiple-choice options"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="question-text">Question</Label>
              <Textarea
                id="question-text"
                placeholder="Enter question text..."
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as QuizCategory })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="satoshi">Satoshi</SelectItem>
                  <SelectItem value="bitcoin_history">Bitcoin History</SelectItem>
                  <SelectItem value="ethereum_history">Ethereum History</SelectItem>
                  <SelectItem value="altcoins">Altcoins</SelectItem>
                  <SelectItem value="defi">DeFi</SelectItem>
                  <SelectItem value="web3">Web3</SelectItem>
                  <SelectItem value="crypto_news">Crypto News</SelectItem>
                  <SelectItem value="crypto_personalities">Crypto Personalities</SelectItem>
                  <SelectItem value="degenerates">Degenerates</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-4">
              <Label>Options (mark the correct answer)</Label>
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                  />
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`option-${index}`}
                      name="correct-option"
                      checked={formData.correct_option === index}
                      onChange={() => setFormData({ ...formData, correct_option: index })}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <Label htmlFor={`option-${index}`} className="ml-2 text-sm">
                      Correct
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveQuestion}>
              {currentQuestion ? "Save Changes" : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the question. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
