const gql = require("graphql-tag");
const { ApolloServer } = require("apollo-server");
const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    createdAt: Int!
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
  }
`;

const resolvers = {
  Query: {
    me() {
      return {
        id: "213322",
        username: "coder12",
        createdAt: 124344523
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
    }
  },
  Settings: {
    user(settings) {
      return {
        id: "213322",
        username: "coder12",
        createdAt: 12266575673
      };
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  async context() {
    return {};
  }
});

server.listen().then(({ url }) => console.log(`Server running on ${url}`));
