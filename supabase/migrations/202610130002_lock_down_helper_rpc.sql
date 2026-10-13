-- Tighten RPC execution on SECURITY DEFINER helpers.
-- RLS policies need authenticated callers; anonymous callers do not.
revoke execute on function public.current_app_role() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_assigned_teacher(uuid) from public, anon;
revoke execute on function public.has_cr_permission(text) from public, anon;

grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_assigned_teacher(uuid) to authenticated;
grant execute on function public.has_cr_permission(text) to authenticated;
