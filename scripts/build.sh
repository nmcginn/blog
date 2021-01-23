#!/usr/bin/env bash

if [ -d site/ ]; then rm -r site/; fi
mkdir site/

for file in $(ls -1r posts/*.md)
do
    NEW_FILE=$(printf ${file} | sed 's\posts\site\' | sed 's\md$\html\')
    showdown makehtml -i ${file} -o ${NEW_FILE}
    FILE_WITHOUT_PATH="$(printf "${NEW_FILE}" | sed 's\site/\\')"
    POST_TITLE=$(head -1 ${file} | sed 's\# \\')
    printf "\u002d [$POST_TITLE]($FILE_WITHOUT_PATH)\n" >> site/posts.md
done

cp -r assets/ site/

cat index.md site/posts.md > site/index.md
showdown makehtml -i site/index.md -o site/index.html
