import { gql } from "graphql-request";

export const GET_USER_BY_ID = gql`
  query GetUserById($id: uuid!) {
    users_by_pk(id: $id) {
      id
      username
      password_hash
      created_at
      updated_at
    }
  }
`;
