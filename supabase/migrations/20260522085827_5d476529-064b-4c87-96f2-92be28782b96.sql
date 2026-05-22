
-- 1. Storage: add UPDATE policy for resumes bucket (owner-scoped)
CREATE POLICY "Users can update own resume files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'resumes' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'resumes' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 2. user_roles: restrictive policy preventing non-admin INSERT/UPDATE/DELETE (admins still allowed via existing permissive policy)
CREATE POLICY "Only admins can modify roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Lock down has_role: revoke EXECUTE from public/anon/authenticated. It is only used inside RLS policies which run as the policy owner.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
