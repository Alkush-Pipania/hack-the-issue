'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Define interface for book data
interface Book {
  id: string;
  title: string;
  subtitle?: string;
  isbn: string;
  publicationYear: number;
  publisher: string;
  description: string;
  authors: string[];
  categories: string[];
  availableCopies: number;
  totalCopies: number;
  language: string;
  status: string;
}

export function BookSearchTable() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState<keyof Book>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch books on initial load
  useEffect(() => {
    fetchBooks();
  }, []);

  // Function to fetch books from API
  const fetchBooks = async (query = '') => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication token missing. Please login again.');
        return;
      }

      const userId = localStorage.getItem('userId') || '1'; // Default to userId 1 if not found
      
      const response = await axios.get(`http://localhost:4000/api/books/search`, {
        params: {
          userId,
          searchQuery: query
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setBooks(response.data.data);
      } else {
        // Fallback to default books if response format is unexpected
        setBooks([]);
        toast.error('Failed to load books. Unexpected response format.');
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Failed to load books. Please try again.');
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search button click
  const handleSearch = () => {
    fetchBooks(searchQuery);
  };

  // Handle enter key in search field
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle sorting
  const handleSort = (field: keyof Book) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Function to render sort indicator
  const renderSortIndicator = (field: keyof Book) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // Sort books based on sort field and direction
  const sortedBooks = [...books].sort((a, b) => {
    // Special handling for array fields like authors
    if (sortField === 'authors') {
      const aValue = a.authors?.[0] || '';
      const bValue = b.authors?.[0] || '';
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }
    
    // For other fields, compare directly
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="w-full sm:w-1/2">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Books
          </label>
          <div className="relative">
            <Input
              id="search"
              type="text"
              placeholder="Search by title, author, ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={isLoading}
          className="bg-gradient-to-r from-[#FF9800] to-[#FF5722] hover:from-[#FF5722] hover:to-[#FF9800] text-white shrink-0"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      <div className="relative overflow-x-auto rounded-lg shadow-md">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs uppercase bg-gradient-to-r from-[#004366] to-[#003152] text-white">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 cursor-pointer"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center space-x-1">
                  <span>Title</span>
                  {renderSortIndicator('title')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 cursor-pointer"
                onClick={() => handleSort('authors')}
              >
                <div className="flex items-center space-x-1">
                  <span>Author</span>
                  {renderSortIndicator('authors')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 cursor-pointer hidden md:table-cell"
                onClick={() => handleSort('isbn')}
              >
                <div className="flex items-center space-x-1">
                  <span>ISBN</span>
                  {renderSortIndicator('isbn')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 cursor-pointer hidden md:table-cell"
                onClick={() => handleSort('publicationYear')}
              >
                <div className="flex items-center space-x-1">
                  <span>Year</span>
                  {renderSortIndicator('publicationYear')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 cursor-pointer"
                onClick={() => handleSort('availableCopies')}
              >
                <div className="flex items-center space-x-1">
                  <span>Available</span>
                  {renderSortIndicator('availableCopies')}
                </div>
              </th>
              <th scope="col" className="px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF9800]"></div>
                    <span>Loading books...</span>
                  </div>
                </td>
              </tr>
            ) : sortedBooks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center justify-center py-6">
                    <BookOpen className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-lg text-gray-500">No books found</p>
                    <p className="text-sm text-gray-400">Try a different search term</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedBooks.map((book) => (
                <tr key={book.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">
                    <div>
                      <div className="font-semibold text-gray-900">{book.title}</div>
                      {book.subtitle && <div className="text-xs text-gray-500">{book.subtitle}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {book.authors.join(', ')}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {book.isbn}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {book.publicationYear}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${book.availableCopies > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {book.availableCopies} / {book.totalCopies}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-[#004366] to-[#003152] hover:from-[#003152] hover:to-[#004366] text-white"
                      onClick={() => {
                        // Navigate to issue book page with this book pre-selected
                        localStorage.setItem('selectedBookId', book.id);
                        window.location.href = '/issuebooks';
                      }}
                    >
                      Issue
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
