 #!/bin/bash -x \n

echo NODE_ENV='${NODE_ENV}' > ../webapp/.env 
echo PORT='${PORT}' >> ../webapp/.env
echo SALT_ROUNDS=10 >> ../webapp/.env
echo DM_HOST='${DB_HOST}' >> ../webapp/.env
echo DB_USER='${DB_USER}' >> ../webapp/.env
echo DB_PASS='${DB_PASS}' >> ../webapp/.env
echo DB_PORT='${DB_PORT}' >> ../webapp/.env
echo DB_NAME='${DB_NAME}' >> ../webapp/.env
echo BUCKET_NAME='${BUCKET_NAME}' >> ../webapp/.env
