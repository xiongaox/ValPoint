export { };

declare global {
    interface Window {
        __ENV__: {
            VITE_SUPABASE_URL: string;
            VITE_SUPABASE_ANON_KEY: string;
            VITE_SUPABASE_SHARE_URL?: string;
            VITE_SUPABASE_SHARE_ANON_KEY?: string;
            VITE_SHARED_LIBRARY_URL?: string;
            [key: string]: string | undefined;
        };
    }
}
