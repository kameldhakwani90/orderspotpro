#!/bin/sh
ulimit -v 1048576


TELEGRAM_BOT_TOKEN="7622014576:AAHfSYc4qVZyea30xdhKIPwa_ApykZtstBQ"
TELEGRAM_CHAT_ID="7038273127"

mkdir -p logs
LOG_FILE=logs/build-$(date +%Y-%m-%d_%H-%M-%S).log

echo "🚀 Build Orderspot started at $(date)" | tee -a $LOG_FILE

PID=$(lsof -t -i:3000 || true)
if [ ! -z "$PID" ]; then
  echo "🔪 Port 3000 occupé (PID $PID), kill..." | tee -a $LOG_FILE
  kill -9 $PID
fi

node tools/build-server.js >> $LOG_FILE 2>&1
BUILD_RESULT=$?

if [ $BUILD_RESULT -ne 0 ]; then
  echo "❌ Build KO" | tee -a $LOG_FILE
  curl -s -F document=@"$LOG_FILE" \
    "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendDocument?chat_id=$TELEGRAM_CHAT_ID&caption=❌ Build Orderspot échoué"
  exit 1
fi

git add . >> $LOG_FILE 2>&1
git commit -am "✨ Auto build push" >> $LOG_FILE 2>&1
git push origin preprod >> $LOG_FILE 2>&1

pm2 restart orderspot-app >> $LOG_FILE 2>&1

echo "✅ Build terminé $(date)" | tee -a $LOG_FILE
curl -s -F document=@"$LOG_FILE" \
  "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendDocument?chat_id=$TELEGRAM_CHAT_ID&caption=✅ Build Orderspot réussi 🎉"
