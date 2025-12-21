-- SQL Migration: Add priority to tasks
ALTER TABLE tasks ADD COLUMN priority int2 DEFAULT 4;
COMMENT ON COLUMN tasks.priority IS '1: Urgent/Important, 2: Important/Not Urgent, 3: Urgent/Not Important, 4: Not Urgent/Not Important';
