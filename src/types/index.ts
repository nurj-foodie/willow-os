export type TaskStatus = 'todo' | 'done' | 'parked' | 'archived';
export type ColorTheme = 'oat' | 'matcha' | 'clay' | 'lavender' | 'sage';

export interface Task {
    id: string;
    user_id?: string;
    title: string;
    description?: string;
    due_date: string | null;
    status: TaskStatus;
    color_theme: ColorTheme;
    priority: number;
    position_rank: number;
    emoji?: string;
    created_at?: string;
    updated_at?: string;
}
