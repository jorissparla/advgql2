const gql = require("graphql-tag");
const { ApolloServer, PubSub, UserInputError, SchemaDirectiveVisitor } = require("apollo-server");
const { defaultFieldResolver, GraphQLString } = require("graphql");
const { formatDate } = require("./src/utils");
const pubsub = new PubSub();
const NEW_ITEM = "New_Item";

class LogDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field, type) {
    const { resolve = defaultFieldResolver } = field;
    field.resolve = async function(root, { format, ...rest }, ctx, info) {
      console.log(`⚡️  ${type.objectType}.${field.name}`);
      return resolve.call(this, root, rest, ctx, info);
    };
    // return field.resolve();
  }
}

class FormatDateDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field;
    const { format: defaultFormat } = this.args;

    field.args.push({
      name: "format",
      type: GraphQLString
    });

    field.resolve = async function(root, { format, ...rest }, ctx, info) {
      const date = await resolve.call(this, root, rest, ctx, info);
      return formatDate(date, format || defaultFormat);
    };
  }
}
const typeDefs = gql`
  directive @log(format: String) on FIELD_DEFINITION
  directive @formatDate(format: String = "d, MMM, yyyy") on FIELD_DEFINITION
  type User {
    id: ID! @log
    username: String!
    createdAt: String! @formatDate(format: "dd-MM-yyyy hh:mm")
    error: String @deprecated(reason: "I just feel like it")
  }

  type Item {
    task: String!
  }
  type Settings {
    user: User!
    theme: String!
  }

  type Query {
    me: User!
    settings(user: ID!): Settings!
  }
  input NewSettingsInput {
    user: ID!
    theme: String!
  }

  type Mutation {
    settings(input: NewSettingsInput!): Settings!
    newItem(task: String!): Item!
  }

  type Subscription {
    newItem: Item
  }
`;
const items = [];
const resolvers = {
  Query: {
    me() {
      return {
        id: "213322",
        username: "coder12",
        createdAt: 1571213104370
      };
    },
    settings(_, { user }) {
      return {
        user,
        theme: "The Light"
      };
    }
  },
  Mutation: {
    settings(_, { input }, context) {
      return input;
    },
    newItem(_, { task }, context) {
      const item = { task };
      items.push(item);
      console.log(item);
      pubsub.publish(NEW_ITEM, { newItem: item });
      return item;
    }
  },
  Subscription: {
    newItem: {
      subscribe: () => pubsub.asyncIterator(NEW_ITEM)
    }
  },

  Settings: {
    user(settings) {
      return {
        id: "213322",
        username: "coder12",
        createdAt: 1571213104370
      };
    }
  },
  User: {
    error() {
      return "Blaababa";
    }
  }
};

console.log(items);
const server = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives: {
    log: LogDirective,
    formatDate: FormatDateDirective
  },
  formatError(e) {
    console.log(Date.now().toLocaleString(), e);
    return e;
  },
  async context({ connection }) {
    if (connection) {
      return { ...connection.context };
    }
    return {};
  },
  subscriptions: {
    onConnect(connectionParams) {
      // handle Auth
    }
  }
});

server.listen().then(({ url }) => console.log(`Server running on ${url}`));
