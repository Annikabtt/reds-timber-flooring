
DROP POLICY "Users can update tasks" ON public.tasks;
CREATE POLICY "Creator or assignee can update tasks" ON public.tasks
  FOR UPDATE TO authenticated USING (auth.uid() = creator_id OR auth.uid() = assignee_id);
