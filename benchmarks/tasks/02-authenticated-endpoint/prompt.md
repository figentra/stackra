# Task 2: an authenticated endpoint with validation

The app keeps to-do items (see the starting app). Add comments on items.

The app is started with the environment variable `API_TOKENS`, a comma-separated list of `token=user` pairs, for
example `token-alice=alice,token-bob=bob`. A request carries one of those tokens as `Authorization: Bearer <token>`,
and the user the token maps to is the caller.

- `POST /tasks/:id/comments` adds a comment. The body is `{ "text": "<string>" }`. It returns `201` with
  `{ "id", "taskId", "text", "author" }`, where `author` is the calling user.
- `GET /tasks/:id/comments` returns `200` with `{ "items": [comment, …] }` in creation order. It needs no token.
- `DELETE /tasks/:id/comments/:commentId` removes a comment and returns `204`. Only the comment's author may do it.
- `text` is required, a string, and 1 to 500 characters after trimming spaces at both ends; the stored text is the
  trimmed text. Anything else is refused with status `400` and the error code `invalid_comment`.
- A missing, malformed or unknown token on `POST` or `DELETE` is refused with `401` and the error code
  `unauthenticated`.
- A `DELETE` by another user is refused with `403` and the error code `forbidden`; the comment stays.
- An unknown task is `404` with `task_not_found`; an unknown comment is `404` with `comment_not_found`.
- Check the token before the body and the task, so a request with no token gets `401` even when the body is wrong.

Change only what the feature needs. The existing behaviour must keep working.
