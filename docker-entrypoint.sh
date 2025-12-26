#!/bin/sh

# Define config file path
CONFIG_FILE="env-config.js"

# Create config content
cat <<EOF > /tmp/${CONFIG_FILE}
window.__ENV__ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY}",
  VITE_SUPABASE_SHARE_URL: "${VITE_SUPABASE_SHARE_URL}",
  VITE_SUPABASE_SHARE_ANON_KEY: "${VITE_SUPABASE_SHARE_ANON_KEY}",
  VITE_SHARED_LIBRARY_URL: "${VITE_SHARED_LIBRARY_URL}"
};
EOF

# Copy config to each app's directory
# User App
cp /tmp/${CONFIG_FILE} /usr/share/nginx/html/user/${CONFIG_FILE}
# Shared App
cp /tmp/${CONFIG_FILE} /usr/share/nginx/html/shared/${CONFIG_FILE}
# Admin App
cp /tmp/${CONFIG_FILE} /usr/share/nginx/html/admin/${CONFIG_FILE}

# Start Nginx
exec "$@"
