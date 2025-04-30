
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { fetchIdeas, fetchCategories } from '@/services/api';
import { Idea, Category } from '@/types/models';
import { HeartIcon, MessageSquare, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

const Index = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [ideasData, categoriesData] = await Promise.all([
          fetchIdeas(selectedCategory || undefined),
          fetchCategories()
        ]);
        
        setIdeas(ideasData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedCategory]);

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Ideas Worth Sharing</h1>
          <p className="text-muted-foreground mt-1">
            Discover and share innovative ideas with the community
          </p>
        </div>
        {user && (
          <Button onClick={() => navigate('/idea/new')}>
            Share Your Idea
          </Button>
        )}
      </div>

      {/* Categories Filter */}
      <div className="flex flex-wrap gap-2">
        <Badge 
          variant={selectedCategory === null ? "default" : "outline"}
          className="cursor-pointer text-sm py-1 px-3"
          onClick={() => handleCategoryClick(null)}
        >
          All
        </Badge>
        {categories.map((category) => (
          <Badge 
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            className="cursor-pointer text-sm py-1 px-3"
            onClick={() => handleCategoryClick(category.id)}
          >
            {category.name}
          </Badge>
        ))}
      </div>

      {/* Ideas Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : ideas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => (
            <Card 
              key={idea.id} 
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/idea/${idea.id}`)}
            >
              <CardHeader className="pb-2">
                {idea.category && (
                  <CardDescription>
                    <Badge variant="outline">{idea.category.name}</Badge>
                  </CardDescription>
                )}
                <CardTitle className="line-clamp-1">{idea.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {idea.description}
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={idea.profile?.avatar_url || ''} />
                      <AvatarFallback>
                        {idea.profile?.username.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {idea.profile?.username || 'Anonymous'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(idea.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-3 pb-3 flex justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-sm">
                    <HeartIcon className="h-4 w-4" />
                    {idea.likes_count || 0}
                  </span>
                  <span className="flex items-center gap-1 text-sm">
                    <MessageSquare className="h-4 w-4" />
                    {idea.comments_count || 0}
                  </span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-muted-foreground">No ideas found</h3>
          {selectedCategory ? (
            <p className="mt-2">Try selecting a different category or create the first idea in this category.</p>
          ) : (
            <p className="mt-2">Be the first to share an idea!</p>
          )}
          {user && (
            <Button className="mt-4" onClick={() => navigate('/idea/new')}>
              Share Your Idea
            </Button>
          )}
        </div>
      )}

      {!user && ideas.length > 0 && (
        <div className="text-center border rounded-lg p-6 mt-8 bg-muted/30">
          <h3 className="text-xl font-medium">Have an idea to share?</h3>
          <p className="mt-2 text-muted-foreground">
            Join our community to share your ideas and engage with others.
          </p>
          <Button className="mt-4" onClick={() => navigate('/auth')}>
            Sign Up Now
          </Button>
        </div>
      )}
    </div>
  );
};

export default Index;
