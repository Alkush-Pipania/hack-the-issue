'use client';

import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Calendar as CalendarIcon } from 'lucide-react';
import { issueBook, getUsers, getBooks } from '@/action/db';
import { format } from 'date-fns';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type User = {
  id: string;
  name: string;
  email: string;
}

type Book = {
  id: string;
  title: string;
  availableCopies: number;
}

type BookCopy = {
  id: string;
  condition: string;
}


const formSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  bookId: z.string().min(1, 'Book is required'),
  copyId: z.string().optional(),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type TransactionDetails = {
  transactionId: string;
  bookTitle: string;
  dueDate: string;
}

export const IssueBookForm: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [bookCopies, setBookCopies] = useState<BookCopy[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingCopies, setLoadingCopies] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetails | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      bookId: '',
      copyId: undefined,
      dueDate: undefined,
      notes: '',
    },
  });

  const selectedBookId = form.watch('bookId');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Authentication token missing. Please login again.');
          router.push('/signin');
          return;
        }

        // Fetch users using server action
        const result = await getUsers();

        if (result.success && result.data) {
          setUsers(result.data);
        } else {
          toast.error(result.message || 'Invalid user data format received from server');
          // Fallback to mock data if the API returns unexpected format
          setUsers([
            { id: 'user1', name: 'John Doe', email: 'john@example.com' },
            { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users. Please try again.');
        // For demo purposes, set mock data if API fails
        setUsers([
          { id: 'user1', name: 'John Doe', email: 'john@example.com' },
          { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
        ]);
      } finally {
        setLoadingUsers(false);
      }
    };

    const fetchBooks = async () => {
      setLoadingBooks(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch books using server action
        const result = await getBooks();

        if (result.success && result.data) {
          setBooks(result.data);
        } else {
          toast.error(result.message || 'Invalid book data format received from server');
          // Fallback to mock data if the API returns unexpected format
          setBooks([
            { id: 'book1', title: 'The Great Gatsby', availableCopies: 3 },
            { id: 'book2', title: 'To Kill a Mockingbird', availableCopies: 2 },
            { id: 'book3', title: '1984', availableCopies: 5 },
          ]);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
        toast.error('Failed to load books. Please try again.');
        // For demo purposes, set mock data if API fails
        setBooks([
          { id: 'book1', title: 'The Great Gatsby', availableCopies: 3 },
          { id: 'book2', title: 'To Kill a Mockingbird', availableCopies: 2 },
          { id: 'book3', title: '1984', availableCopies: 5 },
        ]);
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchUsers();
    fetchBooks();
  }, [router]);

  // Fetch book copies when a book is selected
  useEffect(() => {
    const fetchBookCopies = async () => {
      if (!selectedBookId) {
        setBookCopies([]);
        return;
      }

      setLoadingCopies(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch book details with available copies using server action
        const result = await getBooks(selectedBookId);
          
        // Check if we got successful results with copies
        if (result.success && result.data && result.data.length > 0) {
          const selectedBook = result.data.find(book => book.id === selectedBookId);
          if (selectedBook && selectedBook.copies) {
            setBookCopies(selectedBook.copies);
            return;
          }
        }

        // Fallback to mock data if no copies available
        const mockCopies = [
          { id: `copy1-${selectedBookId}`, condition: 'Good' },
          { id: `copy2-${selectedBookId}`, condition: 'Excellent' },
          { id: `copy3-${selectedBookId}`, condition: 'Fair' },
        ];

        setBookCopies(mockCopies);
      } catch (error) {
        console.error('Error fetching book copies:', error);
        toast.error('Failed to load book copies. Please try again.');
        // Mock data for demonstration
        setBookCopies([
          { id: `copy1-${selectedBookId}`, condition: 'Good' },
          { id: `copy2-${selectedBookId}`, condition: 'Excellent' },
        ]);
      } finally {
        setLoadingCopies(false);
      }
    };

    fetchBookCopies();
  }, [selectedBookId]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      // Get token from localStorage - we still check token for authentication purposes
      // even though our server action doesn't need it (it uses server-side auth)
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication token missing. Please login again.');
        router.push('/signin');
        return;
      }

      // Prepare data according to the issueBookSchema for our server action
      const data = {
        userId: values.userId,
        bookId: values.bookId,
        copyId: values.copyId || undefined, // Only send if a specific copy is selected
        dueDate: values.dueDate ? format(values.dueDate, 'yyyy-MM-dd') : undefined,
        notes: values.notes || undefined,
      };

      console.log('Submitting issue book data:', data);

      // Use server action to issue book
      const result = await issueBook(data);
        
      console.log('Server action response:', result);

      if (result.success) {
        // Successfully issued book
        toast.success(result.message || 'Book issued successfully!');
        form.reset(); // Reset the form to its default values
        
        // Show the transaction details if we have them
        if (result.data) {
          setTransactionDetails({
            transactionId: result.data.transactionId || 'N/A',
            bookTitle: result.data.bookTitle || 'N/A',
            dueDate: result.data.dueDate ? format(new Date(result.data.dueDate), 'PPP') : 'N/A',
          });
        }
      } else {
        // If we received an error response from the server action
        toast.error(result.message || 'Failed to issue book. Try again or contact support.');
      }
    } catch (error: any) {
      console.error('Error issuing book:', error);
      
      // Detailed error logging to diagnose the issue
      if (error.response) {
        // The request was made and the server responded with an error status
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        console.error('Error response data:', error.response.data);
        
        // Handle specific error cases from the backend
        if (error.response.status === 404 && error.response.data?.message?.includes('User not found')) {
          toast.error('User not found. Please select a valid user.');
        } else if (error.response.status === 404 && error.response.data?.message?.includes('Book not found')) {
          toast.error('Book not found. Please select a valid book.');
        } else if (error.response.status === 404 && error.response.data?.message?.includes('No available copies')) {
          toast.error('No available copies of this book.');
        } else if (error.response.status === 400 && error.response.data?.message?.includes('already borrowed')) {
          toast.error('The selected book copy is already borrowed.');
        } else if (error.response.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error(`Server error: ${error.response.status}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        toast.error('No response received from server. Check if the backend is running on port 4000.');
      } else if (error.message && error.message.includes('Network Error')) {
        // Handle CORS or network connectivity issues
        console.error('Network error detected - likely CORS or connectivity issue');
        toast.error('Network error. Check your connection and backend CORS settings.');
      } else {
        // Something else happened while setting up the request
        console.error('Error message:', error.message);
        toast.error(`Error: ${error.message || 'Failed to issue book. Please try again.'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-8 space-y-8 rounded-xl bg-gradient-to-r from-[#004366] to-[#003152] border border-[#FF9800]/20 shadow-xl relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FF9800]/10 to-transparent rounded-full transform translate-x-1/3 -translate-y-1/3 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#003152] to-[#004366]/30 rounded-full transform -translate-x-1/3 translate-y-1/3 blur-xl"></div>
      
      <div className="relative z-10">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-[#FF9800] to-[#FF5722] bg-clip-text text-transparent mb-2">Issue Book</h2>
        <p className="text-white/70">Complete the form below to issue a book to a library member</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-medium text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-gradient-to-r from-[#FF9800] to-[#FF5722]"></span>
                      User
                    </span>
                  </FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={loadingUsers}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white/10 border-[#FF9800]/20 text-white rounded-md hover:bg-white/20 transition-colors focus:ring-[#FF9800]/30 focus:border-[#FF9800]">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#003152] border-[#FF9800]/20 text-white">
                      {loadingUsers ? (
                        <div className="p-2 text-center text-white/70 flex items-center justify-center">
                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-[#FF9800] border-t-transparent rounded-full"></div>
                          Loading users...
                        </div>
                      ) : users.length === 0 ? (
                        <div className="p-2 text-center text-white/70">No users found</div>
                      ) : (
                        users.map(user => (
                          <SelectItem key={user.id} value={user.id} className="focus:bg-[#004366]/70 hover:bg-[#004366]/70 focus:text-white text-white/90 hover:text-white">
                            {user.name} ({user.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[#FF5722]" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bookId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-medium text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-gradient-to-r from-[#FF9800] to-[#FF5722]"></span>
                      Book
                    </span>
                  </FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={loadingBooks}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white/10 border-[#FF9800]/20 text-white rounded-md hover:bg-white/20 transition-colors focus:ring-[#FF9800]/30 focus:border-[#FF9800]">
                        <SelectValue placeholder="Select book" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#003152] border-[#FF9800]/20 text-white">
                      {loadingBooks ? (
                        <div className="p-2 text-center text-white/70 flex items-center justify-center">
                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-[#FF9800] border-t-transparent rounded-full"></div>
                          Loading books...
                        </div>
                      ) : books.length === 0 ? (
                        <div className="p-2 text-center text-white/70">No books found</div>
                      ) : (
                        books.map(book => (
                          <SelectItem key={book.id} value={book.id} className="focus:bg-[#004366]/70 hover:bg-[#004366]/70 focus:text-white text-white/90 hover:text-white">
                            {book.title} 
                            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-[#FF9800]/20 text-[#FF9800]">
                              {book.availableCopies} available
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[#FF5722]" />
                </FormItem>
              )}
            />
            
            {selectedBookId && (
              <FormField
                control={form.control}
                name="copyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Book Copy (Optional)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={loadingCopies}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white/10 border-[#FF9800]/20 text-white">
                          <SelectValue placeholder="Select specific copy (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#003152] border-[#FF9800]/20 text-white">
                        {bookCopies.map(copy => (
                          <SelectItem key={copy.id} value={copy.id} className="focus:bg-[#004366]/50 hover:bg-[#004366]/50">
                            Copy ID: {copy.id.substring(0, 8)}... - {copy.condition} condition
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-white/70">If not selected, an available copy will be assigned automatically</p>
                    <FormMessage className="text-[#FF5722]" />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-white">Due Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="bg-white/10 border-[#FF9800]/20 text-white w-full pl-3 text-left font-normal flex justify-between"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date (defaults to +14 days)</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#003152] border-[#FF9800]/20 text-white">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="bg-[#003152] text-white"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-[#FF5722]" />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Add any notes about this book borrowing..."
                    {...field}
                    className="min-h-20 bg-white/10 border-[#FF9800]/20 text-white"
                  />
                </FormControl>
                <FormMessage className="text-[#FF5722]" />
              </FormItem>
            )}
          />
          
          <div className="pt-4">
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#FF9800] to-[#FF5722] hover:from-[#FF5722] hover:to-[#FF9800] text-white font-bold py-3 px-6 rounded-md transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl border border-[#FF9800]/20 relative overflow-hidden group"
            >
              <span className="absolute inset-0 w-full h-full bg-white/10 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500"></span>
              <span className="relative flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white/80 border-t-transparent rounded-full"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Issue Book</span>
                  </>
                )}
              </span>
            </Button>
            <p className="text-white/60 text-xs text-center mt-4">
              Once issued, the book will be marked as unavailable in the system until it is returned
            </p>
          </div>
        </form>
      </Form>
    </div>
  );
}
