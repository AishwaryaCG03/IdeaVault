
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LightbulbIcon, PlusCircle, LogOut, User, Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { SearchBar } from './SearchBar';
import { NotificationsDropdown } from './NotificationsDropdown';

const Layout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex justify-between items-center h-16 px-4">
          <Link to="/" className="font-bold text-xl flex items-center">
            <LightbulbIcon className="h-6 w-6 mr-2 text-yellow-500" />
            <span>IdeaShare</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-4">
            <Link to="/" className="px-3 py-2 rounded-md hover:bg-secondary transition-colors">
              Home
            </Link>
            <Link to="/categories" className="px-3 py-2 rounded-md hover:bg-secondary transition-colors">
              Categories
            </Link>
          </nav>

          <div className="flex items-center space-x-2">
            <SearchBar />
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {user ? (
              <>
                {user && <NotificationsDropdown />}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/idea/new')} 
                  className="hidden md:flex items-center"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Idea
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="cursor-pointer">
                      <AvatarFallback>
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/idea/new')}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <span>New Idea</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')}>Sign In</Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-6 px-4">
        <Outlet />
      </main>

      <footer className="border-t py-6 bg-background">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} IdeaShare. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
