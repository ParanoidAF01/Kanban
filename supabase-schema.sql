-- Supabase Database Schema for Collaborative Kanban Board
-- This script creates all necessary tables and relationships

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Boards table
CREATE TABLE public.boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    deadline DATE,
    is_archived BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Board members table
CREATE TABLE public.board_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(board_id, user_id)
);

-- Columns table
CREATE TABLE public.columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280',
    position INTEGER NOT NULL DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cards table
CREATE TABLE public.cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    priority VARCHAR(20) DEFAULT 'medium',
    cover_image TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    column_id UUID NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE,
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Card assignments table
CREATE TABLE public.card_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'assignee',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(card_id, user_id)
);

-- Activities table
CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    column_id UUID REFERENCES public.columns(id) ON DELETE CASCADE,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_boards_owner_id ON public.boards(owner_id);
CREATE INDEX idx_boards_is_archived ON public.boards(is_archived);
CREATE INDEX idx_board_members_board_id ON public.board_members(board_id);
CREATE INDEX idx_board_members_user_id ON public.board_members(user_id);
CREATE INDEX idx_columns_board_id ON public.columns(board_id);
CREATE INDEX idx_columns_position ON public.columns(position);
CREATE INDEX idx_cards_column_id ON public.cards(column_id);
CREATE INDEX idx_cards_board_id ON public.cards(board_id);
CREATE INDEX idx_cards_position ON public.cards(position);
CREATE INDEX idx_cards_is_archived ON public.cards(is_archived);
CREATE INDEX idx_card_assignments_card_id ON public.card_assignments(card_id);
CREATE INDEX idx_card_assignments_user_id ON public.card_assignments(user_id);
CREATE INDEX idx_activities_board_id ON public.activities(board_id);
CREATE INDEX idx_activities_created_at ON public.activities(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Board policies
CREATE POLICY "Users can view boards they are members of" ON public.boards
    FOR SELECT USING (
        owner_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.board_members 
            WHERE board_id = id AND user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can create boards" ON public.boards
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Board owners can update their boards" ON public.boards
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Board owners can delete their boards" ON public.boards
    FOR DELETE USING (owner_id = auth.uid());

-- Board members policies
CREATE POLICY "Users can view board memberships" ON public.board_members
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE id = board_id AND owner_id = auth.uid()
        )
    );

-- Column policies
CREATE POLICY "Board members can view columns" ON public.columns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.board_members 
            WHERE board_id = columns.board_id AND user_id = auth.uid() AND is_active = true
        ) OR
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE id = columns.board_id AND owner_id = auth.uid()
        )
    );

-- Card policies
CREATE POLICY "Board members can view cards" ON public.cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.board_members 
            WHERE board_id = cards.board_id AND user_id = auth.uid() AND is_active = true
        ) OR
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE id = cards.board_id AND owner_id = auth.uid()
        )
    );

-- Activity policies
CREATE POLICY "Board members can view activities" ON public.activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.board_members 
            WHERE board_id = activities.board_id AND user_id = auth.uid() AND is_active = true
        ) OR
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE id = activities.board_id AND owner_id = auth.uid()
        )
    );

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON public.boards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_columns_updated_at BEFORE UPDATE ON public.columns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON public.cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
