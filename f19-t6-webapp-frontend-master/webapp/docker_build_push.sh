
IMAGE_NAME="yadavsunil/f19-t6-webapp-backend"
CIRCLE_SHA1=`git rev-parse HEAD`

docker build -t $IMAGE_NAME:$CIRCLE_SHA1 .

#echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin

docker push $IMAGE_NAME:$CIRCLE_SHA1
