
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { searchIdeas } from '@/services/api';
import { Idea } from '@/types/models';
import { useToast } from '@/components/ui/use-toast';

export const SearchBar = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const data = await searchIdeas(searchQuery);
      setResults(data);
    } catch (error) {
      console.error('Error searching ideas:', error);
      toast({
        title: 'Search failed',
        description: 'Could not perform search. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.length > 2) {
      handleSearch(value);
    }
  };

  const handleSelectIdea = (ideaId: string) => {
    setOpen(false);
    navigate(`/idea/${ideaId}`);
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="w-[200px] justify-between items-center text-muted-foreground hidden md:flex"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center gap-2">
          <SearchIcon className="h-4 w-4" />
          <span>Search ideas...</span>
        </div>
        <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-xs font-medium opacity-100 flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Search</span>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search ideas..." 
          value={query}
          onValueChange={handleQueryChange}
        />
        <CommandList>
          {isLoading ? (
            <div className="py-6 text-center text-sm">Searching...</div>
          ) : results.length === 0 && query.length > 0 ? (
            <CommandEmpty>No results found.</CommandEmpty>
          ) : results.length > 0 ? (
            <CommandGroup heading="Ideas">
              {results.map((idea) => (
                <CommandItem 
                  key={idea.id}
                  onSelect={() => handleSelectIdea(idea.id)}
                >
                  <div className="flex flex-col">
                    <span>{idea.title}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {idea.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
};
