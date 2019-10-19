const gql = require("graphql-tag");
const createTestServer = require("./helper");
const CREATE_POST = gql`
  mutation {
    createPost(input: { message: "New Post" }) {
      message
    }
  }
`;

describe("mutation", () => {
  test("createPost", async () => {
    const { mutate } = createTestServer({
      user: { id: 1 },
      models: {
        Post: {
          createOne() {
            return {
              message: "New Post"
            };
          }
        }
      }
    });

    const res = await mutate({ mutation: CREATE_POST });
    expect(res).toMatchSnapshot();
  });
});
