const { LogDirective, FormatDateDirective, AuthenticationDirective, AuthorizationDirective } = require("./directives");

const { ApolloServer } = require("apollo-server");
const typeDefs = require("./typedefs");
const resolvers = require("./resolvers");
const { createToken, getUserFromToken } = require("./auth");
const db = require("./db");

const server = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives: {
    log: LogDirective,
    formatDate: FormatDateDirective,
    authentication: AuthenticationDirective,
    authorization: AuthorizationDirective
  },
  context({ req, connection }) {
    const ctx = { ...db };
    if (connection) {
      console.log(connection.context);
      return { ...ctx, ...connection.context };
    }

    const token = req.headers.authorization;
    const user = getUserFromToken(token);
    return { ...db, user, createToken };
  },
  subscriptions: {
    onConnect: connectionParams => {
      const user = getUserFromToken(connectionParams.authorization);
      if (!user) {
        throw new Error("not authenticated");
      }

      return { user, age: 22 };
    }
  }
});

server.listen(4000).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
