#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Running migrations from $ROOT"

for dir in "$ROOT/services"/user-service "$ROOT/services"/product-service "$ROOT/services"/cart-service "$ROOT/services"/order-service "$ROOT/services"/payment-service "$ROOT/services"/notification-service; do
  if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
    if grep -q "migration:run" "$dir/package.json" 2>/dev/null; then
      echo "Running migrations in $(basename "$dir")..."
      (cd "$dir" && npm run migration:run 2>/dev/null) || echo "  (no migration script or failed)"
    fi
  fi
done

echo "Done."
