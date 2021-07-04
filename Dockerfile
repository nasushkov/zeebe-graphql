FROM mhart/alpine-node:14.15.4 as build
WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig*.json ./
COPY ./src ./src
RUN npm ci --quiet && npm run build

FROM mhart/alpine-node:14.15.4 as production
WORKDIR /usr/src/prod
COPY --from=build /usr/src/app/package.json ./
COPY --from=build /usr/src/app/lib ./lib
COPY --from=build /usr/src/app/node_modules ./node_modules
CMD ["node", "--max_old_space_size=4096", "--max_semi_space_size=256", "./lib/index.js"]