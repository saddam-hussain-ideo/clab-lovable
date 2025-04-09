
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const BlogPosts = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Blog Post Management</CardTitle>
        <CardDescription>Manage your blog posts.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-zinc-300">Blog post management functionality will be implemented here.</p>
      </CardContent>
    </Card>
  );
};

export default BlogPosts;
