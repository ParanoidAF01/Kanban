import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Grid, List, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadBoards();
  }, [isAuthenticated, navigate]);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBoards();
      if (response.success) {
        setBoards(response.data.boards);
      }
    } catch (error) {
      console.error('Error loading boards:', error);
      setError('Failed to load boards');
      toast.error('Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleCreateBoard = async () => {
    try {
      const boardData = {
        name: 'New Board',
        description: 'A new collaborative board',
        color: '#3B82F6'
      };
      
      const response = await apiService.createBoard(boardData);
      if (response.success) {
        setBoards(prev => [...prev, response.data.board]);
        toast.success('Board created successfully');
        navigate(`/board/${response.data.board.id}`);
      }
    } catch (error) {
      console.error('Error creating board:', error);
      toast.error('Failed to create board');
    }
  };

  const filteredBoards = boards.filter(board =>
    board.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    board.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Kanban Boards</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
                <span className="text-sm text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="h-5 w-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search boards..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            
            {/* Create Board Button */}
            <button 
              onClick={handleCreateBoard}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Board</span>
            </button>
          </div>
        </div>

        {/* Boards Grid/List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading boards...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">
              <Grid className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Boards</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button 
              onClick={loadBoards}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : filteredBoards.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Grid className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No boards found' : 'No boards yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first board'
              }
            </p>
            {!searchTerm && (
              <button 
                onClick={handleCreateBoard}
                className="btn btn-primary"
              >
                Create Your First Board
              </button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredBoards.map((board) => (
              <Link
                key={board.id}
                to={`/board/${board.id}`}
                className={`card hover:shadow-lg transition-shadow ${
                  viewMode === 'list' ? 'flex items-center space-x-4' : ''
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div 
                      className="h-3 w-full rounded-t-lg -m-4 mb-4" 
                      style={{ backgroundColor: board.color }}
                    />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {board.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {board.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{board.memberCount || 0} members</span>
                      <span>{new Date(board.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div 
                      className="h-12 w-12 rounded-lg flex-shrink-0" 
                      style={{ backgroundColor: board.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {board.name}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {board.description || 'No description'}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>{board.memberCount || 0} members</span>
                        <span>•</span>
                        <span>{new Date(board.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
