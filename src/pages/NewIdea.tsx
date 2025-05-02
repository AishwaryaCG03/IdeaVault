
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { fetchCategories, createIdea, awardPoints, fetchIdeaById, updateIdea, fetchIdeaTags } from '@/services/api';
import { Category, Idea, IdeaTag } from '@/types/models';
import { TagsInput } from '@/components/TagsInput';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description must be less than 2000 characters'),
  category_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const NewIdea = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [existingIdea, setExistingIdea] = useState<Idea | null>(null);
  const [existingTags, setExistingTags] = useState<IdeaTag[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category_id: undefined,
      tags: [],
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      toast({
        title: 'Authentication required',
        description: 'You need to be signed in to create ideas',
        variant: 'destructive',
      });
      return;
    }

    const loadData = async () => {
      try {
        setInitialLoading(true);
        
        // Load categories
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);
        
        // If editing, load existing idea
        if (isEditing && id) {
          const ideaData = await fetchIdeaById(id);
          
          if (!ideaData) {
            navigate('/not-found');
            return;
          }
          
          // Check if current user is the owner
          if (ideaData.user_id !== user.id) {
            navigate('/');
            toast({
              title: 'Access Denied',
              description: 'You can only edit your own ideas',
              variant: 'destructive',
            });
            return;
          }
          
          setExistingIdea(ideaData);
          
          // Load existing tags
          const tagsData = await fetchIdeaTags(id);
          setExistingTags(tagsData);
          
          // Set form values
          form.reset({
            title: ideaData.title,
            description: ideaData.description,
            category_id: ideaData.category_id || undefined,
            tags: tagsData.map(t => t.tag_id),
          });
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load required data',
          variant: 'destructive',
        });
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [user, navigate, id, isEditing, form]);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      if (isEditing && existingIdea) {
        // Update existing idea
        const updatedIdea = await updateIdea(existingIdea.id, {
          title: values.title,
          description: values.description,
          category_id: values.category_id || null,
          updated_at: new Date().toISOString(),
        });

        toast({
          title: 'Success!',
          description: 'Your idea has been updated',
        });
        
        navigate(`/idea/${updatedIdea.id}`);
      } else {
        // Create new idea
        const newIdea = await createIdea(
          {
            title: values.title,
            description: values.description,
            category_id: values.category_id || null,
            user_id: user.id,
          },
          values.tags
        );

        // Award points for creating an idea
        await awardPoints(user.id, 10);

        toast({
          title: 'Success!',
          description: 'Your idea has been shared',
        });
        
        navigate(`/idea/${newIdea.id}`);
      }
    } catch (error) {
      console.error('Error saving idea:', error);
      toast({
        title: 'Error',
        description: 'Failed to save idea. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{isEditing ? 'Edit Idea' : 'Share Your Idea'}</h1>
        <div className="space-y-4">
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{isEditing ? 'Edit Idea' : 'Share Your Idea'}</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter the title of your idea" {...field} />
                </FormControl>
                <FormDescription>
                  A clear, concise title that captures your idea
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose a category that best fits your idea
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <TagsInput 
                    value={field.value || []} 
                    onChange={field.onChange} 
                  />
                </FormControl>
                <FormDescription>
                  Add relevant tags to help others find your idea (optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your idea in detail" 
                    className="min-h-32" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Explain your idea thoroughly including its purpose, benefits, and implementation
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate(isEditing ? `/idea/${id}` : '/')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update Idea' : 'Share Idea'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewIdea;
