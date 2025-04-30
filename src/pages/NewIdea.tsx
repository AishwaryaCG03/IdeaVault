
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { fetchCategories, createIdea } from '@/services/api';
import { Category } from '@/types/models';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description must be less than 2000 characters'),
  category_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const NewIdea = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category_id: undefined,
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

    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast({
          title: 'Error',
          description: 'Failed to load categories',
          variant: 'destructive',
        });
      }
    };

    loadCategories();
  }, [user, navigate]);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const newIdea = await createIdea({
        title: values.title,
        description: values.description,
        category_id: values.category_id || null,
        user_id: user.id,
      });

      toast({
        title: 'Success!',
        description: 'Your idea has been shared',
      });
      
      navigate(`/idea/${newIdea.id}`);
    } catch (error) {
      console.error('Error creating idea:', error);
      toast({
        title: 'Error',
        description: 'Failed to create idea. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Share Your Idea</h1>
      
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
            <Button type="button" variant="outline" onClick={() => navigate('/')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Share Idea'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewIdea;
