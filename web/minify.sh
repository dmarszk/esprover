#!/bin/bash

# Ensure the script runs from its own directory
cd "$(dirname "$0")"

# Define file paths
HTML_FILE="index.html"
CSS_FILE="main.css"
JS_FILES=("main.js" "virtualjoystick.js")
OUTPUT_FILE="index.min.html"

# Temporary files for minified CSS and JS
MIN_CSS_FILE="main.min.css"
MIN_JS_FILE="main.min.js"

# Minify CSS
echo "Minifying CSS..."
cleancss -o $MIN_CSS_FILE $CSS_FILE

# Minify JavaScript
echo "Minifying JavaScript..."
> $MIN_JS_FILE # Clear or create the minified JS file
for JS_FILE in "${JS_FILES[@]}"; do
  terser $JS_FILE -o temp.min.js
  cat temp.min.js >> $MIN_JS_FILE
  echo "" >> $MIN_JS_FILE # Add a newline between files
done
rm temp.min.js

# Inline CSS and JS into HTML
echo "Inlining CSS and JS into HTML..."
# html-minifier-terser --collapse-whitespace --remove-comments --minify-css true --minify-js true \
  --input-dir . --output-dir . -o $OUTPUT_FILE $HTML_FILE

# Clean up temporary files
#rm $MIN_CSS_FILE $MIN_JS_FILE

echo "Minification complete. Output written to $OUTPUT_FILE"