FROM node:latest as build
WORKDIR /app
# Copy stuff
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY . .

# Install system deps
# RUN apk add --no-cache curl bash
# Install volta
RUN curl https://get.volta.sh | bash

# Install deps & build
RUN yarn
RUN yarn build

FROM build as production
# Copy the build artifacts
COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/yarn.lock /app/yarn.lock
RUN yarn prisma generate

# Run the bot
CMD ["yarn", "start"]


