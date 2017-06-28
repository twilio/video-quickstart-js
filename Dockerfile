FROM node:alpine

# Default port is set to 3000. 
# This will be overriden if a diffferent value is provided as an argument for the container.
ENV PORT 3000 

RUN apk update
RUN apk upgrade
RUN apk add git bash curl wget
RUN rm -rf /var/cache/apk/*

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install && npm cache clean --force
COPY . /usr/src/app

CMD [ "npm", "start" ]
