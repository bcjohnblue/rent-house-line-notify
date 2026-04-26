#!/bin/bash
# scripts/deploy.sh
# 一鍵部署 rent-house-line-notify 到 GCP Cloud Run Functions + Cloud Scheduler

set -e  # 任何指令失敗就停止

# 自動載入 .env（若存在），逐行解析避免特殊字元問題
ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
  while IFS='=' read -r key value; do
    # 跳過空行與註解
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${key// }" ]] && continue
    # 去掉 key/value 前後空白
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    # 只 export 合法的變數名稱
    [[ "$key" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]] && export "$key=$value"
  done < "$ENV_FILE"
  echo "✅ 已載入 .env"
fi


# ============================================================
# 設定變數（部署前請先修改）
# ============================================================
PROJECT_ID="rent-house-notify"
REGION="us-central1"
BUCKET_NAME="rent-house-notify-cache"
CRON_SCHEDULE="${CRON_SCHEDULE:-0 9,12,15,18,21 * * *}"
LINE_TARGET_ID="${LINE_TARGET_ID:?請設定環境變數 LINE_TARGET_ID}"
LINE_CHANNEL_ACCESS_TOKEN="${LINE_CHANNEL_ACCESS_TOKEN:?請設定環境變數 LINE_CHANNEL_ACCESS_TOKEN}"

# ============================================================
echo "🚀 Step 1: 設定 GCP 專案..."
gcloud config set project "$PROJECT_ID"

# ============================================================
echo "🔧 Step 2: 啟用所需 API..."
gcloud services enable \
  cloudfunctions.googleapis.com \
  cloudscheduler.googleapis.com \
  storage.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com

# ============================================================
echo "🪣 Step 3: 建立 GCS Bucket（若已存在則跳過）..."
if ! gcloud storage buckets describe "gs://$BUCKET_NAME" &>/dev/null; then
  gcloud storage buckets create "gs://$BUCKET_NAME" \
    --location="$REGION" \
    --uniform-bucket-level-access
  echo "  ✅ Bucket gs://$BUCKET_NAME 建立完成"
else
  echo "  ℹ️  Bucket gs://$BUCKET_NAME 已存在，跳過"
fi

# ============================================================
echo "⚡ Step 4: 部署 notifyRentHouse Function..."
gcloud functions deploy notifyRentHouse \
  --gen2 \
  --runtime=nodejs22 \
  --region="$REGION" \
  --source=. \
  --entry-point=notifyRentHouse \
  --trigger-http \
  --no-allow-unauthenticated \
  --set-env-vars="LINE_TARGET_ID=$LINE_TARGET_ID,GCS_BUCKET_NAME=$BUCKET_NAME,LINE_CHANNEL_ACCESS_TOKEN=$LINE_CHANNEL_ACCESS_TOKEN"

NOTIFY_URL=$(gcloud functions describe notifyRentHouse \
  --region="$REGION" --gen2 \
  --format='value(serviceConfig.uri)')
echo "  ✅ notifyRentHouse URL: $NOTIFY_URL"

# ============================================================
echo "⚡ Step 5: 部署 lineWebhook Function..."
gcloud functions deploy lineWebhook \
  --gen2 \
  --runtime=nodejs22 \
  --region="$REGION" \
  --source=. \
  --entry-point=lineWebhook \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars="LINE_TARGET_ID=$LINE_TARGET_ID"

WEBHOOK_URL=$(gcloud functions describe lineWebhook \
  --region="$REGION" --gen2 \
  --format='value(serviceConfig.uri)')
echo "  ✅ lineWebhook URL: $WEBHOOK_URL"

# ============================================================
echo "⏰ Step 6: 建立 Cloud Scheduler Job（若已存在則更新）..."
SERVICE_ACCOUNT=$(gcloud functions describe notifyRentHouse \
  --region="$REGION" --gen2 \
  --format='value(serviceConfig.serviceAccountEmail)')

if gcloud scheduler jobs describe rent-house-notify --location="$REGION" &>/dev/null; then
  gcloud scheduler jobs update http rent-house-notify \
    --location="$REGION" \
    --schedule="$CRON_SCHEDULE" \
    --time-zone="Asia/Taipei" \
    --uri="$NOTIFY_URL" \
    --http-method=POST \
    --oidc-service-account-email="$SERVICE_ACCOUNT"
  echo "  ✅ Scheduler Job 已更新"
else
  gcloud scheduler jobs create http rent-house-notify \
    --location="$REGION" \
    --schedule="$CRON_SCHEDULE" \
    --time-zone="Asia/Taipei" \
    --uri="$NOTIFY_URL" \
    --http-method=POST \
    --oidc-service-account-email="$SERVICE_ACCOUNT"
  echo "  ✅ Scheduler Job 已建立"
fi

# ============================================================
echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 資訊摘要："
echo "  notifyRentHouse : $NOTIFY_URL"
echo "  lineWebhook     : $WEBHOOK_URL"
echo ""
echo "📌 下一步："
echo "  1. 將 lineWebhook URL 填入 LINE Developers Console 的 Webhook URL："
echo "     $WEBHOOK_URL"
echo ""
echo "  2. 手動測試推播："
echo "     gcloud scheduler jobs run rent-house-notify --location=$REGION"
echo ""
echo "  3. 查看 log："
echo "     gcloud functions logs read notifyRentHouse --region=$REGION --gen2 --limit=50"
