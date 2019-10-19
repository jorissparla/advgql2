const { SchemaDirectiveVisitor } = require("apollo-server");
const { AuthenticationError } = require("apollo-server");
const { defaultFieldResolver, GraphQLString, GraphQLEnumType } = require("graphql");
const { formatDate } = require("./utils");

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

class AuthenticationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field;
    field.resolve = async (root, args, ctx, info) => {
      const { user } = ctx;
      console.log("the user is", user);
      if (!user) {
        throw new AuthenticationError("Not Authenticated");
      }
      return resolve.call(this, root, ctx, info);
    };
  }
}
class AuthorizationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field;
    const role = this.args;
    field.resolve = async (root, args, ctx, info) => {
      const { user } = ctx;
      if (ctx.user.role !== role) {
        throw new AuthenticationError("Not Authorized, wrong role");
      }
      return resolve.call(this, root, ctx, info);
    };
  }
}
module.exports = { LogDirective, FormatDateDirective, AuthorizationDirective, AuthenticationDirective };
