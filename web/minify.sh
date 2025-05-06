#!/bin/bash

# Ensure the script runs from its own directory
cd "$(dirname "$0")"

# Define file paths
HTML_FILE="index.html"
CSS_FILE="main.css"
JS_FILES=( "virtualjoystick.js" "main.js")
TEMP_HTML="index.tmp.html"
OUTPUT_FILE="index.min.html"
OUTPUT_FILE_GZ="index.html.gz"

# Temporary files for minified CSS and JS
MIN_CSS_FILE="out.min.css"
MIN_JS_FILE="out.min.js"

# Minify CSS
echo "Minifying CSS..."
cleancss $CSS_FILE > $MIN_CSS_FILE 

# Minify JavaScript
echo "Minifying JavaScript..."
> $MIN_JS_FILE # Clear or create the minified JS file
for JS_FILE in "${JS_FILES[@]}"; do
  terser $JS_FILE >> $MIN_JS_FILE
done


# Inline CSS and JS into HTML
echo "Inlining CSS and JS into HTML..."
echo "Inlining step 1"
# Step 1: Use sed to replace placeholders with markers
sed \
    -e "s|<link rel=\"stylesheet\" href=\"main.css\">|<style>CSS_PLACEHOLDER</style>|" \
    -e "s|<script src=\"main.js\"></script>|<script>JS_PLACEHOLDER</script>|" \
    -e "s|<script src=\"virtualjoystick.js\"></script>||" \
    "$HTML_FILE" > "$TEMP_HTML"

echo "Inlining step 2"
# Step 2: Use perl to replace placeholders with the actual minified content
perl -i -pe \
    "s|CSS_PLACEHOLDER|do { local $/; open my \$fh, '$MIN_CSS_FILE' or die $!; <\$fh> }|ge; \
     s|JS_PLACEHOLDER|do { local $/; open my \$fh, '$MIN_JS_FILE' or die $!; <\$fh> }|ge" \
    "$TEMP_HTML"


# Minify the final HTML
echo "Minifying HTML..."
html-minifier-terser --collapse-whitespace --remove-comments --minify-css true --minify-js true $TEMP_HTML > $OUTPUT_FILE

# Clean up temporary files
rm $MIN_CSS_FILE $MIN_JS_FILE $TEMP_HTML

gzip -c -9 $OUTPUT_FILE > $OUTPUT_FILE_GZ

./make_header.sh . server_index_rover.h rover_web_server 4
cp server_index_rover.h ../components/rover_web_server/

echo "Minification complete. Output written to $OUTPUT_FILE and $OUTPUT_FILE_GZ"