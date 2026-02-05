#!/bin/sh

# Define config file path
CONFIG_FILE="env-config.js"

# Create config content
cat <<EOF > /tmp/${CONFIG_FILE}
window.__ENV__ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY}",
  VITE_SHARED_LIBRARY_URL: "${VITE_SHARED_LIBRARY_URL}",
  VITE_PERSONAL_LIBRARY_URL: "${VITE_PERSONAL_LIBRARY_URL}",
  VITE_ADMIN_ACCOUNT: "${VITE_ADMIN_ACCOUNT}",
  VITE_ADMIN_ACCOUNT: "${VITE_ADMIN_ACCOUNT}",
  VITE_ADMIN_PASSWORD: "${VITE_ADMIN_PASSWORD}",
  VITE_DONATE_WECHAT_QR: "${VITE_DONATE_WECHAT_QR}",
  VITE_DONATE_ALIPAY_QR: "${VITE_DONATE_ALIPAY_QR}",
  VITE_CONTACT_WECHAT_QR: "${VITE_CONTACT_WECHAT_QR}",
  VITE_ICP_NUMBER: "${VITE_ICP_NUMBER}",
  VITE_PSB_NUMBER: "${VITE_PSB_NUMBER}",
  VITE_COPYRIGHT_TEXT: "${VITE_COPYRIGHT_TEXT}",
  VITE_DEPLOY_PLATFORM: "${VITE_DEPLOY_PLATFORM}"
};
EOF

# Copy config to unified app root (MPA architecture)
cp /tmp/${CONFIG_FILE} /usr/share/nginx/html/${CONFIG_FILE}

# Generate valpoint.json (Domain Discovery Manifest)
MANIFEST_FILE="valpoint.json"
cat <<EOF > /usr/share/nginx/html/${MANIFEST_FILE}
{
  "name": "ValPoint 官方库",
  "description": "ValPoint 官方公共点位库，汇集全网热门实战投掷物演示。",
  "api": {
    "supabaseUrl": "${VITE_SUPABASE_URL}",
    "supabaseAnonKey": "${VITE_SUPABASE_ANON_KEY}"
  },
  "version": "1.0.0"
}
EOF

# Start Nginx
exec "$@"
