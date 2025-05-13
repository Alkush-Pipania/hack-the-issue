'use client';

import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Define form schema to match backend validation
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string(),
  isbn: z.string().min(1, 'ISBN is required'),
  publicationYear: z.coerce.number().min(1000, 'Enter a valid year'),
  publisher: z.string().min(1, 'Publisher is required'),
  description: z.string().min(1, 'Description is required'),
  pageCount: z.coerce.number().min(1, 'Page count must be at least 1'),
  language: z.string().min(1, 'Language is required'),
  status: z.enum(['AVAILABLE', 'BORROWED', 'RESERVED', 'PROCESSING']),
  authorName: z.string().min(1, 'Author name is required'),
  content: z.string().min(1, 'Content description is required')
});

type FormValues = z.infer<typeof formSchema>;

export function BookForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      isbn: '',
      publicationYear: undefined as unknown as number,
      publisher: '',
      description: '',
      pageCount: undefined as unknown as number,
      language: 'English',
      status: 'AVAILABLE',
      authorName: '',
      content: ''
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication token missing. Please login again.');
        router.push('/signin');
        return;
      }

      // Make API request
      console.log('Submitting book data:', values);
      const response = await axios.post('http://localhost:4000/api/addbook', values, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Response:', response.data);

      toast.success('Book added successfully!');
      form.reset();
      
      // Optionally redirect to book list
      // router.push('/admin/books');
    } catch (error: any) {
      console.error('Error adding book:', error);
      
      if (error.response?.status === 409) {
        toast.error('Book with this ISBN already exists');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to add book. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6 rounded-xl bg-gradient-to-r from-[#004366] to-[#003152] border border-[#FF9800]/20 shadow-lg">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-[#FF9800] to-[#FF5722] bg-clip-text text-transparent">Add New Book</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Book Title" {...field} className="bg-white/10 border-[#FF9800]/20 text-white" />
                  </FormControl>
                  <FormMessage className="text-[#FF5722]" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Subtitle</FormLabel>
                  <FormControl>
                    <Input placeholder="Book Subtitle (optional)" {...field} className="bg-white/10 border-[#FF9800]/20 text-white" />
                  </FormControl>
                  <FormMessage className="text-[#FF5722]" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isbn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">ISBN</FormLabel>
                  <FormControl>
                    <Input placeholder="978-3-16-148410-0" {...field} className="bg-white/10 border-[#FF9800]/20 text-white" />
                  </FormControl>
                  <FormMessage className="text-[#FF5722]" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="publicationYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Publication Year</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="2023" 
                      {...field} 
                      className="bg-white/10 border-[#FF9800]/20 text-white"
                    />
                  </FormControl>
                  <FormMessage className="text-[#FF5722]" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="publisher"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Publisher</FormLabel>
                  <FormControl>
                    <Input placeholder="Publisher Name" {...field} className="bg-white/10 border-[#FF9800]/20 text-white" />
                  </FormControl>
                  <FormMessage className="text-[#FF5722]" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="pageCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Page Count</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="300" 
                      {...field} 
                      className="bg-white/10 border-[#FF9800]/20 text-white"
                    />
                  </FormControl>
                  <FormMessage className="text-[#FF5722]" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Language</FormLabel>
                  <FormControl>
                    <Input placeholder="English" {...field} className="bg-white/10 border-[#FF9800]/20 text-white" />
                  </FormControl>
                  <FormMessage className="text-[#FF5722]" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Status</FormLabel>
                  <FormControl>
                    <select 
                      {...field} 
                      className="w-full h-10 rounded-md border border-[#FF9800]/20 bg-white/10 px-3 py-2 text-white"
                    >
                      <option value="AVAILABLE" className="bg-[#003152]">Available</option>
                      <option value="BORROWED" className="bg-[#003152]">Borrowed</option>
                      <option value="RESERVED" className="bg-[#003152]">Reserved</option>
                      <option value="PROCESSING" className="bg-[#003152]">Processing</option>
                    </select>
                  </FormControl>
                  <FormMessage className="text-[#FF5722]" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="authorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Author Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Author Name" {...field} className="bg-white/10 border-[#FF9800]/20 text-white" />
                  </FormControl>
                  <FormMessage className="text-[#FF5722]" />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Book description..." 
                    {...field} 
                    className="min-h-20 bg-white/10 border-[#FF9800]/20 text-white" 
                  />
                </FormControl>
                <FormMessage className="text-[#FF5722]" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Content Detail</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Detailed content information..." 
                    {...field} 
                    className="min-h-32 bg-white/10 border-[#FF9800]/20 text-white" 
                  />
                </FormControl>
                <FormMessage className="text-[#FF5722]" />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#FF9800] to-[#FF5722] hover:from-[#FF5722] hover:to-[#FF9800] text-white font-bold py-2 px-4 rounded-md transition-all duration-300 ease-in-out"
          >
            {isSubmitting ? 'Adding Book...' : 'Add Book'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
