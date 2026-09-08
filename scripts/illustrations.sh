#!/usr/bin/env bash
# Génère les illustrations manquantes via Kie (nano-banana-pro, famille Jobs).
# - Une image déjà présente dans brief/illu-src/ n'est JAMAIS regénérée.
# - Un échec unitaire ne fait pas échouer le lot : on log et on continue.
# - Aucun retry sur une tâche créée (retenter = repayer).
set -u
cd "$(dirname "$0")/.."
[ -n "${KIE_API_KEY:-}" ] || { echo "KIE_API_KEY absente" >&2; exit 1; }
mkdir -p brief/illu-src
STYLE="Clean cel-shaded cartoon illustration, anime-inspired sticker style, bold black outlines, flat colors with subtle cel shading, centered subject on a plain off-white background, color palette: deep burgundy red, black, cream and white with one small accent color. No text, no letters, no logo, no watermark, no photorealism, no human faces."
API="https://api.kie.ai/api/v1"
ok=0; ko=0
while IFS='|' read -r id sujet; do
  [ -z "$id" ] && continue
  out="brief/illu-src/$id.png"
  if [ -s "$out" ]; then echo "= $id : déjà présent, on garde"; continue; fi
  body=$(python3 -c 'import json,sys; print(json.dumps({"model":"nano-banana-pro","input":{"prompt":sys.argv[1]+" "+sys.argv[2],"aspect_ratio":"4:3","resolution":"1K","output_format":"png"}}))' "$STYLE" "$sujet")
  task=$(curl -sS --max-time 30 -X POST "$API/jobs/createTask" -H "Authorization: Bearer $KIE_API_KEY" -H "Content-Type: application/json" -d "$body" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("data",{}).get("taskId","") if d.get("code")==200 else "")')
  if [ -z "$task" ]; then echo "✗ $id : création de tâche refusée" >&2; ko=$((ko+1)); continue; fi
  url=""
  for i in $(seq 1 40); do
    sleep 6
    rep=$(curl -sS --max-time 20 -H "Authorization: Bearer $KIE_API_KEY" "$API/jobs/recordInfo?taskId=$task")
    etat=$(printf '%s' "$rep" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("data",{}).get("state",""))' 2>/dev/null || echo "")
    if [ "$etat" = "success" ]; then
      url=$(printf '%s' "$rep" | python3 -c 'import json,sys; d=json.load(sys.stdin)["data"]; print((json.loads(d.get("resultJson") or "{}").get("resultUrls") or [""])[0])')
      break
    elif [ "$etat" = "fail" ]; then
      echo "✗ $id : échec Kie : $(printf '%s' "$rep" | head -c 300)" >&2; break
    fi
  done
  if [ -n "$url" ] && curl -sS --max-time 60 -o "$out" "$url" && [ -s "$out" ]; then echo "✓ $id"; ok=$((ok+1)); else rm -f "$out"; echo "✗ $id : pas de résultat" >&2; ko=$((ko+1)); fi
done < scripts/illustrations.txt
echo "récap : $ok générées, $ko en échec"
