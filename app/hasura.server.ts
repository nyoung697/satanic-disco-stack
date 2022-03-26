import { gql, GraphQLClient } from "graphql-request";
import { GET_USER_BY_ID } from "~/gql";
import {
  CreateUserMutation,
  CreateUserMutationVariables,
  GetUserByIdQuery,
  GetUserByIdQueryVariables,
  GetUserByUsernameQuery,
  GetUserByUsernameQueryVariables,
  UpdateUserPasswordByPkMutation,
  UpdateUserPasswordByPkMutationVariables,
} from "~/types/hasuragenerated";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || "";
const GRAPHQL_ADMIN_SECRET = process.env.GRAPHQL_ADMIN_SECRET || "";

if (!GRAPHQL_ENDPOINT || !GRAPHQL_ADMIN_SECRET) {
  throw new Error("GRAPHQL_ENDPOINT && GRAPHQL_ADMIN_SECRET must be set");
}

let hasuraClient: GraphQLClient | undefined;
function getHasuraClient(userId: string) {
  if (!hasuraClient) {
    hasuraClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
      headers: {
        "x-hasura-admin-secret": GRAPHQL_ADMIN_SECRET,
        "x-hasura-role": "user",
      },
    });
  }

  hasuraClient.setHeader("x-hasura-user-id", userId);

  return hasuraClient;
}

const hasuraAdminClient: GraphQLClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    "x-hasura-admin-secret": GRAPHQL_ADMIN_SECRET,
  },
});

export async function getUserById(id: string) {
  const { users_by_pk } = await hasuraAdminClient.request<
    GetUserByIdQuery,
    GetUserByIdQueryVariables
  >(GET_USER_BY_ID, {
    id,
  });

  if (!users_by_pk) {
    throw new Error("Invalid user id");
  }

  return users_by_pk;
}

export async function getUserByUsername(username: string) {
  const { users } = await hasuraAdminClient.request<
    GetUserByUsernameQuery,
    GetUserByUsernameQueryVariables
  >(
    gql`
      query GetUserByUsername($username: String!) {
        users(where: { username: { _eq: $username } }) {
          id
          username
          password_hash
          created_at
          updated_at
        }
      }
    `,
    {
      username,
    }
  );

  if (!users || !users.length) {
    return null;
  }

  return users[0];
}

export async function createUser(username: string, password_hash: string) {
  const { insert_users_one } = await hasuraAdminClient.request<
    CreateUserMutation,
    CreateUserMutationVariables
  >(
    gql`
      mutation CreateUser($object: users_insert_input!) {
        insert_users_one(object: $object) {
          id
          username
          password_hash
          created_at
          updated_at
        }
      }
    `,
    {
      object: {
        password_hash,
        username,
      },
    }
  );

  return insert_users_one;
}

export async function updateUserPasswordById(
  id: number,
  password_hash: string
) {
  const { update_users_by_pk } = await hasuraAdminClient.request<
    UpdateUserPasswordByPkMutation,
    UpdateUserPasswordByPkMutationVariables
  >(
    gql`
      mutation UpdateUserPasswordByPk($id: uuid!, $password_hash: String!) {
        update_users_by_pk(
          pk_columns: { id: $id }
          _set: { password_hash: $password_hash }
        ) {
          id
          username
          password_hash
          created_at
          updated_at
        }
      }
    `,
    { id, password_hash }
  );

  return update_users_by_pk;
}

export { getHasuraClient, hasuraAdminClient };
