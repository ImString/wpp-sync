#!/usr/bin/env bash

set -Eeuo pipefail

readonly APP_DIR='/opt/wpp-sync'
readonly APP_USER='wppsync'
readonly APP_HOME='/var/lib/wppsync'
readonly APP_SERVICE='wppsync.service'
readonly DEPLOY_SHA="${1:-}"

if [[ ! "$DEPLOY_SHA" =~ ^[0-9a-f]{40}$ ]]; then
	echo 'Usage: deploy-production.sh <40-character-git-sha>' >&2
	exit 2
fi

exec 9>/var/lock/wppsync-deploy.lock
if ! flock -n 9; then
	echo 'Another WPP Sync deployment is already running.' >&2
	exit 1
fi

run_as_app() {
	runuser -u "$APP_USER" -- env HOME="$APP_HOME" "$@"
}

cd "$APP_DIR"

echo "Deploying commit $DEPLOY_SHA"
run_as_app git fetch --prune --no-tags origin main
run_as_app git rev-parse --verify "$DEPLOY_SHA^{commit}" >/dev/null

if ! run_as_app git merge-base --is-ancestor "$DEPLOY_SHA" origin/main; then
	echo 'The requested commit does not belong to origin/main.' >&2
	exit 1
fi

run_as_app git checkout --force --detach "$DEPLOY_SHA"
run_as_app pnpm install --frozen-lockfile --reporter=append-only

docker compose up -d --wait postgres redis kafka

run_as_app /bin/bash -c '
	set -a
	source ./.env
	set +a
	pnpm exec turbo build --filter=@wppsync/client... --filter=@wppsync/server...
'

service_stopped=0
restart_after_error() {
	if (( service_stopped )); then
		systemctl start "$APP_SERVICE" || true
	fi
}
trap restart_after_error ERR

systemctl stop "$APP_SERVICE"
service_stopped=1

run_as_app pnpm --filter @wppsync/database db:push
systemctl start "$APP_SERVICE"
service_stopped=0

for _ in {1..30}; do
	if systemctl is-active --quiet "$APP_SERVICE" && curl --silent --output /dev/null --max-time 2 http://127.0.0.1:3001/; then
		break
	fi

	sleep 1
done

if ! systemctl is-active --quiet "$APP_SERVICE" || ! curl --silent --output /dev/null --max-time 2 http://127.0.0.1:3001/; then
	journalctl --unit "$APP_SERVICE" --no-pager --lines 100 >&2
	exit 1
fi

curl --fail --silent --show-error --output /dev/null --max-time 15 https://wppsync.imstring.dev/

trap - ERR
echo "Deployment completed: $DEPLOY_SHA"
