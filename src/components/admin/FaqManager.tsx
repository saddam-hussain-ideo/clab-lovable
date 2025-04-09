import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Save, X, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  order: number;
  is_active: boolean;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  description: string | null;
  order: number;
  is_active: boolean;
}

export const FaqManager: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("faqs");
  
  // FAQ form state
  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [newFaq, setNewFaq] = useState({
    question: "",
    answer: "",
    category: "",
    is_active: true
  });
  
  // Category form state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    is_active: true
  });

  useEffect(() => {
    fetchFaqs();
    fetchCategories();
  }, []);

  const fetchFaqs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('order', { ascending: true });
      
      if (error) throw error;
      setFaqs(data || []);
    } catch (error: any) {
      console.error('Error fetching FAQs:', error.message);
      toast.error('Failed to load FAQs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_categories')
        .select('*')
        .order('order', { ascending: true });
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching FAQ categories:', error.message);
      toast.error('Failed to load FAQ categories');
    }
  };

  const handleAddFaq = async () => {
    try {
      if (!newFaq.question || !newFaq.answer || !newFaq.category) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Get the highest order value to place the new FAQ at the end
      const maxOrder = faqs.length > 0 
        ? Math.max(...faqs.map(faq => faq.order)) 
        : 0;
      
      const { data, error } = await supabase
        .from('faqs')
        .insert([
          { 
            question: newFaq.question, 
            answer: newFaq.answer, 
            category: newFaq.category,
            is_active: newFaq.is_active,
            order: maxOrder + 1
          }
        ])
        .select();
      
      if (error) throw error;
      
      toast.success('FAQ added successfully');
      setFaqs([...faqs, data[0]]);
      setIsAddingFaq(false);
      setNewFaq({
        question: "",
        answer: "",
        category: "",
        is_active: true
      });
    } catch (error: any) {
      console.error('Error adding FAQ:', error.message);
      toast.error('Failed to add FAQ');
    }
  };

  const handleUpdateFaq = async () => {
    try {
      if (!editingFaq) return;
      
      const { data, error } = await supabase
        .from('faqs')
        .update({ 
          question: editingFaq.question, 
          answer: editingFaq.answer, 
          category: editingFaq.category,
          is_active: editingFaq.is_active
        })
        .eq('id', editingFaq.id)
        .select();
      
      if (error) throw error;
      
      setFaqs(faqs.map(faq => faq.id === editingFaq.id ? data[0] : faq));
      setEditingFaq(null);
      toast.success('FAQ updated successfully');
    } catch (error: any) {
      console.error('Error updating FAQ:', error.message);
      toast.error('Failed to update FAQ');
    }
  };

  const handleDeleteFaq = async (id: number) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setFaqs(faqs.filter(faq => faq.id !== id));
      toast.success('FAQ deleted successfully');
    } catch (error: any) {
      console.error('Error deleting FAQ:', error.message);
      toast.error('Failed to delete FAQ');
    }
  };

  const handleAddCategory = async () => {
    try {
      if (!newCategory.name) {
        toast.error('Category name is required');
        return;
      }

      // Get the highest order value to place the new category at the end
      const maxOrder = categories.length > 0 
        ? Math.max(...categories.map(cat => cat.order)) 
        : 0;
      
      const { data, error } = await supabase
        .from('faq_categories')
        .insert([
          { 
            name: newCategory.name, 
            description: newCategory.description || null,
            is_active: newCategory.is_active,
            order: maxOrder + 1
          }
        ])
        .select();
      
      if (error) throw error;
      
      toast.success('Category added successfully');
      setCategories([...categories, data[0]]);
      setIsAddingCategory(false);
      setNewCategory({
        name: "",
        description: "",
        is_active: true
      });
    } catch (error: any) {
      console.error('Error adding category:', error.message);
      toast.error('Failed to add category');
    }
  };

  const handleUpdateCategory = async () => {
    try {
      if (!editingCategory) return;
      
      const { data, error } = await supabase
        .from('faq_categories')
        .update({ 
          name: editingCategory.name, 
          description: editingCategory.description,
          is_active: editingCategory.is_active
        })
        .eq('id', editingCategory.id)
        .select();
      
      if (error) throw error;
      
      setCategories(categories.map(cat => cat.id === editingCategory.id ? data[0] : cat));
      setEditingCategory(null);
      toast.success('Category updated successfully');
    } catch (error: any) {
      console.error('Error updating category:', error.message);
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      // Check if there are FAQs using this category
      const faqsWithCategory = faqs.filter(faq => faq.category === categories.find(c => c.id === id)?.name);
      
      if (faqsWithCategory.length > 0) {
        toast.error(`Cannot delete category. ${faqsWithCategory.length} FAQs are using this category.`);
        return;
      }
      
      const { error } = await supabase
        .from('faq_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setCategories(categories.filter(cat => cat.id !== id));
      toast.success('Category deleted successfully');
    } catch (error: any) {
      console.error('Error deleting category:', error.message);
      toast.error('Failed to delete category');
    }
  };

  const handleMoveItem = async (type: 'faq' | 'category', id: number, direction: 'up' | 'down') => {
    try {
      if (type === 'faq') {
        const currentIndex = faqs.findIndex(faq => faq.id === id);
        if (
          (direction === 'up' && currentIndex === 0) || 
          (direction === 'down' && currentIndex === faqs.length - 1)
        ) {
          return; // Already at the top/bottom
        }
        
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const targetFaq = faqs[targetIndex];
        const currentFaq = faqs[currentIndex];
        
        // Swap orders in database
        const batch = [];
        batch.push(
          supabase
            .from('faqs')
            .update({ order: targetFaq.order })
            .eq('id', currentFaq.id)
        );
        
        batch.push(
          supabase
            .from('faqs')
            .update({ order: currentFaq.order })
            .eq('id', targetFaq.id)
        );
        
        await Promise.all(batch);
        
        // Update local state
        const newFaqs = [...faqs];
        [newFaqs[currentIndex], newFaqs[targetIndex]] = [newFaqs[targetIndex], newFaqs[currentIndex]];
        // Update the order properties
        newFaqs[currentIndex].order = currentIndex + 1;
        newFaqs[targetIndex].order = targetIndex + 1;
        setFaqs(newFaqs);
      } else {
        const currentIndex = categories.findIndex(cat => cat.id === id);
        if (
          (direction === 'up' && currentIndex === 0) || 
          (direction === 'down' && currentIndex === categories.length - 1)
        ) {
          return; // Already at the top/bottom
        }
        
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const targetCategory = categories[targetIndex];
        const currentCategory = categories[currentIndex];
        
        // Swap orders in database
        const batch = [];
        batch.push(
          supabase
            .from('faq_categories')
            .update({ order: targetCategory.order })
            .eq('id', currentCategory.id)
        );
        
        batch.push(
          supabase
            .from('faq_categories')
            .update({ order: currentCategory.order })
            .eq('id', targetCategory.id)
        );
        
        await Promise.all(batch);
        
        // Update local state
        const newCategories = [...categories];
        [newCategories[currentIndex], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[currentIndex]];
        // Update the order properties
        newCategories[currentIndex].order = currentIndex + 1;
        newCategories[targetIndex].order = targetIndex + 1;
        setCategories(newCategories);
      }
    } catch (error: any) {
      console.error(`Error moving ${type}:`, error.message);
      toast.error(`Failed to reorder ${type}`);
    }
  };

  const toggleFaqActive = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      setFaqs(faqs.map(faq => 
        faq.id === id ? { ...faq, is_active: !currentStatus } : faq
      ));
      
      toast.success(`FAQ ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Error toggling FAQ status:', error.message);
      toast.error('Failed to update FAQ status');
    }
  };

  const toggleCategoryActive = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('faq_categories')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      setCategories(categories.map(cat => 
        cat.id === id ? { ...cat, is_active: !currentStatus } : cat
      ));
      
      toast.success(`Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Error toggling category status:', error.message);
      toast.error('Failed to update category status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">FAQ Management</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="faqs" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">Manage FAQs</h3>
            <Dialog open={isAddingFaq} onOpenChange={setIsAddingFaq}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus size={16} />
                  Add FAQ
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New FAQ</DialogTitle>
                  <DialogDescription>
                    Create a new frequently asked question and answer.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="question">Question</Label>
                    <Input
                      id="question"
                      placeholder="Enter the question"
                      value={newFaq.question}
                      onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="answer">Answer</Label>
                    <Textarea
                      id="answer"
                      placeholder="Enter the answer"
                      value={newFaq.answer}
                      onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={newFaq.category} 
                      onValueChange={(value) => setNewFaq({ ...newFaq, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-active"
                      checked={newFaq.is_active}
                      onCheckedChange={(checked) => setNewFaq({ ...newFaq, is_active: checked })}
                    />
                    <Label htmlFor="is-active">Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingFaq(false)}>Cancel</Button>
                  <Button onClick={handleAddFaq}>Add FAQ</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Order</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="text-right w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faqs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No FAQs found. Add your first FAQ.
                      </TableCell>
                    </TableRow>
                  ) : (
                    faqs.map((faq) => (
                      <TableRow key={faq.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => handleMoveItem('faq', faq.id, 'up')}
                              disabled={faqs.indexOf(faq) === 0}
                            >
                              <ChevronUp size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => handleMoveItem('faq', faq.id, 'down')}
                              disabled={faqs.indexOf(faq) === faqs.length - 1}
                            >
                              <ChevronDown size={16} />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{faq.question}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[300px]">
                            {faq.answer}
                          </div>
                        </TableCell>
                        <TableCell>{faq.category}</TableCell>
                        <TableCell>
                          <Badge variant={faq.is_active ? "success" : "secondary"}>
                            {faq.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleFaqActive(faq.id, faq.is_active)}
                              title={faq.is_active ? "Deactivate" : "Activate"}
                            >
                              <Switch checked={faq.is_active} />
                            </Button>
                            <Dialog open={editingFaq?.id === faq.id} onOpenChange={(open) => !open && setEditingFaq(null)}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingFaq(faq)}
                                >
                                  <Pencil size={16} />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit FAQ</DialogTitle>
                                  <DialogDescription>
                                    Update this frequently asked question and answer.
                                  </DialogDescription>
                                </DialogHeader>
                                {editingFaq && (
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-question">Question</Label>
                                      <Input
                                        id="edit-question"
                                        placeholder="Enter the question"
                                        value={editingFaq.question}
                                        onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-answer">Answer</Label>
                                      <Textarea
                                        id="edit-answer"
                                        placeholder="Enter the answer"
                                        value={editingFaq.answer}
                                        onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                                        rows={5}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-category">Category</Label>
                                      <Select 
                                        value={editingFaq.category} 
                                        onValueChange={(value) => setEditingFaq({ ...editingFaq, category: value })}
                                      >
                                        <SelectTrigger id="edit-category">
                                          <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.name}>
                                              {category.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        id="edit-is-active"
                                        checked={editingFaq.is_active}
                                        onCheckedChange={(checked) => setEditingFaq({ ...editingFaq, is_active: checked })}
                                      />
                                      <Label htmlFor="edit-is-active">Active</Label>
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setEditingFaq(null)}>Cancel</Button>
                                  <Button onClick={handleUpdateFaq}>Save Changes</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the FAQ.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() => handleDeleteFaq(faq.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">Manage Categories</h3>
            <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus size={16} />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                  <DialogDescription>
                    Create a new category for organizing FAQs.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter category name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter category description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="category-is-active"
                      checked={newCategory.is_active}
                      onCheckedChange={(checked) => setNewCategory({ ...newCategory, is_active: checked })}
                    />
                    <Label htmlFor="category-is-active">Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingCategory(false)}>Cancel</Button>
                  <Button onClick={handleAddCategory}>Add Category</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Order</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="text-right w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No categories found. Add your first category.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => handleMoveItem('category', category.id, 'up')}
                              disabled={categories.indexOf(category) === 0}
                            >
                              <ChevronUp size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => handleMoveItem('category', category.id, 'down')}
                              disabled={categories.indexOf(category) === categories.length - 1}
                            >
                              <ChevronDown size={16} />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{category.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500 truncate max-w-[300px]">
                            {category.description || "No description"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={category.is_active ? "success" : "secondary"}>
                            {category.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleCategoryActive(category.id, category.is_active)}
                              title={category.is_active ? "Deactivate" : "Activate"}
                            >
                              <Switch checked={category.is_active} />
                            </Button>
                            <Dialog open={editingCategory?.id === category.id} onOpenChange={(open) => !open && setEditingCategory(null)}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingCategory(category)}
                                >
                                  <Pencil size={16} />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Category</DialogTitle>
                                  <DialogDescription>
                                    Update this FAQ category.
                                  </DialogDescription>
                                </DialogHeader>
                                {editingCategory && (
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-name">Name</Label>
                                      <Input
                                        id="edit-name"
                                        placeholder="Enter category name"
                                        value={editingCategory.name}
                                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-description">Description (optional)</Label>
                                      <Textarea
                                        id="edit-description"
                                        placeholder="Enter category description"
                                        value={editingCategory.description || ""}
                                        onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                                      />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        id="edit-category-is-active"
                                        checked={editingCategory.is_active}
                                        onCheckedChange={(checked) => setEditingCategory({ ...editingCategory, is_active: checked })}
                                      />
                                      <Label htmlFor="edit-category-is-active">Active</Label>
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
                                  <Button onClick={handleUpdateCategory}>Save Changes</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the category.
                                    Any FAQs using this category will need to be reassigned.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() => handleDeleteCategory(category.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
