const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    const token = localStorage.getItem('token');
    if (!token) {
      // Try to get from auth context or redirect to login
      console.warn('No auth token found');
    }
    return token;
  }

  // Get headers with auth token
  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData) {
    console.log('Registering user with data:', userData);
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST'
    });
  }

  async getProfile() {
    return this.request('/auth/me');
  }

  // Board endpoints
  async getBoards(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/boards${queryString ? `?${queryString}` : ''}`);
  }

  async getBoard(boardId) {
    return this.request(`/boards/${boardId}`);
  }

  async getBoardWithColumns(boardId) {
    return this.request(`/boards/${boardId}/columns`);
  }

  async createBoard(boardData) {
    return this.request('/boards', {
      method: 'POST',
      body: JSON.stringify(boardData)
    });
  }

  async updateBoard(boardId, boardData) {
    return this.request(`/boards/${boardId}`, {
      method: 'PUT',
      body: JSON.stringify(boardData)
    });
  }

  async deleteBoard(boardId) {
    return this.request(`/boards/${boardId}`, {
      method: 'DELETE'
    });
  }

  // Column endpoints
  async getColumns(boardId) {
    return this.request(`/boards/${boardId}/columns`);
  }

  async createColumn(boardId, columnData) {
    return this.request(`/boards/${boardId}/columns`, {
      method: 'POST',
      body: JSON.stringify(columnData)
    });
  }

  async updateColumn(columnId, columnData) {
    return this.request(`/columns/${columnId}`, {
      method: 'PUT',
      body: JSON.stringify(columnData)
    });
  }

  async deleteColumn(columnId) {
    return this.request(`/columns/${columnId}`, {
      method: 'DELETE'
    });
  }

  // Card endpoints
  async getCards(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/cards${queryString ? `?${queryString}` : ''}`);
  }

  async createCard(cardData) {
    return this.request('/cards', {
      method: 'POST',
      body: JSON.stringify(cardData)
    });
  }

  async updateCard(cardId, cardData) {
    return this.request(`/cards/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify(cardData)
    });
  }

  async deleteCard(cardId) {
    return this.request(`/cards/${cardId}`, {
      method: 'DELETE'
    });
  }

  async moveCard(cardId, moveData) {
    return this.request(`/cards/${cardId}/move`, {
      method: 'PUT',
      body: JSON.stringify(moveData)
    });
  }

  // Column endpoints
  async createColumn(boardId, columnData) {
    return this.request(`/boards/${boardId}/columns`, {
      method: 'POST',
      body: JSON.stringify(columnData)
    });
  }

  async updateColumn(columnId, columnData) {
    return this.request(`/columns/${columnId}`, {
      method: 'PUT',
      body: JSON.stringify(columnData)
    });
  }

  async deleteColumn(columnId) {
    return this.request(`/columns/${columnId}`, {
      method: 'DELETE'
    });
  }

  // Activity endpoints
  async getActivities(boardId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/boards/${boardId}/activities${queryString ? `?${queryString}` : ''}`);
  }
}

export default new ApiService();
