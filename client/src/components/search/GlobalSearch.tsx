import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { searchService } from '../../services/searchService';

interface SearchResult {
  id: string;
  type: 'message' | 'file';
  title: string;
  subtitle: string;
  channelId: string;
  timestamp: string;
  matchingText?: string;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedTab, setSelectedTab] = useState<'all' | 'messages' | 'files'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Actual search term used for searching
  const navigate = useNavigate();

  // Search function (no longer debounced since we're using Enter key)
  const performSearch = async (searchQuery: string, type: 'all' | 'messages' | 'files') => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    console.log('Performing search:', { searchQuery, type });
    setIsLoading(true);
    try {
      const searchResults = await searchService.search({
        query: searchQuery,
        type: type === 'messages' ? 'message' : type === 'files' ? 'file' : 'all'
      });
      console.log('Search results received:', searchResults);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      console.log('Enter pressed with query:', query.trim());
      setSearchTerm(query.trim());
      setSelectedTab('all');
      setIsOpen(true);
      performSearch(query.trim(), 'all');
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    setSearchTerm('');
    setResults([]);
    navigate(`/channels/${result.channelId}`);
  };

  // Effect to handle tab changes
  useEffect(() => {
    if (searchTerm) {
      performSearch(searchTerm, selectedTab);
    }
  }, [selectedTab]);

  return (
    <div className="w-96">
      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleSearchInputChange}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-100 transition-colors"
          placeholder="Search messages and files... (Press Enter to search)"
        />
      </div>

      {/* Search Results Modal */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog 
          as="div" 
          className="fixed inset-0 z-50 overflow-y-auto" 
          onClose={() => {
            setIsOpen(false);
          }}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
            </Transition.Child>

            <span className="inline-block h-screen align-middle" aria-hidden="true">
              &#8203;
            </span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="inline-block w-full max-w-2xl my-8 text-left align-middle transition-all transform">
                <div className="bg-white rounded-lg shadow-xl">
                  {/* Search Tabs */}
                  <div className="flex space-x-4 p-4 border-b border-gray-200">
                    <button
                      onClick={() => setSelectedTab('all')}
                      className={`px-3 py-1 text-sm rounded-md border ${
                        selectedTab === 'all'
                          ? 'bg-gray-100 text-gray-900 border-gray-300'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setSelectedTab('messages')}
                      className={`px-3 py-1 text-sm rounded-md border ${
                        selectedTab === 'messages'
                          ? 'bg-gray-100 text-gray-900 border-gray-300'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      Messages
                    </button>
                    <button
                      onClick={() => setSelectedTab('files')}
                      className={`px-3 py-1 text-sm rounded-md border ${
                        selectedTab === 'files'
                          ? 'bg-gray-100 text-gray-900 border-gray-300'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      Files
                    </button>
                  </div>

                  {/* Search Results */}
                  <div className="max-h-96 overflow-y-auto bg-white">
                    {isLoading ? (
                      <div className="p-4 text-center text-gray-500">
                        Searching...
                      </div>
                    ) : results.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No results found for "{searchTerm}"
                      </div>
                    ) : (
                      results.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="w-full p-4 text-left bg-white hover:bg-gray-50 border-b border-gray-200 last:border-0 transition-colors duration-150"
                        >
                          <div className="flex items-start">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{result.title}</p>
                              <p className="text-sm text-gray-600">{result.subtitle}</p>
                              {result.matchingText && (
                                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                                  {result.matchingText}
                                </p>
                              )}
                            </div>
                            <span className="ml-2 text-xs text-gray-500">{result.timestamp}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
} 