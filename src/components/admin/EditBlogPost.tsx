
import React from 'react';
import { useParams } from 'react-router-dom';

const EditBlogPost = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Blog Post</h1>
      <p className="text-gray-400">Editing post ID: {id}</p>
      
      <div className="bg-zinc-800 p-6 rounded-md">
        <p className="text-gray-300">Blog post editing form will be implemented here.</p>
      </div>
    </div>
  );
};

export default EditBlogPost;
